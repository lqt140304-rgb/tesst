# Đề xuất animation cho từng màn — Bệnh viện Thú y Lê Sơn

Ngày: 20/10/2026  
Phạm vi: 10 màn bổ sung trong bộ concept mới nhất.  
Trạng thái: đề xuất thiết kế chuyển động, chưa triển khai vào website.

## 1. Định hướng chung

Chuyển động nhẹ, mềm và thống nhất với hero hiện tại. Các màn dùng tím mận, nền tím xám nhạt và điểm nhấn cam tiết chế. Mỗi màn hoặc khu vực kích hoạt độc lập; không phụ thuộc vào việc hero đã chạy xong.

Ưu tiên giúp người dùng nhận biết nội dung xuất hiện, mục đang chọn và kết quả thao tác. Các màn nghiệp vụ cần phản hồi nhanh, không kéo dài hiệu ứng để trang trí.

## 2. Animation cho từng màn

| Màn hình | Khi kích hoạt | Hiệu ứng đề xuất | Thời lượng |
| --- | --- | --- | --- |
| Danh sách thú cưng | Mở màn lần đầu | Các dòng thú cưng hiện nhẹ từ dưới lên 8px, tăng độ rõ từ 0 đến 100%; lệch nhau 60ms, tối đa 5 dòng đầu. Rê chuột làm viền tím rõ hơn, không làm dòng nhảy vị trí. | Hiện 280ms; hover 150ms |
| Hồ sơ thú cưng | Chọn bé từ danh sách | Ảnh bé chuyển liền mạch từ vị trí trong danh sách đến vùng hồ sơ; thông tin xuất hiện nhẹ sau đó. Nếu không thực hiện được chuyển ảnh liên tục, dùng chuyển mờ đơn giản. | 300ms; thông tin 220ms |
| Lịch hẹn khách hàng | Chọn tab hoặc lịch hẹn | Gạch chân trượt đến tab mới; bảng chi tiết xuất hiện từ bên phải với khoảng dịch chuyển 12px. Lịch hẹn được chọn có nền tím nhạt rõ ràng. | Tab 180ms; chi tiết 220ms |
| Hóa đơn khách hàng | Chọn hóa đơn | Chi tiết hóa đơn chuyển mờ tại chỗ. Giữ ổn định khu vực tổng tiền và vị trí các nút; không dùng số tiền chạy đếm. | 180ms |
| Danh sách khách hàng | Chọn dòng hoặc tìm kiếm | Dòng được chọn đổi nền nhẹ; kết quả tìm kiếm chuyển mờ nhanh. Giữ ổn định chiều cao vùng bảng để tránh giật trang. | Chọn 150ms; kết quả 120–180ms |
| Hồ sơ khách hàng | Đổi tab hoặc bấm chỉnh sửa | Gạch chân tab trượt nhẹ; nội dung chuyển mờ. Biểu mẫu chỉnh sửa mở cạnh thông tin hiện tại, không làm người dùng mất ngữ cảnh. | Tab 180ms; biểu mẫu 220ms |
| Quản lý nội trú | Chọn bé hoặc nhận cập nhật | Phần chi tiết mở nhẹ từ bên cạnh. Khi có trạng thái mới, vùng trạng thái được nhấn nền nhẹ một lần rồi trở về bình thường. | Chi tiết 220ms; nhấn nền 600ms |
| Cập nhật cho chủ nuôi | Nhập nội dung, tải video, lưu | Khung xem trước cập nhật nhẹ khi nhập; tải video có tiến trình thực tế; sau khi lưu thành công hiện dấu tích và thông báo rõ. | Xem trước 150ms; dấu tích 200ms |
| Quản lý bảng giá | Chọn sửa hoặc đổi loại giá | Khu vực chỉnh sửa mở ngay dưới dòng được chọn. Trường giá xuất hiện hoặc thu gọn theo loại giá; giữ tiêu điểm nhập ổn định. | Mở chỉnh sửa 220ms; trường giá 180ms |
| Doanh thu | Mở màn hoặc đổi kỳ | Cột biểu đồ hiện từ dưới lên một lần khi mở màn. Khi đổi kỳ, chuyển mờ ngắn sang dữ liệu mới; số tổng hiển thị trực tiếp. | Lần đầu 450ms; đổi kỳ 200ms |

## 3. Quy tắc áp dụng

### Xuất hiện và điều hướng

- Hiệu ứng vào màn chỉ chạy một lần cho mỗi lần điều hướng đến màn đó.
- Khu vực bên dưới kích hoạt khi đi vào vùng nhìn thấy, không cần chờ khu vực trước hoàn tất.
- Khoảng dịch chuyển thông thường: 8–12px; tránh bay xa, xoay hoặc nảy.
- Nhóm nội dung có thể lệch nhau 40–60ms; tổng thời gian chờ của cả nhóm không quá 450ms.
- Khi quay lại danh sách, giữ vị trí cuộn, bộ lọc và dòng đã chọn.
- Nội dung và nút phải dùng được ngay; không khóa thao tác chỉ để chờ animation.
- Dùng chuyển động chậm dần ở cuối cho hiệu ứng xuất hiện; tránh lò xo hoặc nảy trên màn nghiệp vụ.

### Phản hồi thao tác

- Hover và focus phải rõ, không chỉ dựa vào màu sắc; hỗ trợ viền hoặc gạch chân.
- Nút bấm phản hồi trong khoảng 100–150ms, không thay đổi kích thước gây xô lệch.
- Trạng thái đang lưu chỉ kéo dài theo thời gian xử lý thực tế.
- Chỉ hiện dấu tích thành công sau khi lưu thành công; nếu lỗi, giữ dữ liệu nhập và hiển thị thông báo tại chỗ.
- Tiến trình tải video phản ánh dữ liệu thực tế. Nếu chưa biết phần trăm, dùng trạng thái đang tải thay vì giả lập tỷ lệ hoàn thành.
- Không tự phát video; video nội trú không có âm thanh.
- Không dùng hiệu ứng rung mạnh để báo lỗi biểu mẫu.
- Không để animation làm thay đổi ý nghĩa hoặc trạng thái nghiệp vụ.

### Giảm chuyển động và khả năng sử dụng

- Tôn trọng tùy chọn hệ thống `prefers-reduced-motion`.
- Khi bật giảm chuyển động: bỏ trượt, phóng to và chuyển ảnh liên tục; hiển thị ngay hoặc chuyển độ mờ ngắn tối đa 100ms.
- Không chạy lại animation khi người dùng đang gõ, cuộn bảng hay thay đổi lựa chọn liên tục.
- Không làm mất tiêu điểm bàn phím khi mở biểu mẫu, chuyển tab hoặc cập nhật dữ liệu.
- Trên điện thoại, dùng bố cục chi tiết toàn chiều rộng; tránh cố giữ panel cạnh bảng khi không đủ chỗ.
- Không dùng chuyển động lặp liên tục hoặc tự cuộn để thu hút chú ý trong khu vực làm việc.

## 4. Ràng buộc nội dung cần giữ

- Hero hiện tại giữ nguyên; tài liệu này bổ sung chuyển động cho các màn còn lại.
- Khách hàng chỉ xem tình trạng chung, nhật ký được phép chia sẻ và video; không xem thuốc, liều, giờ tiêm, lịch tiêm hoặc y lệnh nội bộ.
- Video nội trú: 20 giây, không âm thanh, lưu 60 ngày.
- Hóa đơn thanh toán tại quầy; không thêm luồng thanh toán trực tuyến.
- Thanh điều hướng thống nhất theo vai trò khách hàng, nhân viên và quản lý.
- Ảnh concept có dữ liệu minh họa; nhãn sai do tạo ảnh, chẳng hạn “Video tối đa 60 giây”, không phải yêu cầu triển khai.

## 5. Tiêu chí nghiệm thu

- Mỗi màn và mỗi khu vực hoạt động độc lập với animation của hero.
- Chuyển màn, mở chi tiết và chuyển tab mượt; không giật bố cục.
- Có thể thao tác ngay, kể cả khi hiệu ứng xuất hiện đang chạy.
- Thử được bằng chuột, bàn phím và cảm ứng.
- Chế độ giảm chuyển động vẫn cung cấp đầy đủ thông tin và phản hồi.
- Thành công, lỗi và tiến trình tải đều phản ánh đúng kết quả xử lý.
- Không phát sinh nội dung nhạy cảm trong cổng khách hàng khi chuyển tab, mở preview hoặc đổi màn.

