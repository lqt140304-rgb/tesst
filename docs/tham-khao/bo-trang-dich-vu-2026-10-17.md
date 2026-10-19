# Bỏ hẳn trang Dịch vụ — 17/10/2026

Chủ dự án chỉ đạo “bỏ nó đi” và xác nhận phạm vi: **“Bỏ hẳn trang Dịch vụ và các liên kết dẫn tới nó”**. Đây là quyết định mới, thay thế yêu cầu giữ/bảo trì trang Services trước đây; không phải giao Claude thiết kế lại.

- Bỏ services.html và services.js khỏi cả hai bản demo đang làm trên codex/hero-chinh-quy-dao và claude/cta-dich-vu-sua.
- Bỏ mục Dịch vụ trong menu desktop/mobile, nút Xem dịch vụ trong Hero và Giới thiệu. Giữ nút gửi yêu cầu đặt lịch, header/tài khoản và phần Giới thiệu/chuyển cảnh còn lại.
- Không tiếp tục QA/sửa CTA Services @e1c43df; lỗi P2 tràn Services cũ không được ghi là đã sửa hay PASS trong lượt này, mà đóng theo quyết định bỏ trang. Lượt kiểm e1c43df bị ngắt trước khi hoàn tất.
- Claude tiếp tục thiết kế/triển khai phần còn lại; Codex QA chính. Codex thực hiện việc bỏ trang theo chỉ đạo trực tiếp này và ghi kết quả là tự kiểm, không gọi là QA độc lập.
- Giữ lịch sử Git, tài liệu và bằng chứng cũ. Các nhánh Antigravity vẫn chỉ lưu lịch sử; không sửa mã trên nhánh đó. CSS/tài nguyên chưa dùng không tự xóa hàng loạt vì có phần dùng chung.
- Chưa xóa nhánh, chưa merge main hoặc gộp Giới thiệu sang Codex, không deploy. Không tự thêm trang thay thế hoặc chuyển hướng giả.
