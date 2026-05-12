# Cài đặt môi trường

Tài liệu này mô tả cách dựng môi trường dev cho Learn-JP từ máy trắng.

## Yêu cầu

- **Node.js ≥ 20** (theo `@types/node: ^20`).
- **PostgreSQL** (Postgres 13+). Có thể dùng local Postgres, Supabase, Neon, Railway, hoặc bất kỳ Postgres-managed nào.
- `npm` (project dùng `package-lock.json`).

## 1. Cài dependencies

```bash
npm install
```

Hook `postinstall` sẽ tự chạy `prisma generate` để sinh Prisma Client.

## 2. Biến môi trường

Tạo file `.env` ở thư mục gốc với 2 biến sau:

```env
# Connection pool (dùng cho Prisma runtime trong app)
DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DB?sslmode=require"

# Direct connection (dùng cho prisma migrate / db push / seed / import)
DIRECT_URL="postgres://USER:PASSWORD@HOST:PORT/DB?sslmode=require"
```

### Vì sao có 2 URL?

- `DATABASE_URL` dùng cho runtime của app — có thể trỏ qua connection pooler (PgBouncer, Supabase pooler...).
- `DIRECT_URL` dùng cho các tác vụ migration của Prisma — bắt buộc là kết nối trực tiếp, không qua pooler, vì Prisma cần dùng các session-level features.

Khi dùng cùng một Postgres local thì cả hai có thể trỏ tới cùng một URL.

### Schema `learn_jp`

App đọc/ghi vào schema `learn_jp` (không phải `public`):

- `src/lib/prisma.ts` khởi tạo `PrismaPg` với `{ schema: 'learn_jp' }`.
- `prisma/seed.ts` và `prisma/import-words.ts` cũng cấu hình tương tự.

Đảm bảo schema này tồn tại trước khi `db:push`:

```sql
CREATE SCHEMA IF NOT EXISTS learn_jp;
```

## 3. Khởi tạo schema DB

```bash
npm run db:push
```

Lệnh này chạy `prisma db push` — đồng bộ `prisma/schema.prisma` vào database (tạo bảng `Card` và `UserProgress`). Lưu ý: `db push` không sinh migration; phù hợp cho dev. Khi cần migration production, dùng `prisma migrate dev` / `prisma migrate deploy`.

## 4. Seed dữ liệu mẫu

```bash
npm run db:seed
```

Chạy `prisma/seed.ts` — nạp bộ thẻ từ vựng tiếng Nhật–Việt mặc định. Script tự bỏ qua các thẻ đã tồn tại (so khớp theo `kanji`).

## 5. Import từ bảng cũ (tuỳ chọn)

Nếu bạn có dữ liệu cũ ở bảng `public.words` (từ phiên bản trước của app), có thể import sang schema `learn_jp`:

```bash
npm run db:import
```

Script `prisma/import-words.ts` sẽ:
1. Đọc `public.words` qua `pg` Pool (bỏ tham số `&schema=learn_jp` khỏi `DIRECT_URL`).
2. Parse `term` theo pattern `漢字 (よみ)` để tách kanji + hiragana.
3. Insert vào `learn_jp.Card`, bỏ qua trùng `kanji`.

## 6. Chạy app

```bash
npm run dev
```

Truy cập http://localhost:3000.

## Các lệnh khác

| Lệnh | Tác dụng |
|---|---|
| `npm run build` | Build production (`.next/`) |
| `npm run start` | Chạy server từ build production |
| `npm run lint` | Lint với ESLint (config tại `eslint.config.mjs`) |

## Triển khai

Project được thiết kế để chạy thẳng trên [Vercel](https://vercel.com). Khi deploy chỉ cần:

1. Đặt `DATABASE_URL` và `DIRECT_URL` trong Environment Variables của Vercel.
2. Đảm bảo schema `learn_jp` đã tồn tại trong DB production.
3. Vercel sẽ tự chạy `npm run build`; `postinstall` lo phần `prisma generate`.

## Khắc phục sự cố

- **`Can't reach database server`** → kiểm tra `DATABASE_URL`, firewall, `sslmode`.
- **`relation "learn_jp.Card" does not exist`** → schema `learn_jp` chưa có hoặc chưa `db:push`.
- **Prisma Client chưa generate** → chạy lại `npm install` hoặc `npx prisma generate`.
- **Speech / audio không phát** → trình duyệt cần hỗ trợ Web Speech API và voice `ja-JP`; Chrome/Edge có sẵn, Firefox cần cài voice riêng.
