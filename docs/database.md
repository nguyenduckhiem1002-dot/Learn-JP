# Database

PostgreSQL + Prisma 7 (`@prisma/client` + adapter `@prisma/adapter-pg`). Tất cả model nằm trong schema `learn_jp`.

## Schema Prisma

File [`prisma/schema.prisma`](../prisma/schema.prisma):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model Card {
  id        Int            @id @default(autoincrement())
  kanji     String
  hiragana  String
  meaning   String
  type      String
  exJp      String         @default("")
  exVn      String         @default("")
  tip       String         @default("")
  img       String?
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  progress  UserProgress[]
}

model UserProgress {
  id        Int      @id @default(autoincrement())
  cardId    Int
  userId    String   @default("default_user")
  state     String   @default("new")
  rating    String?
  ease      Float    @default(2.5)
  interval  Float    @default(0)
  reps      Int      @default(0)
  dueDate   Float?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  card      Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@unique([cardId, userId])
}
```

## Model `Card`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | int (PK) | autoincrement |
| `kanji` | text | mặt trước, có thể chứa pattern `漢字[ふりがな]` |
| `hiragana` | text | phiên âm, có thể rỗng |
| `meaning` | text | nghĩa tiếng Việt |
| `type` | text | `Tính từ な` / `Tính từ い` / `Danh từ` / `Phó từ` / `Liên từ` / `Động từ` |
| `exJp` | text | câu ví dụ tiếng Nhật |
| `exVn` | text | câu ví dụ tiếng Việt |
| `tip` | text | mẹo nhớ |
| `img` | text? | URL ảnh minh hoạ |
| `createdAt` / `updatedAt` | timestamp | tự động |

## Model `UserProgress`

Lưu trạng thái SRS riêng cho mỗi cặp `(cardId, userId)`.

| Cột | Kiểu | Default | Ghi chú |
|---|---|---|---|
| `id` | int (PK) | autoincrement | |
| `cardId` | int (FK) | – | xoá `Card` → cascade |
| `userId` | text | `'default_user'` | hiện hard-code |
| `state` | text | `'new'` | `new | learn | review` |
| `rating` | text? | – | `again | hard | good | easy` |
| `ease` | float | `2.5` | hệ số dễ (≥ 1.3 trong logic) |
| `interval` | float | `0` | phút tới lần ôn kế |
| `reps` | int | `0` | số lượt đã rate |
| `dueDate` | float? | – | timestamp (ms) khi đến hạn |
| `createdAt` / `updatedAt` | timestamp | – | |

Ràng buộc: `@@unique([cardId, userId])` → mỗi user chỉ có 1 record progress cho mỗi card.

## Schema riêng `learn_jp`

Cả `src/lib/prisma.ts` lẫn các script trong `prisma/` đều bind vào schema `learn_jp` (không phải `public`):

```ts
const adapter = new PrismaPg(
  { connectionString: process.env.DATABASE_URL! },
  { schema: 'learn_jp' }
);
```

⚠️ Schema phải tồn tại **trước khi** chạy `prisma db push`:

```sql
CREATE SCHEMA IF NOT EXISTS learn_jp;
```

## Hai connection string

| Biến | Dùng cho | Ghi chú |
|---|---|---|
| `DATABASE_URL` | Runtime app (`src/lib/prisma.ts`) | Có thể qua pooler (PgBouncer, Supabase pooler). |
| `DIRECT_URL` | `prisma db push` / `migrate` / seed / import | Bắt buộc connect trực tiếp (không pooler). Cấu hình ở `prisma.config.ts`. |

## Lệnh quản lý

```bash
# Đẩy schema vào DB (dev). Không sinh migration file.
npm run db:push

# Seed bộ thẻ mẫu (idempotent — bỏ qua kanji trùng).
npm run db:seed

# Import từ public.words (model cũ) sang learn_jp.Card.
npm run db:import

# Mở Prisma Studio (gõ trực tiếp):
npx prisma studio
```

## Sinh `prisma/migrations/`

Hiện workflow dev dùng `db push` để đồng bộ nhanh. Nếu cần migration có lịch sử:

```bash
npx prisma migrate dev --name init   # tạo migration đầu tiên
npx prisma migrate deploy            # áp dụng lên production
```

`prisma.config.ts` đã set `migrations.path = 'prisma/migrations'`.

## Lưu ý dữ liệu

- `Card.kanji` **không unique** ở DB. `prisma/import-words.ts` và `prisma/seed.ts` đều tự dedupe bằng cách query trước rồi filter.
- `UserProgress.interval` và `dueDate` lưu kiểu `Float` để chứa giá trị lớn (timestamp ms vượt range int32).
- Khi xoá `Card`, các `UserProgress` liên quan bị xoá theo do `onDelete: Cascade`.
