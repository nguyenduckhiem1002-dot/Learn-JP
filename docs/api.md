# API Reference

Tất cả endpoint là **Next.js App Router route handlers** dưới `src/app/api/`. Không có tầng auth — `USER_ID` hard-code `'default_user'`.

Base URL = origin của app (ví dụ `http://localhost:3000`).

## `GET /api/cards`

Lấy toàn bộ bộ thẻ kèm tiến trình SRS của user mặc định.

### Request

Không tham số.

### Response `200 OK`

Mảng `Card` (từ Prisma) — mỗi phần tử có thêm `progress: UserProgress[]` (`take: 1`).

```jsonc
[
  {
    "id": 1,
    "kanji": "大きい",
    "hiragana": "おおきい",
    "meaning": "to, lớn",
    "type": "Tính từ い",
    "exJp": "象は大きいです。",
    "exVn": "Con voi to.",
    "tip": "大 = đại = lớn",
    "img": null,
    "createdAt": "2025-01-01T...",
    "updatedAt": "2025-01-02T...",
    "progress": [
      {
        "id": 12,
        "cardId": 1,
        "userId": "default_user",
        "state": "review",
        "rating": "good",
        "ease": 2.65,
        "interval": 4320,
        "reps": 3,
        "dueDate": 1735689600000,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
]
```

Trên client, hook chuyển đổi qua `dbCardToCard()` / `dbProgressToSrs()` thành format ngắn (`k/h/v/t/...` + `SRSData`).

### Source

[`src/app/api/cards/route.ts`](../src/app/api/cards/route.ts)

```ts
prisma.card.findMany({
  include: { progress: { where: { userId: USER_ID }, take: 1 } },
  orderBy: { id: 'asc' },
});
```

---

## `POST /api/cards`

Thêm thẻ mới.

### Request body

```jsonc
{
  "k":   "新しい",          // kanji (mặt trước)
  "h":   "あたらしい",       // hiragana, optional → ''
  "v":   "mới",            // meaning
  "t":   "Tính từ い",      // type, optional → 'Danh từ'
  "ej":  "新しい車です。",   // example JP, optional → ''
  "ev":  "Xe mới.",         // example VN, optional → ''
  "tip": "新 = tân = mới",  // tip, optional → ''
  "img": null               // URL ảnh, optional → null
}
```

### Response `201 Created`

Object `Card` mới (Prisma row).

### Source

```ts
prisma.card.create({ data: { kanji: body.k, hiragana: body.h || '', ... } });
```

---

## `PATCH /api/cards/[id]`

Sửa thẻ theo `id` (toàn bộ trường — không phải partial update; mọi field thiếu sẽ bị set về giá trị mặc định).

### Path params

| Tham số | Kiểu |
|---|---|
| `id` | `number` (Prisma `Card.id`) |

> ⚠️ **Next.js 16**: `params` là **Promise**. Phải `await` trước khi đọc:
> ```ts
> export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
>   const { id } = await params;
>   ...
> }
> ```

### Request body

Giống `POST /api/cards`.

### Response `200 OK`

Object `Card` đã cập nhật.

### Source

[`src/app/api/cards/[id]/route.ts`](../src/app/api/cards/%5Bid%5D/route.ts)

---

## `POST /api/progress`

Upsert tiến trình SRS cho `(cardId, userId='default_user')`.

### Request body

```jsonc
{
  "cardId":   1,
  "state":    "review",   // 'new' | 'learn' | 'review'
  "rating":   "good",     // 'again' | 'hard' | 'good' | 'easy'
  "ease":     2.65,
  "interval": 4320,        // phút
  "reps":     3,
  "dueDate":  1735689600000 // timestamp ms, có thể null
}
```

### Response `200 OK`

```json
{ "ok": true }
```

### Source

[`src/app/api/progress/route.ts`](../src/app/api/progress/route.ts)

```ts
prisma.userProgress.upsert({
  where: { cardId_userId: { cardId, userId: USER_ID } },
  update: { state, rating, ease, interval, reps, dueDate: dueDate ?? null },
  create: { cardId, userId: USER_ID, state, rating, ease, interval, reps, dueDate: dueDate ?? null },
});
```

---

## Lỗi & xử lý

- Route handlers hiện chưa có `try/catch` toàn diện — lỗi Prisma sẽ trả về `500 Internal Server Error` mặc định của Next.js.
- Client (`useFlashcards`) chỉ `console.error` các lỗi của `POST /api/progress` để tránh chặn UI.
- Khi thêm validation, nên dùng [Zod](https://zod.dev/) ở layer route handler.

## Multi-user (chưa có)

Nếu cần multi-user, cần:

1. Thêm middleware auth (NextAuth, Clerk, Supabase Auth…).
2. Lấy `userId` từ session thay cho hằng số `USER_ID`.
3. Cập nhật `unique([cardId, userId])` đã có sẵn trong [`prisma/schema.prisma`](../prisma/schema.prisma) nên không cần đổi schema.
