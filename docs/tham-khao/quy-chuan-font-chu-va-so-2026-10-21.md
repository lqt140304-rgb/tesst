# Quy chuẩn font chữ và chữ số — Bệnh viện Thú y Lê Sơn

Ngày: 21/10/2026  
Trạng thái: đề xuất triển khai dựa trên mẫu chữ đã trình bày.  
Phạm vi: trang công khai, cổng khách hàng, giao diện nhân viên và quản lý.

## 1. Bộ font đề xuất

Sử dụng hai họ font: **Lora** và **Be Vietnam Pro**.

- **Lora:** tiêu đề mang tính thương hiệu, giới thiệu và dịch vụ.
- **Be Vietnam Pro:** nội dung, điều hướng, biểu mẫu, nút, bảng dữ liệu và toàn bộ số liệu.
- Giữ nguyên thiết kế và kiểu chữ của hero hiện tại; các phần mới phát triển theo nhận diện đó.
- Phối hợp với bộ icon **Phosphor Duotone** đã chọn.

Nguồn chính thức:

- [Lora trên Google Fonts](https://fonts.google.com/specimen/Lora)
- [Be Vietnam Pro trên Google Fonts](https://fonts.google.com/specimen/Be+Vietnam+Pro)
- [Mã nguồn Be Vietnam Pro](https://github.com/bettergui/BeVietnamPro)

## 2. Phân công font theo thành phần

| Thành phần | Font | Độ đậm | Quy tắc |
| --- | --- | --- | --- |
| Hero hiện tại | Giữ font đang dùng | Giữ hiện trạng | Không tự thay cỡ chữ, khoảng cách hoặc bố cục |
| Tiêu đề giới thiệu, dịch vụ | Lora | 600 | Chữ đứng; chỉ nghiêng một cụm nhấn nếu cần |
| Tiêu đề trang khách hàng | Lora | 600 | Vừa phải, không chiếm nhiều diện tích |
| Tiêu đề màn nhân viên, quản lý | Be Vietnam Pro | 600 | Ưu tiên rõ và gọn |
| Nội dung đoạn văn | Be Vietnam Pro | 400 | Dễ đọc, đủ giãn dòng |
| Menu, tab, nhãn biểu mẫu | Be Vietnam Pro | 500–600 | Nhãn ngắn; dùng kiểu IN HOA khi được quy định cho component |
| Nút chính | Be Vietnam Pro | 600 | Cùng quy tắc trên toàn hệ thống |
| Dữ liệu bảng | Be Vietnam Pro | 400–500 | Dùng 600 cho dữ liệu cần nhấn |
| Giá tiền, ngày giờ, mã hóa đơn | Be Vietnam Pro | 500–600 | Chữ đứng, không nghiêng |
| Tổng tiền, doanh thu nổi bật | Be Vietnam Pro | 700 | Nhấn bằng độ đậm và kích thước |
| Ghi chú, mô tả phụ | Be Vietnam Pro | 400 | Không quá nhỏ hoặc quá nhạt |

Chỉ tải các độ đậm thực sự dùng. Nếu chưa tải 500, dùng 400 hoặc 600 phù hợp; không để trình duyệt tự tạo độ đậm giả.

### Các kiểu chữ bắt buộc có trong hệ thống

| Kiểu chữ | Ví dụ | Font và độ đậm | Vị trí sử dụng |
| --- | --- | --- | --- |
| Chữ thường | Chăm sóc thú cưng tận tâm | Be Vietnam Pro 400 | Đoạn văn, mô tả |
| **Chữ in đậm** | **Lịch hẹn của bạn** | Be Vietnam Pro 700; Lora 700 cho tiêu đề thương hiệu cần nhấn | Tiêu đề quan trọng, thông tin chính |
| CHỮ IN HOA | DỊCH VỤ DÀNH CHO BÉ | Be Vietnam Pro 500–600 | Nhãn phần, nhãn nhóm ngắn |
| **CHỮ IN HOA ĐẬM** | **BỆNH VIỆN THÚ Y LÊ SƠN** | Be Vietnam Pro 700; Lora 700 khi cần phong cách thương hiệu | Tiêu đề ngắn, nhãn tổng tiền, điểm nhấn |
| Chữ nghiêng | *Đồng hành bằng sự thấu hiểu* | Lora Italic 600 | Cụm nhấn thương hiệu |

**Chữ in đậm và chữ viết hoa hoàn toàn là hai thuộc tính độc lập; phải hỗ trợ cả kiểu kết hợp IN HOA ĐẬM.**

- Dùng IN HOA ĐẬM có chọn lọc: **DỊCH VỤ**, **LỊCH HẸN**, **TỔNG THANH TOÁN**, **GỬI YÊU CẦU**.
- Nhãn phần in hoa: 12–14px, độ đậm 600–700, giãn ký tự 0.04–0.08em, giãn dòng tối thiểu 1.4 để đủ chỗ cho dấu tiếng Việt.
- Tiêu đề in hoa: theo thang cỡ chữ bên dưới, độ đậm 700, giãn ký tự 0–0.02em; không áp dụng giãn rộng của nhãn nhỏ cho tiêu đề lớn.
- Nút in hoa đậm: 14–16px, độ đậm 700, giãn ký tự tối đa 0.03em. Chọn một kiểu nhất quán cho cùng loại nút.
- Không viết hoa toàn bộ đoạn văn dài, dữ liệu người dùng hoặc nội dung nhật ký. Giữ đúng cách viết tên người và tên thú cưng.
- Giữ đủ dấu khi viết hoa: **CHĂM SÓC**, **ĐIỀU TRỊ**, **NGUYỄN THỊ ÁNH**, **TỔNG THANH TOÁN**.
- Dùng đúng font weight 700 đã tải hoặc được hỗ trợ bởi font biến thiên, không tạo đậm giả. Không tự đổi logo hoặc hero sang chữ in hoa.

## 3. Thang cỡ chữ

Các cỡ dưới đây là kích thước CSS đề xuất, cần kiểm tra trên nội dung thật.

| Thành phần | Máy tính | Điện thoại | Giãn dòng |
| --- | --- | --- | --- |
| Tiêu đề phần công khai | 32–40px | 26–30px | 1.25–1.35 |
| Tiêu đề trang khách hàng | 28–32px | 24–28px | 1.3 |
| Tiêu đề màn quản lý | 24–28px | 22–24px | 1.3 |
| Tiêu đề nhóm nội dung | 18–22px | 18–20px | 1.35 |
| Nội dung chính | 16px | 16px | 1.55–1.65 |
| Menu, nhãn, dữ liệu bảng | 14–16px | 14–16px | 1.4–1.5 |
| Chữ nhập trong biểu mẫu | 16px | 16px | 1.5 |
| Nút | 14–16px | 14–16px | 1.4 |
| Ghi chú phụ | 13–14px | 13–14px | 1.5 |
| Tổng tiền nổi bật | 20–24px | 20–24px | 1.3 |
| Số liệu tổng quan | 28–32px | 24–28px | 1.2–1.3 |

- Giữ đủ khoảng trống cho dấu tiếng Việt; tránh chiều cao dòng cố định gây cắt dấu.
- Không kéo giãn chữ hoặc ép sát ký tự để cố nhét tiêu đề.
- Hạn chế đoạn văn dài quá khoảng 60–75 ký tự mỗi dòng.
- Trong bảng quản lý, ưu tiên đọc đủ dữ liệu hơn tăng kích thước tiêu đề.

## 4. Màu chữ

| Mục đích | Màu đề xuất |
| --- | --- |
| Tiêu đề, chữ thương hiệu | Tím mận `#53165C` |
| Nội dung chính | Tím mực `#291D34` |
| Nội dung phụ | Tím xám `#726579` |
| Cụm nhấn thương hiệu | Cam trầm `#C95B0A` |
| Nền chính nhẹ | Tím xám nhạt `#F2EFF3` |
| Nền ấm bổ sung | Kem `#FBF7F1` |

Cam chủ yếu dùng ở cụm nhấn hoặc chi tiết trang trí. Nút chính tiếp tục dùng tím mận để ăn khớp với hero. Kiểm tra độ tương phản trên nền thực tế; không dùng màu sắc làm dấu hiệu duy nhất cho trạng thái.

## 5. Quy tắc hiển thị số

| Loại thông tin | Mẫu | Quy tắc |
| --- | --- | --- |
| Giá tiền | 350.000 ₫ | Dấu chấm ngăn nhóm nghìn; có khoảng trắng trước đơn vị |
| Tổng tiền | 1.250.000 ₫ | Cùng định dạng với giá từng dòng |
| Ngày | 20/10/2026 | Ngày/tháng/năm, đủ hai chữ số cho ngày và tháng |
| Giờ | 09:00 | Hệ 24 giờ |
| Khoảng giờ | 09:00–09:30 | Dùng dấu gạch nối khoảng thời gian |
| Cân nặng | 4,2 kg | Dấu phẩy thập phân; có khoảng trắng trước đơn vị |
| Số điện thoại | 097 355 51 05 | Giữ số 0 đầu; hiển thị thành nhóm dễ đọc |
| Mã hóa đơn | HD-0018 | Giữ đủ chữ và số 0 đầu |
| Tỷ lệ | 12,5% | Dấu phẩy thập phân, thống nhất trong biểu đồ và bảng |
| Số lượng | 1, 2, 15 | Dùng số nguyên khi nghiệp vụ không cần phần lẻ |

### Tiền và dữ liệu bảng

- Căn phải cột đơn giá, thành tiền, tổng tiền và số lượng.
- Căn trái tên dịch vụ, tên khách hàng và thông tin mô tả.
- Tổng tiền dùng độ đậm 700; từng dòng thường dùng 500 hoặc 600.
- Nếu tiêu đề cột đã ghi “Đơn giá (₫)”, có thể chỉ hiển thị số trong từng ô; tổng tiền độc lập vẫn ghi đơn vị.
- Dùng khoảng trắng không ngắt dòng giữa số và đơn vị để tránh “₫” hoặc “kg” rơi sang dòng khác.
- Khi chưa có dữ liệu, dùng “—” hoặc nhãn rõ nghĩa. Không dùng 0 để thay cho dữ liệu còn thiếu.
- Phân biệt “Giá linh hoạt” với “0 ₫”.
- Không dùng hiệu ứng đếm số cho giá tiền hoặc tổng hóa đơn.

### Lưu ý đã kiểm tra trên file font dùng để dựng mẫu

- Be Vietnam Pro Regular, SemiBold và Bold có ký tự tiền đồng `₫`.
- Các chữ số mặc định của những file Be Vietnam Pro này có độ rộng khác nhau.
- File Be Vietnam Pro Regular đã kiểm tra không có tính năng OpenType `tnum`. Vì vậy không được giả định CSS `tabular-nums` sẽ tự làm các chữ số bằng chiều rộng.
- Để giữ bảng ổn định với bộ font hiện tại: căn phải, giữ độ rộng cột phù hợp và không dùng animation đếm số.
- Nếu yêu cầu chữ số có chiều rộng bằng nhau trở thành bắt buộc, cần chọn và kiểm tra font số hỗ trợ trước khi thay đổi quy chuẩn.
- File Lora dùng trong mẫu không có ký tự `₫`. Vì vậy toàn bộ số tiền dùng Be Vietnam Pro. Hàng so sánh chữ số Lora trong ảnh sử dụng chữ “đ”.

## 6. Mẫu nội dung kiểm tra

### Tiêu đề Lora

Không gian lớn cho những người bạn nhỏ

Chăm sóc bằng chuyên môn, đồng hành bằng sự thấu hiểu.

### Nội dung Be Vietnam Pro

Chăm sóc tận tâm cho những người bạn nhỏ.

Theo dõi tình trạng của bé, xem nhật ký và đặt lịch thuận tiện.

### Kiểm tra dấu tiếng Việt

Ă Â Ê Ô Ơ Ư Đ  
ă â ê ô ơ ư đ  
Nguyễn Thị Ánh — Bệnh viện Thú y Lê Sơn

### Kiểm tra chữ in đậm và IN HOA ĐẬM

**Chăm sóc bằng chuyên môn, đồng hành bằng sự thấu hiểu.**

BỆNH VIỆN THÚ Y LÊ SƠN

**BỆNH VIỆN THÚ Y LÊ SƠN**

**DỊCH VỤ DÀNH CHO BÉ · GỬI YÊU CẦU · TỔNG THANH TOÁN**

### Kiểm tra số liệu

0123456789  
150.000 ₫ · 300.000 ₫ · 450.000 ₫  
30.000.000 ₫  
20/10/2026 · 09:00–09:30  
4,2 kg · HD-0018  
097 355 51 05

## 7. Gợi ý CSS

Đây là quy tắc áp dụng sau khi đã nạp đúng file font và đủ ký tự tiếng Việt; không tự thay phần CSS của hero.

```css
:root {
  --font-heading: "Lora", Georgia, serif;
  --font-ui: "Be Vietnam Pro", system-ui, sans-serif;
  --text-brand: #53165c;
  --text-main: #291d34;
  --text-muted: #726579;
}

body,
button,
input,
select,
textarea {
  font-family: var(--font-ui);
}

body {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-main);
}

.public-section-title,
.customer-page-title {
  font-family: var(--font-heading);
  font-weight: 600;
  line-height: 1.3;
}

.staff-page-title {
  font-family: var(--font-ui);
  font-weight: 600;
  line-height: 1.3;
}

.amount,
.date-time,
.invoice-code {
  font-family: var(--font-ui);
  font-style: normal;
  white-space: nowrap;
}

td.amount,
th.amount {
  text-align: right;
}

.amount-total,
.text-bold {
  font-weight: 700;
}

.text-uppercase {
  text-transform: uppercase;
}

.label-uppercase-bold {
  font-family: var(--font-ui);
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.4;
}

.heading-uppercase-bold {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  line-height: 1.3;
}
```

Dùng cơ chế tải font của dự án hoặc khai báo `@font-face` với `font-display: swap`. Chọn đúng tệp có tiếng Việt, tải riêng italic nếu sử dụng; kiểm tra thay đổi bố cục khi font tải xong.

## 8. Tiêu chí nghiệm thu

- Tiêu đề và phần nội dung mới ăn khớp với hero.
- Chữ tiếng Việt không thiếu dấu, cắt dấu hoặc hiển thị ô vuông.
- Giá tiền, ngày giờ, điện thoại và mã hóa đơn dùng Be Vietnam Pro.
- Ký tự `₫` hiển thị đúng.
- Cột tiền căn phải, không nhảy vị trí khi thay đổi dữ liệu.
- Các kiểu font, cỡ và độ đậm nhất quán giữa các màn.
- Có đủ chữ thường, chữ in đậm, IN HOA và IN HOA ĐẬM; các dấu tiếng Việt không bị cắt hoặc chồng lên nhau.
- Biểu mẫu trên điện thoại có chữ nhập 16px.
- Giao diện đọc được khi phóng to 200%, không cắt mất nội dung quan trọng.
- Không dùng chữ nghiêng cho thông tin nghiệp vụ hoặc số liệu.
- Không thêm font thứ ba nếu chưa có lý do và chưa kiểm tra khả năng hỗ trợ.

