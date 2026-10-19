# Chốt bộ icon Services V1 — chủ dự án duyệt 15/10/2026

Chủ dự án chọn ảnh bản **icon nét mảnh, nền pastel đậm hơn**, không chọn bản icon mảng đặc đề xuất sau đó. Antigravity triển khai đúng hướng này vào trang Services hiện có.

## Bộ icon đã chốt

| Dịch vụ | Hình icon | Nền tròn |
|---|---|---|
| Khám và điều trị | Ống nghe đơn giản, nét bo tròn | Cam đào đủ rõ |
| Spa & Grooming | Kéo đơn giản, không thêm lược | Xanh mint đủ rõ |
| Nội trú | Nhà nét viền, dấu chân ở giữa | Tím lilac |
| Cấp cứu 24/24 | Tim nét viền có đường nhịp | Hồng rose |

Icon tím đậm; nét đồng đều, giữ khoảng rỗng, không tô đặc silhouette. Chốt độ đậm của **màu nền**, không tăng độ dày viền. Không thêm lá, tia sáng, ngôi sao hay hiệu ứng rung/nhấp nháy lặp.

## Phạm vi thực hiện

- Chỉ thay bộ icon và nền huy hiệu trong bốn thẻ dịch vụ; giữ vị trí hiện tại, huy hiệu khoảng 52 px và icon khoảng 26–28 px. Dựng SVG để nét rõ ở kích thước thật.
- Ảnh người dùng chọn là ảnh ý tưởng. Việc chốt này **chỉ áp dụng cho bộ icon**; không thay logo chính thức, ảnh dịch vụ, bố cục hay dùng các câu mô tả chuyên môn do ảnh AI sinh ra. Giữ nội dung đã xác nhận/chữ giữ chỗ theo quyết định trước.
- Hàng “Chi tiết bộ icon” cuối ảnh chỉ để so sánh, không thêm lên web.
- Không thay luồng gọi cấp cứu, đặt lịch hay xử lý cửa sổ đã QA.

## Bàn giao lại

- Báo commit và ảnh xem thử desktop/mobile với bộ icon mới.
- Kiểm tra nét/dấu chân/đường nhịp không bị dính ở kích thước 26–28 px; nền đủ tương phản, không che chữ.
- Kiểm tra nút gọi cấp cứu và ba nút chi tiết vẫn hoạt động.

Codex chỉ ghi nhận quyết định; chưa sửa code hoặc merge. Bản SVG thực tế cần đối chiếu lại với ảnh người dùng chọn trước khi nghiệm thu.
