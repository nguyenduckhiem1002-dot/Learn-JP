# LearnJP iOS (SwiftUI Native)

Thư mục này chứa bộ khung app iOS native (SwiftUI) dùng lại backend hiện tại của web app.

## Cách chạy

1. Mở Xcode 16+.
2. Tạo project mới iOS App tên `LearnJP` (SwiftUI, Swift).
3. Chép toàn bộ source trong `ios/LearnJP/LearnJP/` vào target app.
4. Chạy web backend (Next.js) ở máy local hoặc server.
5. Vào tab **Cấu hình** trong app iOS, điền `Base URL` (ví dụ `http://localhost:3000`) và token nếu cần.

## API đang dùng

- `GET /api/cards`
- `POST /api/progress`

## Kế hoạch nâng cấp để production

- Thêm Sign in with Apple / OAuth.
- Lưu token trong Keychain thay vì memory.
- Offline cache bằng SwiftData/CoreData.
- Push notification + background refresh.
- Đồng bộ analytics và crash reporting.
