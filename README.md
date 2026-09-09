# 日本語 Flashcards — Learn-JP

Ứng dụng học từ vựng tiếng Nhật bằng flashcard cho người Việt, có hệ thống ôn tập ngắt quãng (SRS) và 3 chế độ học khác nhau.

Stack: **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Prisma 7** · **PostgreSQL** · **Tailwind CSS v4**.

> ⚠️ Repo dùng **Next.js 16** — có nhiều breaking changes so với các phiên bản cũ. Đọc `AGENTS.md` và `node_modules/next/dist/docs/` trước khi viết code mới.

## Tính năng chính

- **3 chế độ học**: Flashcard (lật thẻ), Typing (gõ đáp án), Quiz (trắc nghiệm 4 lựa chọn).
- **SRS (Spaced Repetition System)**: thuật toán giãn cách lấy cảm hứng từ Anki, tự lên lịch ôn lại theo độ khó.
- **Phát âm tự động** bằng Web Speech API (`ja-JP`).
- **Hiển thị Furigana** trên Kanji bằng thẻ `<ruby>`.
- **Quản lý bộ thẻ**: thêm / sửa thẻ, lọc theo loại từ (Danh từ, Động từ, Tính từ な/い, Phó từ, Liên từ).
- **Lưu tiến trình lên PostgreSQL** qua Prisma; cài đặt cá nhân lưu ở `localStorage`.
- **Bàn phím tắt** cho cả 3 chế độ học.

## Bắt đầu nhanh

```bash
# 1. Cài dependencies (postinstall sẽ tự chạy prisma generate)
npm install

# 2. Cấu hình biến môi trường
cp .env.example .env   # tự tạo nếu chưa có — xem docs/setup.md
# Cần DATABASE_URL + DIRECT_URL trỏ tới Postgres, schema "learn_jp"

# 3. Đẩy schema vào DB
npm run db:push

# 4. Seed dữ liệu mẫu (tuỳ chọn)
npm run db:seed

# 5. Chạy dev server
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để dùng app.

## Scripts npm

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy Next.js ở chế độ dev |
| `npm run build` | Build production |
| `npm run start` | Chạy production server |
| `npm run lint` | Lint với ESLint |
| `npm run db:push` | Đẩy `schema.prisma` vào Postgres |
| `npm run db:seed` | Seed bộ thẻ mẫu (`prisma/seed.ts`) |
| `npm run db:import` | Import từ bảng `public.words` cũ vào schema `learn_jp` |

## Tài liệu chi tiết (Wiki)

Toàn bộ tài liệu thiết kế và hướng dẫn nằm trong thư mục [`docs/`](./docs):

- [**docs/setup.md**](./docs/setup.md) — Cài đặt môi trường, biến `.env`, khởi tạo DB.
- [**docs/architecture.md**](./docs/architecture.md) — Cây thư mục, luồng dữ liệu, các module chính.
- [**docs/features.md**](./docs/features.md) — Chi tiết 3 chế độ học, tabs Deck / Stats / Settings, phím tắt.
- [**docs/srs.md**](./docs/srs.md) — Thuật toán SRS: state machine, công thức `nextInterval`, ease factor.
- [**docs/api.md**](./docs/api.md) — Route handlers: `/api/cards`, `/api/cards/[id]`, `/api/progress`.
- [**docs/database.md**](./docs/database.md) — Prisma schema, model `Card` / `UserProgress`, schema `learn_jp`.

## Cấu trúc thư mục (tóm tắt)

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout (lang="vi")
│   ├── page.tsx              # UI chính (Home — client component)
│   ├── globals.css           # Tailwind + custom styles
│   └── api/                  # Route handlers
│       ├── cards/route.ts            # GET / POST cards
│       ├── cards/[id]/route.ts       # PATCH card
│       └── progress/route.ts         # POST progress (upsert SRS)
├── hooks/
│   └── useFlashcards.ts      # Toàn bộ state + SRS logic
└── lib/
    ├── prisma.ts             # PrismaClient singleton (adapter-pg)
    ├── types.ts              # Card, SRSData, StudySettings
    └── data.ts               # Bộ thẻ mặc định (fallback)

prisma/
├── schema.prisma             # Model Card + UserProgress
├── seed.ts                   # Seed bộ thẻ mặc định
└── import-words.ts           # Import dữ liệu cũ từ public.words

_legacy/                      # Bản vanilla HTML/CSS/JS cũ (chỉ tham khảo)
```

Xem [docs/architecture.md](./docs/architecture.md) để có sơ đồ đầy đủ.

## Đóng góp

1. Fork & tạo branch riêng (`devin/<timestamp>-mo-ta`).
2. Chạy `npm run lint` trước khi commit.
3. Mở PR vào `main`.

## Tham khảo Next.js

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Triển khai trên Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)

## iOS Native App

- Starter SwiftUI app is available in `ios/`.
- See `ios/README.md` for setup and integration instructions.
