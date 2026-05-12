# Kiến trúc

Tài liệu này mô tả cấu trúc code, luồng dữ liệu và quy ước trong Learn-JP.

## Tổng quan

App là một **Single Page App** chạy trên Next.js 16 App Router:

- Toàn bộ UI nằm trong **một client component duy nhất** (`src/app/page.tsx`) — chuyển tab bằng state, không có route phụ.
- Logic SRS và state thẻ tập trung trong hook `useFlashcards`.
- Tầng dữ liệu là 3 route handlers (REST style) gọi vào Prisma.
- Persistence: thẻ + tiến trình SRS lưu PostgreSQL; cài đặt người dùng lưu `localStorage`.

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  src/app/page.tsx  (Home, "use client")              │   │
│  │   ├── Tabs: study | deck | stats | settings          │   │
│  │   ├── StudyMode: flashcard | typing | quiz           │   │
│  │   └── Modals: Add / View-Edit / Settings             │   │
│  └────────────┬─────────────────────────────────────────┘   │
│               │ uses                                        │
│  ┌────────────▼─────────────────────────────────────────┐   │
│  │  useFlashcards()                                     │   │
│  │   - cards, srsData, settings, sessionStats           │   │
│  │   - queue / queuePos / handleRate / nextInterval     │   │
│  │   - addCard / editCard / startSession / changeFilter │   │
│  └────────────┬─────────────────────────────────────────┘   │
│               │ fetch                                       │
│               ▼                                             │
│   /api/cards   /api/cards/[id]   /api/progress              │
└─────────────────────────────────────────────────────────────┘
                        │ Prisma (pg adapter, schema=learn_jp)
                        ▼
                ┌──────────────────┐
                │  PostgreSQL      │
                │   learn_jp.Card  │
                │   learn_jp.UserProgress
                └──────────────────┘
```

## Cây thư mục

```
.
├── AGENTS.md / CLAUDE.md         # Lưu ý cho AI agent (Next.js 16 breaking changes)
├── README.md                     # Entry point của tài liệu
├── docs/                         # ← bạn đang ở đây
├── eslint.config.mjs             # ESLint (Next.js + TS preset)
├── next.config.ts                # Next.js config (rỗng)
├── package.json
├── postcss.config.mjs            # Tailwind v4 via PostCSS
├── prisma/
│   ├── schema.prisma             # Model Card + UserProgress
│   ├── seed.ts                   # Seed thẻ mặc định
│   └── import-words.ts           # Migration từ public.words → learn_jp
├── prisma.config.ts              # Prisma config (dùng DIRECT_URL)
├── public/                       # SVG assets
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout, <html lang="vi">
│   │   ├── page.tsx              # Toàn bộ UI client
│   │   ├── globals.css           # Tailwind + style tuỳ biến
│   │   ├── favicon.ico
│   │   └── api/
│   │       ├── cards/route.ts          # GET, POST
│   │       ├── cards/[id]/route.ts     # PATCH
│   │       └── progress/route.ts       # POST (upsert)
│   ├── hooks/
│   │   └── useFlashcards.ts      # State + SRS logic
│   └── lib/
│       ├── prisma.ts             # PrismaClient singleton
│       ├── types.ts              # Card, SRSData, StudySettings
│       └── data.ts               # ALL_CARDS (bộ thẻ tĩnh, làm fallback)
├── tsconfig.json
├── tsconfig.prisma.json
└── _legacy/                      # Bản HTML/CSS/JS tĩnh cũ — không build
```

## Các module chính

### `src/app/page.tsx`

Component `Home` là **client component** (`'use client'`) chứa toàn bộ UI:

- 4 tab: `study | deck | stats | settings` (state `activeTab`).
- 3 chế độ học: `flashcard | typing | quiz` (state `studyMode`).
- Modal: thêm thẻ, xem/sửa thẻ, cài đặt.
- Bàn phím tắt: Space/Enter lật thẻ, 1/2/3 đánh giá, 1–4 chọn quiz.
- Phát âm bằng `SpeechSynthesisUtterance` với `lang = 'ja-JP'`.
- Hiển thị furigana bằng thẻ `<ruby>` khi card có ký tự Kanji (regex `/[一-鿿]/`).

### `src/hooks/useFlashcards.ts`

Hook duy nhất quản lý toàn bộ state thẻ + SRS. Trách nhiệm chính:

| Khối | Mô tả |
|---|---|
| Load | Khi mount → `fetch('/api/cards')` + đọc `localStorage('study_settings')`. |
| Filter | `filteredMap`: mảng index của các thẻ khớp filter loại từ. |
| Session | `startSession()` xáo thẻ theo `dailyNew` / `dailyReview` và tạo `queue`. |
| Flip | `toggleFlip()` + đánh dấu `hasRevealed`. |
| Rate | `handleRate(rating)` áp dụng SRS, animate swipe, gọi `/api/progress`. |
| CRUD | `addCard` (POST), `editCard` (PATCH). |
| Stats | `stats` (đếm new/learn/review) + `sessionStats` (lượt rate trong phiên). |

Xem chi tiết thuật toán SRS trong [docs/srs.md](./srs.md).

### `src/lib/prisma.ts`

Singleton `PrismaClient` dùng adapter `@prisma/adapter-pg`. Bind vào schema `learn_jp`. Tránh tạo nhiều instance khi hot-reload bằng `globalThis.prisma`.

```ts
const adapter = new PrismaPg(
  { connectionString: process.env.DATABASE_URL! },
  { schema: 'learn_jp' }
);
```

### `src/lib/types.ts`

```ts
type CardType = 'Tính từ な' | 'Tính từ い' | 'Danh từ' | 'Phó từ' | 'Liên từ' | 'Động từ';
type CardRating = 'again' | 'hard' | 'good' | 'easy' | null;
type SRSState = 'new' | 'learn' | 'review';

interface Card { id?, k, h, v, t, ej, ev, tip, img? }
interface SRSData { rating, state, ease, interval, reps, dueDate? }
interface StudySettings { dailyNew, dailyReview, easeMultiplier }
```

Các ký tự ngắn (`k`, `h`, `v`, …) tương ứng với:
- `k` = kanji (mặt trước), `h` = hiragana, `v` = nghĩa Việt
- `t` = type (loại từ), `ej` = câu ví dụ tiếng Nhật, `ev` = ví dụ tiếng Việt
- `tip` = ghi chú/mẹo nhớ, `img` = URL ảnh minh hoạ (tuỳ chọn)

### `src/lib/data.ts`

Mảng `ALL_CARDS: Card[]` — bộ thẻ tĩnh đi kèm code, dùng làm fallback hoặc nguồn cho seed cũ. Hiện app sẽ ưu tiên lấy từ DB, file này chỉ giữ làm tham chiếu.

### `prisma/*`

- `schema.prisma` — định nghĩa `Card` + `UserProgress` (xem [docs/database.md](./database.md)).
- `seed.ts` — chứa mảng `CARDS` lớn, insert bằng `createMany`.
- `import-words.ts` — di chuyển dữ liệu từ `public.words` (model cũ) sang `learn_jp.Card`.

## Luồng dữ liệu

### Khởi tạo

1. `useFlashcards` chạy `useEffect` → `fetch('/api/cards')`.
2. API trả về `Card` join với `UserProgress` (lọc theo `userId='default_user'`).
3. Hook chuyển sang dạng nội bộ qua `dbCardToCard` / `dbProgressToSrs`.

### Đánh giá thẻ

1. User bấm nút (hoặc phím 1/2/3) → `handleRate(rating)`.
2. Hook tính `nextInterval`, cập nhật state cục bộ `srsData[allIdx]`.
3. Gửi `POST /api/progress` để upsert `UserProgress` trên DB.
4. Tăng `queuePos`; nếu là `again`/`hard` thì đẩy thẻ lại cuối queue.
5. UI play animation swipe trái/phải 300ms.

### Cài đặt

- Lưu thẳng vào `localStorage` (key `study_settings`) — không gọi API.
- Đọc lại khi reload qua `useEffect` đầu tiên.

## Quy ước

- **i18n**: toàn bộ UI tiếng Việt; `<html lang="vi">`.
- **State**: dùng React `useState` + `useMemo` + `useCallback`. Không có Redux/Zustand.
- **Styling**: Tailwind v4 (PostCSS) + class tuỳ biến trong `globals.css`. Không có CSS Modules.
- **Type safety**: TS strict mode. Tránh `any`/`getattr`-style; mọi dữ liệu DB đi qua adapter helper (`dbCardToCard`).
- **Server vs Client**: tất cả render UI là client (do dùng Speech API + localStorage); route handlers chạy server-side.
- **Next.js 16**: theo `AGENTS.md`, đây không phải Next.js bạn đã quen — đọc `node_modules/next/dist/docs/` cho API mới (ví dụ `params: Promise<...>` trong route handlers).

## Mở rộng

- **Thêm loại từ mới**: cập nhật `CardType` trong `types.ts` + filter UI trong `page.tsx`.
- **Thêm chế độ học mới**: thêm vào union `StudyMode`, viết nhánh trong `renderStudyFace()` và logic phím tắt.
- **Multi-user**: hiện hard-code `USER_ID = 'default_user'`. Để chuẩn hoá cần thêm auth (NextAuth, Clerk, …) và truyền `userId` từ session vào API.
