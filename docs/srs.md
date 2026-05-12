# Thuật toán SRS

App dùng một biến thể đơn giản của thuật toán **SM-2** (Anki-style) — đủ dùng cho học từ vựng, không phức tạp như Anki gốc.

Toàn bộ logic nằm trong [`src/hooks/useFlashcards.ts`](../src/hooks/useFlashcards.ts).

## Mô hình dữ liệu

```ts
type SRSState = 'new' | 'learn' | 'review';
type CardRating = 'again' | 'hard' | 'good' | 'easy' | null;

interface SRSData {
  rating: CardRating;   // lần đánh giá gần nhất
  state: SRSState;      // trạng thái hiện tại của thẻ
  ease: number;         // hệ số dễ (mặc định 2.5)
  interval: number;     // khoảng thời gian tới lần ôn kế (đơn vị: phút)
  reps: number;         // số lượt đã ôn
  dueDate?: number;     // timestamp (ms) khi thẻ đến hạn ôn lại
}
```

State machine:

```
        ┌────────┐  rate any  ┌────────┐
        │  new   │ ─────────▶ │ learn  │
        └────────┘            └────┬───┘
                                   │ rate good/easy
                                   ▼
                              ┌────────┐
                              │ review │
                              └────┬───┘
                                   │ rate again/hard
                                   └──▶ quay lại "learn"
```

- **new**: thẻ chưa bao giờ được đánh giá (`reps === 0`).
- **learn**: thẻ vừa đánh giá again/hard, cần ôn nhanh (≤ vài giờ).
- **review**: thẻ đã ổn định, lịch ôn tính theo `ease`.

## Công thức `nextInterval`

Trả về interval mới (phút) dựa trên rating:

```ts
const m = settings.easeMultiplier;          // 0.8 | 1.0 | 1.2 | 1.5
const base = srs.interval || 1440;          // 1440 phút = 1 ngày
```

### Lần đầu (`reps === 0`)

| Rating | Interval (phút) |
|---|---|
| `again` | 1 |
| `hard` | 6 |
| `good` | 10 |
| `easy` | `4 * 1440` (4 ngày) |

### Các lần sau

| Rating | Công thức |
|---|---|
| `again` | `10` (reset ngắn, học lại) |
| `hard` | `base * 1.2 * m` |
| `good` | `base * srs.ease * m` |
| `easy` | `base * srs.ease * 1.3 * m` |

## Cập nhật `ease`

`ease` (hệ số dễ riêng cho từng thẻ) khởi tạo = `2.5`. Cập nhật sau mỗi rate:

| Rating | Thay đổi `ease` |
|---|---|
| `again` | `-0.2`, không nhỏ hơn `1.3` |
| `hard` | `-0.15`, không nhỏ hơn `1.3` |
| `good` | giữ nguyên |
| `easy` | `+0.15` |

## State transitions

```ts
if (rating === 'again') s.state = 'learn';
if (rating === 'hard')  s.state = 'learn';
if (rating === 'good')  s.state = 'review';
if (rating === 'easy')  s.state = 'review';
```

`dueDate` = `Date.now() + interval * 60_000`.

`reps++` mỗi lần rate (bao gồm cả again).

## Queue trong phiên học

Khi gọi `startSession()`:

1. Duyệt `filteredMap` (mảng index thẻ theo filter loại từ hiện tại).
2. **Thẻ `new`** — thêm vào queue cho đến khi đạt `dailyNew`.
3. **Thẻ khác** — thêm vào queue nếu:
   - chưa có `dueDate`, hoặc
   - `dueDate <= now`, hoặc
   - `state === 'learn'`,
   
   cho đến khi đạt `dailyReview`.
4. **Shuffle** queue bằng Fisher–Yates.

Trong phiên:

- `again` hoặc `hard` → đẩy thẻ về cuối queue (nếu chưa có sẵn ở phần queue chưa duyệt) để bạn ôn lại trong cùng phiên.
- `good` / `easy` → đi tiếp, không quay lại.

## Định dạng interval (`fmtInterval`)

| Phút | Hiển thị |
|---|---|
| `< 2` | `<1m` |
| `< 1440` | `Nm` |
| `≥ 1440` | `Nd` (số ngày làm tròn) |

Dùng để hiển thị ước lượng "lần ôn kế tiếp" trên nút rate ở mặt sau flashcard.

## Đồng bộ với DB

Sau mỗi `handleRate`:

1. Cập nhật `srsData[allIdx]` trong state (tối ưu UI).
2. Gửi **`POST /api/progress`** với payload đầy đủ `SRSData` để upsert.
3. Lỗi mạng được `console.error` — không rollback UI (để không gián đoạn người dùng).

```ts
fetch('/api/progress', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cardId: card.id, ...s }),
});
```

API handler `src/app/api/progress/route.ts` upsert vào `learn_jp.UserProgress` (xem [docs/api.md](./api.md)).

## So sánh với SM-2 / Anki

| Đặc điểm | SM-2 / Anki | Learn-JP |
|---|---|---|
| 4 rating | ✓ | ✓ |
| `ease` riêng từng thẻ | ✓ | ✓ (clamp ≥1.3) |
| Bước "learning" phụ (1m, 10m, 1d) | ✓ | Giản lược (`again=10m`) |
| Fuzz factor ngẫu nhiên | ✓ | ✗ |
| Lapse threshold | ✓ | ✗ |
| Filter deck phức tạp | ✓ | ✗ (chỉ theo loại từ) |
| Multi-user | ✓ | ✗ (`USER_ID='default_user'`) |

Roadmap tiềm năng: thêm fuzz, bước learning đa giai đoạn, multi-user.

## Tuỳ chỉnh nhanh

`easeMultiplier` trong Settings là cách dễ nhất để điều chỉnh:

- **0.8** — học khó nhớ, ép ôn lại sát nút.
- **1.0** — chuẩn.
- **1.2** — học nhanh, giãn cách rộng hơn.
- **1.5** — chỉ cho từ rất quen, giãn cách rất rộng.
