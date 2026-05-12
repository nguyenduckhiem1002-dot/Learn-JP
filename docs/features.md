# Tính năng

App tổ chức quanh **4 tab** ở thanh dưới (`activeTab`) và **3 chế độ học** (`studyMode`).

## Tab Study (Học)

Trang chủ. Hiển thị thống kê nhanh + 3 nút bắt đầu phiên học:

| Nút | Chế độ | Mô tả |
|---|---|---|
| ▤ Lật thẻ | `flashcard` | Xem mặt trước, lật để thấy nghĩa, tự đánh giá khó/dễ. |
| ⊞ Trắc nghiệm | `quiz` | Chọn 1 trong 4 đáp án (3 nhiễu + 1 đúng). |
| ›_ Gõ từ | `typing` | Nhập kanji/hiragana từ nghĩa tiếng Việt. |

Số liệu hiển thị:

- **mới** — thẻ chưa từng học (`state = 'new'`).
- **học lại** — thẻ đến hạn ôn hoặc đã đánh `again`/`hard` (`state = 'learn'` hoặc `dueDate <= now`).
- **đã ôn** — thẻ đã ổn định trong vòng quay SRS.

## Tab Deck (Bộ thẻ)

- Lọc theo loại từ: *Tất cả* / *Tính từ な* / *Tính từ い* / *Danh từ* / *Phó từ* / *Liên từ*.
- Grid mini-card hiển thị kanji, hiragana, nghĩa.
- Mỗi mini-card có chấm màu theo trạng thái SRS (xám = new, đỏ = đến hạn, xanh = đã ôn).
- Click vào mini-card mở modal **xem/sửa**.
- Nút **＋ Thêm từ** mở modal thêm thẻ mới.

### Modal thêm/sửa thẻ

Các trường:

| Field | Ý nghĩa | Bắt buộc |
|---|---|---|
| `k` (kanji) | Mặt trước, có thể có pattern `漢字[ふりがな]` | ✓ |
| `h` (hiragana) | Phiên âm | tuỳ |
| `v` (nghĩa) | Nghĩa tiếng Việt | ✓ |
| `t` (type) | Loại từ | mặc định `Danh từ` |
| `ej` (example JP) | Câu ví dụ tiếng Nhật | tuỳ |
| `ev` (example VN) | Câu ví dụ tiếng Việt | tuỳ |
| `tip` | Mẹo nhớ / ghi chú | tuỳ |
| `img` | URL ảnh minh hoạ | tuỳ |

## Tab Stats (Thống kê)

Đang ở dạng placeholder. Roadmap: biểu đồ retention, số lượt ôn theo ngày, tỉ lệ again/good.

## Tab Settings (Cài đặt)

3 thông số (lưu `localStorage` key `study_settings`):

| Field | Range | Mặc định | Tác dụng |
|---|---|---|---|
| `dailyNew` | 1–100 | 10 | Số thẻ mới tối đa thêm vào mỗi phiên. |
| `dailyReview` | 1–500 | 50 | Số thẻ ôn tối đa mỗi phiên. |
| `easeMultiplier` | 0.8/1.0/1.2/1.5 | 1.0 | Hệ số nhân lên `nextInterval`. |

## Chế độ học chi tiết

### Flashcard

1. **Mặt trước**: hiện kanji (kèm furigana qua `<ruby>` nếu có ký tự kanji), nút loa phát âm, số thứ tự trong phiên, badge loại từ, badge trạng thái SRS.
2. **Tự động phát âm** mặt trước (`SpeechSynthesisUtterance` với `lang='ja-JP'`, rate 0.85). Pattern `漢字[ふりがな]` được loại bỏ ngoặc trước khi đọc.
3. Nhấn **Space/Enter** hoặc click thẻ → lật.
4. **Mặt sau**: nghĩa, tags (Na-adj / I-adj / Katakana / Từ mượn / loại từ), ví dụ JP+VN, ảnh nếu có.
5. Đánh giá:

   | Phím | Đánh giá | Hành vi |
   |---|---|---|
   | `1` | Again | Đẩy thẻ về cuối queue, interval reset gần (10 phút), giảm `ease` 0.2. |
   | `2` | Hard | Đẩy thẻ về cuối queue, `interval *= 1.2`, giảm `ease` 0.15. |
   | `3` | Good | Đi tiếp, `interval *= ease`. |
   | (no key) | Easy | Đi tiếp, `interval *= ease * 1.3`, tăng `ease` 0.15. |

   Animation swipe trái (đỏ) cho again/hard, phải (xanh) cho good/easy.

### Typing

1. Hiện nghĩa tiếng Việt + ô input.
2. Người dùng gõ kanji hoặc hiragana (so sánh `toLowerCase()` với `k` đã bỏ `[]` hoặc `h`).
3. **Đúng** → phát âm, tự rate `good`, đi tiếp.
4. **Sai** → input đỏ, hiện đáp án (`revealed`), tự rate `again` khi nhấn "Tiếp tục".

### Quiz

1. Hiện nghĩa tiếng Việt + 4 nút lựa chọn kanji.
2. Bộ lựa chọn = 3 thẻ random khác filter + thẻ đúng, shuffle.
3. Phím **1/2/3/4** hoặc click để chọn.
4. **Đúng** → tô xanh, phát âm, rate `good` sau 800 ms.
5. **Sai** → tô đỏ + tô xanh đáp án đúng, rate `again` sau 1500 ms.

## Phím tắt tổng hợp

| Phím | Flashcard | Quiz | Typing |
|---|---|---|---|
| Space / Enter | Lật thẻ | – | Submit (mặc định form) |
| 1 | Again | Chọn lựa chọn 1 | – |
| 2 | Hard | Chọn lựa chọn 2 | – |
| 3 | Good | Chọn lựa chọn 3 | – |
| 4 | – | Chọn lựa chọn 4 | – |

Phím tắt bị vô hiệu khi đang mở modal Add/Settings.

## Hiển thị Furigana

App phát hiện ký tự kanji bằng regex `/[一-鿿]/`. Khi thẻ có kanji và có `h` (hiragana), dùng `<ruby>kanji<rt>hiragana</rt></ruby>` để render furigana mặt trên kanji.

Hỗ trợ pattern `漢字[ふりがな]` — phần trong `[]` được hiển thị tách như chú thích phụ.

## Lưu trữ trạng thái

| Dữ liệu | Nơi lưu |
|---|---|
| Bộ thẻ (`Card`) | PostgreSQL — `learn_jp.Card` |
| Tiến trình SRS (`UserProgress`) | PostgreSQL — `learn_jp.UserProgress` |
| Cài đặt người dùng | `localStorage` (`study_settings`) |
| Trạng thái phiên (queue, queuePos…) | React state (mất khi reload) |
