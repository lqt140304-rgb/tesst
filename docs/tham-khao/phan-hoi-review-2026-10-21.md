# Phản hồi báo cáo review 21/10/2026

Báo cáo: `bao-cao-review-2026-10-21.md`. Kế hoạch hoàn thiện kèm theo: `ke-hoach-hoan-thien-le-son-2026-10-21.md`.

## Hai lỗi đã xác nhận

| Lỗi | Đã kiểm tra | Quyết định của chủ dự án | Xử lý |
|---|---|---|---|
| Hai lịch cùng giờ, cùng người phụ trách chồng lên nhau trên lịch ngày | Đúng: `staff.appointments.create` không kiểm tra giao giờ; lưới cũ đặt hai khối đúng một chỗ | **Chặn** (không cho trùng) | Giao diện (đã xong, 4A): lịch giao giờ đứng cạnh nhau, không bị che; lỗi của API hiện tại ô giờ. Quy tắc chặn nằm ở nhánh dữ liệu — yêu cầu ghi trong `PROGRESS.md` ("Yêu cầu gửi nhánh kia") |
| Video 20 giây bị từ chối | Đúng là giới hạn đang là 15 giây — nhưng đó là quyết định đã ghi (QUYET-DINH, thiết kế làm lại giao diện §3.2, CLAUDE.md) | **Giữ 15 giây** (đã hỏi lại sau khi nhận kế hoạch hoàn thiện ghi 20 giây) | Không đổi |

## Đề xuất thiết kế

| Đề xuất | Quyết định | Kết quả |
|---|---|---|
| Bo góc nút/ô nhập 4–6 px, thẻ 8–12 px | Làm | Nút/ô nhập 6 px, thẻ và ảnh trong thẻ 12 px, cả ba khu; hero và "phiếu khám" giữ nguyên |
| Bỏ dấu chân ở thanh bên nhân viên | Làm | Đã bỏ |
| Rút gọn form đặt lịch trên điện thoại | Làm | Ba bước gấp lại thành một dòng, form lên sớm |
| Nhãn "Bản demo" ít che nội dung (kể cả khi bàn phím mở) | Làm | Nút biểu tượng nhỏ trên điện thoại; ẩn khi đang gõ vào ô nhập |
| Hiện số doanh thu ngay, chỉ biểu đồ chuyển động | Không chọn | Giữ nguyên |

## Bốn lỗi cũ

Các lỗi hồi quy của đợt review trước (giá linh hoạt sau tải lại, hai bé cùng tên, giờ y lệnh không hợp lệ, đăng ký trùng đồng thời) đã có test riêng và chạy trong `npm run verify`; đợt kiểm thử nghiệp vụ sau 4A sẽ đối chiếu thêm các luồng còn lại.
