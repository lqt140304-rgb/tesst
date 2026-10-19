# Thông tin Liên hệ Chính thức — Bệnh viện Thú y Lê Sơn

**Dự án:** Bệnh viện Thú y Lê Sơn  
**Ngày cập nhật:** 14/10/2026  
**Nguồn xác thực:** Chủ dự án cung cấp (đối chiếu [`docs/thong-tin-lien-he.md`](thong-tin-lien-he.md))  

Tài liệu này lưu trữ các thông tin liên hệ chính thức đã được Chủ dự án xác nhận để sử dụng trong thiết kế giao diện (Cấp cứu, menu điện thoại, chân trang và trang Liên hệ sau này).

---

## 1. Bảng Thông tin Đã Xác nhận

| Hạng mục | Giá trị chính thức | Ghi chú & Quy cách sử dụng trên web |
|---|---|---|
| **Tên đơn vị** | **Bệnh Viện Thú Y Lê Sơn** | Nhận diện thương hiệu chính thức |
| **Địa chỉ** | **101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội** | Nguồn: Trang thông tin chính thức của bệnh viện do chủ dự án cung cấp |
| **Hotline chung** | **`097 355 51 05`** | Số chung của bệnh viện: tư vấn, đặt lịch và cấp cứu. Liên kết gọi: `tel:+84973555105` |
| **Cấp cứu** | **Tiếp nhận 24/24** [Đã xác nhận] | Chỉ áp dụng ghi "24/24" cho Cấp cứu; không ghi cho các dịch vụ khác |
| **Google Maps** | [`https://maps.app.goo.gl/xFbQ4BjKtGVa3rp86`](https://maps.app.goo.gl/xFbQ4BjKtGVa3rp86) | Mở tab mới (`target="_blank" rel="noopener noreferrer"`), chữ "Chỉ đường" |
| **Fanpage Facebook** | [`https://www.facebook.com/benhvienthuyleson`](https://www.facebook.com/benhvienthuyleson) | Bỏ tham số `?locale=vi_VN`; mở tab mới (`target="_blank" rel="noopener noreferrer"`) |

---

## 2. Thông tin Chưa Xác nhận — Tuyệt đối Không Dùng

> [!WARNING]
> **Quy định bảo toàn dữ liệu:**
> Toàn bộ các thông tin chi tiết về danh mục máy móc y tế, phòng mổ ngoại khoa, máy siêu âm, máy chụp X-quang, máy xét nghiệm huyết học, hệ thống chuồng inox, camera theo dõi, giờ làm việc của các dịch vụ thường, cũng như hình ảnh trên Fanpage/Maps **chưa được Chủ dự án xác nhận hoặc cấp phép bản quyền**.
> 
> Nhóm phát triển **tuyệt đối không tự ý khẳng định hoặc đưa vào làm nội dung chính thức** trên website khi chưa có văn bản/dữ liệu xác nhận chính thức từ Chủ dự án. Hình ảnh và nội dung chuyên môn thực tế sẽ được Chủ dự án cung cấp riêng ở các giai đoạn tiếp theo.

---

## 3. Các Vị trí Sử dụng Thông tin trên Website Demo

1. **Header Desktop:** Giữ nguyên vẹn theo Hero V1 đã duyệt (Logo Lê Sơn, menu điều hướng, nút Đăng nhập / Đăng ký hoặc tài khoản cá nhân). Không đặt nút Maps hay Facebook trên header để tránh quá tải và tràn khung nhìn.
2. **Mobile Drawer (Menu điện thoại):** Khối thẻ liên hệ nhanh hiển thị rõ địa chỉ **101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội**, hotline bấm gọi ngay `097 355 51 05`, cùng 2 nút mở nhanh Google Maps và Facebook (`rel="noopener noreferrer"`).
3. **Thẻ Dịch vụ Cấp cứu:** Hiển thị nhãn "Cấp cứu 24/24" và nút gọi trực tiếp tới hotline **`097 355 51 05`** (`tel:+84973555105`), không có nút đặt lịch.
4. **Cửa sổ Modal Chi tiết (3 dịch vụ thường):** Chỉ hiển thị nội dung giữ chỗ và nút "Gửi yêu cầu đặt lịch →" trỏ về form đặt lịch (không có nút Maps hay Facebook).
