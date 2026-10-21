# "Xem như máy tính / điện thoại" (thiết kế ngắn)

Ngày: 21/10/2026 · Chủ dự án yêu cầu và đồng ý cách làm trong hội thoại 21/10; cho phép nhánh dữ liệu làm ở thư mục giao diện (`src/app`, `src/main.tsx`) vì nhánh giao diện đang bận, rồi báo bên kia.

## Mục tiêu

Người xem bản demo chọn được **kiểu xem** — Máy tính hoặc Điện thoại — và **cỡ màn hình** cụ thể, để thấy bố cục hiển thị thế nào trên từng loại máy ngay trên một trình duyệt.

## Cách làm

- Bản demo chạy trong một **khung `iframe`** đúng cỡ đã chọn. Phải là khung riêng vì bố cục đổi theo chiều rộng cửa sổ (media query); thu nhỏ ảnh trang thì không ra bố cục điện thoại.
- Cỡ có sẵn (`src/app/device/devices.ts`):
  - Máy tính: 1920 × 1080 · 1440 × 900 (mặc định) · 1366 × 768 · 1280 × 720.
  - Điện thoại: 430 × 932 · 390 × 844 (mặc định) · 360 × 800 · 320 × 568.
  - "Xem bình thường" = cỡ thật của trình duyệt như trước.
- Vào từ menu chip "Bản demo · dữ liệu mẫu" (mục "Xem như máy tính" / "Xem như điện thoại"). Sau đó một thanh công cụ trên đầu có: nút Máy tính / Điện thoại, ô chọn "Cỡ màn hình", dòng "Thu nhỏ còn N% cho vừa cửa sổ", nút "Xem bình thường".
- Khung tự thu nhỏ cho vừa cửa sổ (không phóng to, tối thiểu 20%). Khung điện thoại có viền máy.
- Lựa chọn lưu ở `localStorage` (`leson:device`); giá trị lạ hoặc hỏng → xem bình thường. Đổi cỡ không tải lại trang bên trong.
- Dữ liệu mẫu và phiên đăng nhập dùng chung (cùng trình duyệt, cùng thẻ). Bản trong khung biết mình ở trong khung nhờ tên cửa sổ `leson-device-frame` (không dùng `window.top`, vì Artifact tự nó đã nằm trong khung): ẩn mục "Xem như…" của chip, báo cho trang ngoài khi đã mở và khi đổi trang (`postMessage`), để tải lại vẫn ở đúng trang.
- Nếu trang ngoài không nhận được tín hiệu "đã mở" sau 6 giây (ví dụ máy chủ chặn đặt trang trong khung): hiện dòng báo và nút "Xem bình thường" vẫn dùng được.

## Chưa kiểm chứng

Trên bản xem trước claude.ai (Artifact, trang đơn): chưa thử khung tự nhúng chính trang đó. Nếu chặn thì hiện dòng báo ở trên; tính năng vẫn dùng đầy đủ khi chạy bản thường.

## Kiểm thử

Unit: danh sách cỡ, đọc/ghi lựa chọn (giá trị lạ, hỏng, bị chặn), tính tỉ lệ thu nhỏ. E2E `e2e/xem-thiet-bi.spec.ts`: khung đúng chiều rộng, đổi cỡ không tải lại, đổi kiểu, thu nhỏ khi cửa sổ nhỏ, thoát về bản thường, menu chip, chip trong khung không hiện lại mục "Xem như", nhớ trang, giá trị lạ, axe.
