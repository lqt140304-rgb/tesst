# Báo cáo review bản demo mới — Bệnh viện Thú y Lê Sơn

Ngày review: 21/10/2026  
Tệp kiểm tra chính: `Le-So3n-demo.html`  
Dung lượng: 11.650.725 byte, khoảng 11,65 MB.  
SHA-256, tiền tố nhận diện: `a8da3eefbeafe616`.  
Vai trò: reviewer; không chỉnh sửa file demo gốc.

## Kết luận

Bản mới đã khắc phục bốn vấn đề từng phát hiện ở lần review trước: loại giá linh hoạt sau tải lại, lịch sử thú cưng trùng tên, giờ y lệnh không hợp lệ và đăng ký trùng đồng thời.

Lần này xác nhận **hai vấn đề cần sửa**:

| Ưu tiên | Vấn đề | Tác động |
| --- | --- | --- |
| Cao | Hai lịch cùng giờ, cùng người phụ trách chồng lên nhau trên lịch ngày máy tính | Nhân viên có thể bỏ sót lịch hẹn vì chỉ nhìn thấy lịch nằm trên |
| Trung bình | Video 20 giây bị từ chối vì giới hạn đang là 15 giây | Không đáp ứng quy chuẩn video đã chốt |

Đánh giá trong phạm vi demo chạy cục bộ. Không xem đây là kết luận hệ thống đã sẵn sàng vận hành thật.

## 1. Lịch hẹn bị che khi trùng giờ

### Điều kiện và cách tái hiện

- Đăng nhập tài khoản mẫu quản lý.
- Ngày 21/10/2026 có lịch **Mập**, 09:00–09:30, phụ trách **BS. Trần Minh Đức**.
- Tạo thêm lịch **Miu**, cùng ngày, cùng thời điểm 09:00–09:30 và cùng người phụ trách.
- Mở `#/nv/lich-hen`, chế độ Ngày, chiều rộng 1440px.

### Kết quả đã xác nhận

Dịch vụ dữ liệu của ứng dụng chấp nhận lịch mới. Hai nút lịch đều tồn tại nhưng có hình chữ nhật hiển thị giống nhau:

| Lịch | X | Y | Rộng | Cao |
| --- | ---: | ---: | ---: | ---: |
| 09:00 Mập | 346 | 354,55 | 256,5 | 44 |
| 09:00 Miu | 346 | 354,55 | 256,5 | 44 |

Lịch Miu che lịch Mập; nhìn trên màn hình chỉ thấy lịch nằm trên. Dữ liệu không bị xóa, nhưng không thể nhận biết đủ lịch bằng cách nhìn bảng lịch.

### Nguyên nhân

- `staff.appointments.create` lưu lịch mà chưa kiểm tra giao nhau về thời gian theo người phụ trách.
- Bố cục lịch ngày định vị các lịch theo thời gian nhưng chưa chia làn cho các lịch giao nhau.

Phép tái hiện sử dụng API demo của chính ứng dụng để tạo dữ liệu, sau đó kiểm tra giao diện và tọa độ DOM. Không khẳng định đã kiểm thử đầy đủ mọi đường tạo/đổi lịch bằng chuột.

### Đề xuất xử lý

- Kiểm tra giao nhau theo khoảng thời gian bắt đầu và kết thúc, không chỉ so sánh giờ bắt đầu.
- Hiển thị cảnh báo rõ khi cùng người phụ trách có lịch giao nhau; nếu nghiệp vụ cho phép nhận trùng, cần thao tác xác nhận có chủ đích.
- Giao diện vẫn phải hiển thị đủ các lịch trùng bằng các làn cạnh nhau hoặc một nhóm có số lượng và danh sách mở rộng.
- Áp dụng cùng quy tắc cho tạo lịch, xác nhận yêu cầu và đổi lịch.
- Bỏ qua lịch đã hủy khi tính xung đột.

### Kiểm tra sau sửa

- Hai lịch cùng giờ đều được nhìn thấy và mở riêng được.
- Lịch 09:00–09:30 và 09:15–09:45 được nhận diện là giao nhau.
- Lịch 09:00–09:30 và 09:30–10:00 không bị báo trùng.
- Hai người phụ trách khác nhau không bị chặn nhầm.

## 2. Video 20 giây bị từ chối

### Quy chuẩn đã thống nhất

Video nội trú dài 20 giây, không có âm thanh khi xem, lưu 60 ngày.

### Kết quả đã xác nhận

Gọi chức năng tải video của ứng dụng với nguồn tệp thiết bị và `duration_s: 20` bị trả về:

> Video dài hơn 15 giây. Bạn cắt ngắn hoặc chọn video khác nhé.

Đây là kiểm tra quy tắc xác thực bằng đối tượng tệp thử và thời lượng khai báo; không phải bài kiểm thử giải mã video thực 20 giây.

### Nguyên nhân

Hàm xác thực video trong bundle:

```js
function NP(file, duration) {
  return file.type.startsWith("video/")
    ? file.size > 20971520
      ? FP.tooBig
      : duration && duration > 15
        ? FP.tooLong
        : null
    : FP.notVideo;
}
```

Ngưỡng và thông báo đều đang là 15 giây.

### Đề xuất xử lý

- Thống nhất ngưỡng 20 giây ở bộ kiểm tra, nhãn giao diện và nội dung hướng dẫn.
- Lấy thời lượng từ metadata của video, không chỉ tin giá trị được truyền vào.
- Giữ riêng giới hạn kích thước tệp; hiện mã đang giới hạn 20 MB.
- Kiểm tra video 19,9 giây, 20 giây và trên 20 giây.
- Giữ quy tắc tắt âm và lưu 60 ngày.

## 3. Những lỗi cũ đã kiểm tra lại

| Vấn đề cũ | Kết quả ở bản mới | Bằng chứng kiểm tra |
| --- | --- | --- |
| Mở lại hóa đơn làm mất loại giá linh hoạt | Đã sửa trong trường hợp kiểm tra | Lưu dòng KB09 đơn giá 225.000 ₫, tải lại trang; ô giá vẫn sửa được và giữ 225000 |
| Hai thú cưng trùng tên dùng chung lịch sử | Đã sửa trong trường hợp kiểm tra | Tạo hai bé cùng tên; đặt lịch cho bé thứ nhất: lịch sử lần lượt là 1 và 0 |
| Đổi tên thú cưng làm mất lịch sử | Đã sửa trong trường hợp kiểm tra | Đổi tên bé đã đặt lịch; lịch sử vẫn có 1 yêu cầu |
| Chấp nhận giờ 25:99 trong y lệnh | Đã chặn | API trả ValidationError, hướng dẫn giờ 00–23 và phút 00–59 |
| Đăng ký đồng thời trùng tên đăng nhập | Đã chặn | Hai lệnh đăng ký cùng tên: một thành công, một bị báo tên đã tồn tại |

Các kết quả trên là những trường hợp cụ thể đã chạy; không thay thế bộ kiểm thử hồi quy đầy đủ.

## 4. Kiểm tra quyền và dữ liệu khách hàng

Các trường hợp đã chạy:

- Tài khoản Spa bị từ chối khi gọi báo cáo doanh thu.
- Tài khoản khách hàng không lấy được hóa đơn nháp thử nghiệm.
- Tài khoản khách hàng không lấy được hồ sơ thú cưng thuộc khách khác.
- Dữ liệu nội trú trả cho tài khoản Chị Lan trong trường hợp thử gồm tình trạng chung, nhật ký và video; không có thuốc, liều, giờ tiêm, y lệnh hoặc tên nhân viên thực hiện.
- Trình phát video có thiết lập muted và xử lý giữ trạng thái tắt âm.

Giới hạn: đây là kiểm tra ứng dụng demo phía trình duyệt. File có sẵn tài khoản mẫu và công cụ hỗ trợ demo, vì vậy không dùng kết quả này để kết luận bảo mật của backend hoặc dữ liệu thật.

## 5. Giao diện và thiết kế

### Điểm đã làm tốt

- Hero giữ được nhận diện kem–tím–cam.
- Phần giới thiệu, dịch vụ và trang tài khoản ăn khớp với hero hơn bộ concept tím xám đậm trước đó.
- Font Lora và Be Vietnam Pro có vai trò tương đối rõ.
- Giá tiền dùng font giao diện, dễ đọc; có nhãn trạng thái bằng chữ.
- Điện thoại có điều hướng dưới màn hình; lịch hẹn chuyển sang danh sách dễ đọc hơn việc ép bảng lịch lớn.
- Trong lượt rà, không phát hiện tràn ngang toàn trang hoặc ảnh hỏng ở các màn đã mở.

### Đề xuất tinh gọn

| Hạng mục | Quan sát | Đề xuất |
| --- | --- | --- |
| Góc bo | Vẫn có nhiều nút dạng viên thuốc, badge và thẻ bo khá lớn | Giữ sự mềm của hero, nhưng thống nhất nút/ô nhập khoảng 4–6px, thẻ nội dung khoảng 8–12px ở phần mới |
| Điều hướng nhân viên | Có dấu chân trang trí lặp trên sidebar | Giảm mật độ hoặc bỏ ở màn nghiệp vụ để nội dung rõ hơn |
| Form đặt lịch trên điện thoại | Khối giới thiệu và ba bước chiếm nhiều diện tích trước biểu mẫu | Rút gọn phần dẫn, cho người dùng đến ô nhập sớm hơn |
| Font và số liệu | Số doanh thu có hiệu ứng chạy số khi mở màn | Hiển thị số tổng ngay; dành animation cho biểu đồ để đọc và đối chiếu chính xác hơn |
| Nhãn demo nổi | Nút “Bản demo · dữ liệu mẫu” xuất hiện cố định | Trên mobile, chọn vị trí ít đè nội dung hơn; có thể gắn vào thanh đầu trang |

Đây là nhận xét thiết kế, không gộp với hai lỗi chức năng đã xác nhận.

## 6. Phạm vi kiểm tra giao diện

Mở trực tiếp file HTML bằng Chromium tự động, hai kích thước:

- Máy tính: 1440 × 1000.
- Điện thoại mô phỏng: 390 × 844.

Rà **20 đường dẫn × 2 kích thước = 40 lượt mở màn**:

- Công khai: trang chủ, giới thiệu, dịch vụ, đặt lịch, đăng nhập, đăng ký.
- Khách hàng: tổng quan, thú cưng, lịch hẹn, nội trú, hóa đơn.
- Nhân viên/quản lý: tổng quan, yêu cầu, lịch hẹn, khách hàng, nội trú, hóa đơn, tạo hóa đơn, bảng giá, doanh thu.

Trong các lượt này không ghi nhận lỗi JavaScript chưa xử lý, ảnh hỏng hoặc chiều rộng tài liệu lớn hơn khung nhìn.

Lưu ý: giới thiệu và dịch vụ dùng chung trang chủ; số đường dẫn không đồng nghĩa có 20 trang độc lập. Một số ảnh chụp được lấy trong giai đoạn animation; không dùng số doanh thu giữa lúc đang chạy số để kết luận phép tính sai.

## 7. Dung lượng và phạm vi chưa kiểm tra

- File tự chứa khoảng 11,65 MB, phù hợp để chia sẻ demo offline. Khi triển khai web, nên tách và tối ưu ảnh/font/mã để tránh tải toàn bộ ngay từ đầu.
- Chưa kiểm tra trên Safari/iPhone thật hoặc Firefox.
- Chưa kiểm thử toàn bộ thao tác sửa, hủy, thu tiền, hoàn tác, in hóa đơn, lỗi mạng và dữ liệu lớn.
- Chưa kiểm thử đầy đủ bằng bàn phím, trình đọc màn hình và chế độ giảm chuyển động.
- Chưa đánh giá bảo mật backend, di chuyển dữ liệu GPet hoặc vận hành nhiều thiết bị.
- Không chỉnh sửa file gốc; dữ liệu thử chỉ được tạo trong phiên trình duyệt kiểm tra.

## 8. Thứ tự giao việc cho Claude

1. Sửa cách xử lý và hiển thị lịch giao nhau.
2. Thống nhất video 20 giây.
3. Chạy lại bốn lỗi hồi quy cũ và các trường hợp quyền truy cập đã nêu.
4. Tinh gọn góc bo, trang trí sidebar và phần dẫn form trên mobile.
5. Kiểm tra Safari/iPhone thật trước khi chốt bản trình diễn.

