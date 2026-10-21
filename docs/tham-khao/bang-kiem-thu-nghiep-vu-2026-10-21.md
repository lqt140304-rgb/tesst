# Bảng kiểm thử nghiệp vụ — 15 luồng (21/10/2026)

Nguồn: bảng "Task 4" trong `ke-hoach-hoan-thien-le-son-2026-10-21.md`. Mỗi trường hợp ghi nơi đã có test (tệp::tên test, rút gọn) hoặc **thiếu**.
Cột **Dữ liệu** do nhánh dữ liệu xác nhận/điền (đã điền sẵn những gì đọc được từ tên test, chưa chạy lại từng cái); cột **Giao diện** do nhánh giao diện điền.
`NEW` = test mới viết trong đợt này (`e2e/giao-dien-nghiep-vu.spec.ts` hoặc `giao-dien-nhan-vien-a.spec.ts`). `—` = không áp dụng ở lớp đó. `chưa có chức năng` = chưa có trong ứng dụng demo.

| Luồng | Trường hợp | Dữ liệu (`src/data/**`) | Giao diện (`e2e/**`) |
|---|---|---|---|
| 1 Đặt lịch | Gửi | `public.test`: creates a pending request… | `booking.spec`: guest submits and sees the confirmation |
| | Gửi lại (trùng) | `public.test`: identical resubmit while pending / unreachable / after cancelled; `dedupe.test` | `booking.spec`: an identical resubmit shows the same confirmation |
| | Lỗi ghi, thử lại | **thiếu** (`failNextWrite` chỉ dùng ở e2e) — nhánh dữ liệu: có nên có test mức API? | `booking.spec`: failed save keeps input; **NEW** `nghiep-vu`: retry creates exactly one request |
| 2 Xử lý yêu cầu | Liên hệ, xác nhận | `requests.test`: startContact, confirm creates the appointment atomically | `staff-a`: start contact / confirm dialog; `journeys/booking` |
| | Không liên lạc được | `requests.test`: logCall can move contacting to unreachable | **NEW** khách thấy "Không liên lạc được" ở Đang xử lý |
| | Từ chối | `requests.test`: reject records reason and duplicate code internally | **NEW** khách thấy "Từ chối", không lộ lý do/tên nhân viên |
| | Trạng thái sai | `requests.test`: an illegal transition throws; `request-status.test` | — |
| 3 Đổi/hủy lịch | Đổi thời điểm | `appointments.test`: creates, reschedules and cancels | `conflict.spec`; `giao-dien-nhan-vien-a`: change inside the panel; panel follows the move |
| | Hủy lịch; hủy từ yêu cầu | `appointments.test`: cancelling from a confirmed request cancels the request | `giao-dien-nhan-vien-a`: change and cancel need reasons |
| | Lịch đã hủy | **thiếu**: hủy/đổi lại lịch đã hủy bị từ chối? — nhánh dữ liệu | **NEW** lịch đã hủy đọc được, hết nút Đổi/Hủy |
| | Giao giờ cùng người phụ trách | **thiếu — chủ dự án chọn "chặn"**, yêu cầu đã ghi ở `PROGRESS.md` (create/reschedule/confirm; chạm giờ không tính; đã hủy bỏ qua) | xếp cạnh nhau (`giao-dien-nhan-vien-a`: same time side by side) |
| 4 Hồ sơ thú cưng | Hai bé cùng tên, lịch sử theo id | `zone.test`: a pet page lists the bookings of that pet by id (F02) | — |
| | Đổi tên không mất lịch sử | **thiếu** (nhánh dữ liệu xác nhận) | — |
| | Sửa bé, cân nặng, cảnh báo giữ | `customers.test`: updates a pet; M3 alerts | `customer-a`: adding pet; `giao-dien-khach`: a pet the customer added can be edited |
| 5 Tài khoản | Đăng ký trùng đồng thời | `auth.test`: two sign-ups racing (F04) | — |
| | Đăng xuất, mở lại trang | `auth.test`: logout clears the session; `remember.test` | `auth.spec`: logout…; `guards.spec`; **NEW** Back sau đăng xuất không vào được trang khách |
| | Không lộ dữ liệu phiên trước | `remember.test`: staff never remembered, after 30 days signed out | **NEW** (cùng test trên) |
| 6 Liên hệ hồ sơ | Đúng/sai mã | `customers.test`: findByLinkCode…; link requires confirmation | `staff-a`: link minh_khoa (mã sai có thông báo); `journeys/linking` |
| | Sai chủ | `customers.test`: a pet match must belong to the account and the customer | — |
| | Liên kết lại | `customers.test`: cannot link an account that is already linked | **thiếu** (giao diện báo gì khi mã đã liên kết) |
| | Người không có quyền | `customers.test`: a doctor cannot link | `staff-a`: quyền |
| 7 Nội trú | Nhập viện | `inpatient-admit.test` (nhiều ca) | **thiếu** — sẽ có ở 4C |
| | Chuyển chuồng; không hai ca một chuồng | `inpatient-stay.test`: moves…, refuses busy or same cages; `inpatient-admit.test`: refuses busy cage | **thiếu** — 4C |
| | Xuất viện, phí lưu trú | `inpatient-stay.test`: day line 2,2 days…, issued invoice left alone | **thiếu** — 4C |
| 8 Điều trị nội bộ | Giờ sai | `inpatient.test`: impossible time refused (F03); `schedule-times.test` | `staff-b`: impossible time shows which part is wrong |
| | Thêm/dừng y lệnh, ghi nhận | `inpatient.test`: records administrations…; stops orders | **thiếu** (dừng y lệnh trên giao diện) |
| | Khách không lấy nội dung nội bộ | `leak.test` (cả tài khoản mẫu và sau nhập→chuyển→video→xuất) | `customer-a`: no staff name; `customer-b`: diary without clock times |
| 9 Nhật ký/video | Nháp, chia sẻ | `inpatient.test`: share, video needs both checks; `inpatient-videos.test` | `staff-b`: shares a diary draft; `journeys/video` |
| | Ngừng chia sẻ | **thiếu** (nhánh dữ liệu xác nhận có hàm/test) | **thiếu** |
| | Hết hạn 60 ngày | `scope.test`: expired/deleted/draft videos never returned; `video-expiry.test`; `inpatient.test`: purge | `customer-b`: videos muted, days left |
| 10 Hóa đơn | Nháp, giá mở, tải lại | `invoices.test`: draft line keeps price mode (F01); open-price lines need a price | `staff-b`: open-price line editable after reopen (F01); **NEW** ô giá trống là lỗi; chỉnh lúc đang lưu vẫn được lưu |
| | Phát hành, đóng băng | `invoices.test`: issue computes totals and freezes lines; cannot issue empty | `staff-b`, `journeys/billing`; **NEW** hóa đơn đã phát hành không có ô sửa |
| | Sửa hóa đơn đã phát hành bị từ chối ở API | **thiếu** (nhánh dữ liệu xác nhận `updateDraft` trên hóa đơn đã phát hành) | — |
| 11 Khoản thu | Thu một phần, nhiều lần | `invoices.test`: partial then full payment… | `staff-b`: 100.000 cash with change; `journeys/billing` |
| | Quá số còn lại | `invoices.test`: a payment above the remaining amount throws | — |
| | Hoàn tác khoản thu | chỉ quy tắc thuần (`invoice-math.test`: ignoring reversed payments); **chưa có chức năng hoàn tác** | chưa có chức năng |
| 12 Bảng giá | Sửa/tắt mục | `prices.test` (nhiều ca) | **thiếu** — 4D |
| | Không đổi tiền trên hóa đơn cũ | `prices.test`: update never changes lines already on invoices | — |
| 13 Báo cáo | Doanh thu theo danh mục, công nợ | `invoices.test`: revenue… outstanding; by category after discount | `staff-b`: revenue page visible only for quanly_ha |
| | Qua ngày/tháng (biên 00:00 giờ VN) | **thiếu** — nhánh dữ liệu | — |
| | Tiền đã thu / phát hành / công nợ không cộng lẫn | `invoices.test`: by category adds up to invoiced | — |
| 14 Đồng thời | Cùng hóa đơn | `invoices.test` (version) | `conflict.spec`: stale editor |
| | Cùng yêu cầu | `requests.test`: a stale version throws ConflictError | — (màn hình tự làm mới nên không tạo được trạng thái cũ) |
| | Cùng lịch | `appointments.test` (version) | `conflict.spec`: stale reschedule form |
| | Cùng khách/bé | `customers.test`: stale version refused | `giao-dien-nhan-vien-b`: sửa hồ sơ khách bằng phiên bản cũ → báo "vừa được người khác cập nhật" và thẻ hiện dữ liệu mới |
| 15 Truy cập chéo | Khách khác (hóa đơn, nội trú) | `scope.test`: another customer's stay or invoice is not found | `customer-b`; `giao-dien-khach`: another customer's invoice not found |
| | Thú cưng của khách khác | `zone.test`: other accounts' pets cannot be edited | **NEW** mở thú cưng khách khác → "Không tìm thấy trang này" |
| | Hóa đơn nháp | `scope.test`: only issued invoices are listed | — |
| | Spa xem doanh thu | `invoices.test`: spa cannot see invoices or revenue | `journeys/permissions`; `staff-b` |
| | Khách vào khu nhân viên và ngược lại | — | `guards.spec` |

## Kết quả đợt này (phía giao diện, 21/10/2026)

- Viết 7 test mới ở `e2e/giao-dien-nghiep-vu.spec.ts` (ba cỡ màn hình, chạy 2 lần liên tiếp đều xanh): đặt lịch thử lại tạo đúng một yêu cầu; yêu cầu bị từ chối / không liên lạc được hiển thị đúng cho khách; lịch đã hủy không còn nút đổi/hủy; Back sau đăng xuất không vào được trang khách; thú cưng khách khác "không tìm thấy"; hóa đơn đã phát hành không có ô sửa.
- **Không phát hiện lỗi mới** ở các ca này. (Hai lần test đỏ đầu là do viết test sai, đã sửa test: nút lý do từ chối cần chọn trước; yêu cầu "không liên lạc được" nằm ở tab Đang xử lý theo thiết kế.) Trang chủ có thẻ mẫu "HD-1031 · Dữ liệu mẫu" là minh họa, không phải dữ liệu khách.
- Chưa kiểm thử (ghi rõ): Safari/iPhone thật, Firefox; bàn phím và trình đọc màn hình đầy đủ; mạng lỗi/dữ liệu lớn; backend; các ô **thiếu — 4C/4D** chờ có giao diện nội trú và bảng giá.
- Việc cho nhánh dữ liệu: các ô "thiếu" ở cột Dữ liệu (lỗi ghi rồi thử lại, hủy lịch đã hủy, đổi tên bé, ngừng chia sẻ, sửa hóa đơn đã phát hành, qua ngày/tháng, và quy tắc chặn lịch trùng).
