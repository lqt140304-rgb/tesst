# Bảng kiểm thử nghiệp vụ — 15 luồng (21/10/2026)

Nguồn: bảng "Task 4" trong `ke-hoach-hoan-thien-le-son-2026-10-21.md`. Mỗi trường hợp ghi nơi đã có test (tệp::tên test, rút gọn) hoặc **thiếu**.
Cột **Dữ liệu** do nhánh dữ liệu xác nhận/điền (đã điền sẵn những gì đọc được từ tên test, chưa chạy lại từng cái); cột **Giao diện** do nhánh giao diện điền.
`NEW` = test mới viết trong đợt này (`e2e/giao-dien-nghiep-vu.spec.ts` hoặc `giao-dien-nhan-vien-a.spec.ts`). `—` = không áp dụng ở lớp đó. `chưa có chức năng` = chưa có trong ứng dụng demo.

| Luồng | Trường hợp | Dữ liệu (`src/data/**`) | Giao diện (`e2e/**`) |
|---|---|---|---|
| 1 Đặt lịch | Gửi | `public.test`: creates a pending request… | `booking.spec`: guest submits and sees the confirmation |
| | Gửi lại (trùng) | `public.test`: identical resubmit while pending / unreachable / after cancelled; `dedupe.test` | `booking.spec`: an identical resubmit shows the same confirmation |
| | Lỗi ghi, thử lại | NEW `business-flows.test`: lời gửi bị từ chối không ghi gì; thử lại tạo đúng một yêu cầu, thử lại lần nữa không tạo thêm (lỗi ghi giữa chừng: `db.test` rollback) | `booking.spec`: failed save keeps input; **NEW** `nghiep-vu`: retry creates exactly one request |
| 2 Xử lý yêu cầu | Liên hệ, xác nhận | `requests.test`: startContact, confirm creates the appointment atomically | `staff-a`: start contact / confirm dialog; `journeys/booking` |
| | Không liên lạc được | `requests.test`: logCall can move contacting to unreachable | **NEW** khách thấy "Không liên lạc được" ở Đang xử lý |
| | Từ chối | `requests.test`: reject records reason and duplicate code internally | **NEW** khách thấy "Từ chối", không lộ lý do/tên nhân viên |
| | Trạng thái sai | `requests.test`: an illegal transition throws; `request-status.test` | — |
| 3 Đổi/hủy lịch | Đổi thời điểm | `appointments.test`: creates, reschedules and cancels | `conflict.spec`; `giao-dien-nhan-vien-a`: change inside the panel; panel follows the move |
| | Hủy lịch; hủy từ yêu cầu | `appointments.test`: cancelling from a confirmed request cancels the request | `giao-dien-nhan-vien-a`: change and cancel need reasons |
| | Lịch đã hủy | NEW `business-flows.test`: lịch đã hủy không đổi giờ được; hủy lại không đổi gì, không thêm nhật ký | **NEW** lịch đã hủy đọc được, hết nút Đổi/Hủy |
| | Giao giờ cùng người phụ trách | NEW `appointments.test`, `requests.test`, `appointment-overlap.test`, `seed.test`: chặn ở tạo / dời / xác nhận yêu cầu; chạm giờ không tính; đã hủy, chưa phân công bỏ qua; hai lần gửi cùng lúc; dữ liệu mẫu không tự trùng | xếp cạnh nhau (`giao-dien-nhan-vien-a`: same time side by side) |
| 4 Hồ sơ thú cưng | Hai bé cùng tên, lịch sử theo id | `zone.test`: a pet page lists the bookings of that pet by id (F02) | — |
| | Đổi tên không mất lịch sử | NEW `business-flows.test`: sau khi đổi tên, lịch hẹn, yêu cầu của khách vẫn theo id bé | — |
| | Sửa bé, cân nặng, cảnh báo giữ | `customers.test`: updates a pet; M3 alerts | `customer-a`: adding pet; `giao-dien-khach`: a pet the customer added can be edited |
| 5 Tài khoản | Đăng ký trùng đồng thời | `auth.test`: two sign-ups racing (F04) | — |
| | Đăng xuất, mở lại trang | `auth.test`: logout clears the session; `remember.test` | `auth.spec`: logout…; `guards.spec`; **NEW** Back sau đăng xuất không vào được trang khách |
| | Không lộ dữ liệu phiên trước | `remember.test`: staff never remembered, after 30 days signed out | **NEW** (cùng test trên) |
| 6 Liên hệ hồ sơ | Đúng/sai mã | `customers.test`: findByLinkCode…; link requires confirmation | `staff-a`: link minh_khoa (mã sai có thông báo); `journeys/linking` |
| | Sai chủ | `customers.test`: a pet match must belong to the account and the customer | — |
| | Liên kết lại | `customers.test`: cannot link an account that is already linked | **thiếu** (giao diện báo gì khi mã đã liên kết) |
| | Người không có quyền | `customers.test`: a doctor cannot link | `staff-a`: quyền |
| 7 Nội trú | Nhập viện | `inpatient-admit.test` (nhiều ca) | `giao-dien-nhan-vien-c`: nhập viện 3 bước (từ lịch hẹn hôm nay, từ ô tìm, chuồng bị tab khác lấy → về bước chuồng, bé chưa có cân nặng không ghi tiền ngày) |
| | Chuyển chuồng; không hai ca một chuồng | `inpatient-stay.test`: moves…, refuses busy or same cages; `inpatient-admit.test`: refuses busy cage | `giao-dien-nhan-vien-c`: chuyển chuồng có lý do nhanh; hộp thoại cũ báo xung đột, không ghi đè |
| | Xuất viện, phí lưu trú | `inpatient-stay.test`: day line 2,2 days…, issued invoice left alone | `giao-dien-nhan-vien-c`: tóm tắt tiền theo giờ đổi theo giờ xuất viện, nhắc nháp không chặn, lời chào chia sẻ; hành trình trọn vòng (nhập viện → chuyển → video → xuất viện → hóa đơn 0,1 ngày → chuồng trống) — 4C |
| 8 Điều trị nội bộ | Giờ sai | `inpatient.test`: impossible time refused (F03); `schedule-times.test` | `staff-b`: impossible time shows which part is wrong |
| | Thêm/dừng y lệnh, ghi nhận | `inpatient.test`: records administrations…; stops orders | **thiếu** (dừng y lệnh trên giao diện) |
| | Khách không lấy nội dung nội bộ | `leak.test` (cả tài khoản mẫu và sau nhập→chuyển→video→xuất) | `customer-a`: no staff name; `customer-b`: diary without clock times |
| 9 Nhật ký/video | Nháp, chia sẻ | `inpatient.test`: share, video needs both checks; `inpatient-videos.test` | `staff-b`: shares a diary draft; `journeys/video` |
| | Ngừng chia sẻ | NEW `business-flows.test`: rút nhật ký và ngừng chia sẻ video → khách không còn thấy, phần còn lại giữ nguyên | **thiếu** |
| | Hết hạn 60 ngày | `scope.test`: expired/deleted/draft videos never returned; `video-expiry.test`; `inpatient.test`: purge | `customer-b`: videos muted, days left |
| 10 Hóa đơn | Nháp, giá mở, tải lại | `invoices.test`: draft line keeps price mode (F01); open-price lines need a price | `staff-b`: open-price line editable after reopen (F01); **NEW** ô giá trống là lỗi; chỉnh lúc đang lưu vẫn được lưu |
| | Phát hành, đóng băng | `invoices.test`: issue computes totals and freezes lines; cannot issue empty | `staff-b`, `journeys/billing`; **NEW** hóa đơn đã phát hành không có ô sửa |
| | Sửa hóa đơn đã phát hành bị từ chối ở API | NEW `business-flows.test`: `updateDraft` và phát hành lần hai bị từ chối, dòng và phiên bản giữ nguyên | — |
| 11 Khoản thu | Thu một phần, nhiều lần | `invoices.test`: partial then full payment… | `staff-b`: 100.000 cash with change; `journeys/billing` |
| | Quá số còn lại | `invoices.test`: a payment above the remaining amount throws | — |
| | Hoàn tác khoản thu | quy tắc thuần (`invoice-math.test`) + NEW `business-flows.test`: khoản đã đánh dấu hoàn tác rời khỏi tiền đã thu, quay lại thành tiền còn nợ, thu lại được; **chưa có chức năng hoàn tác** | chưa có chức năng |
| 12 Bảng giá | Sửa/tắt mục | `prices.test` (nhiều ca) | `giao-dien-nhan-vien-d`: thêm/sửa trong hộp thoại, lỗi giữ dữ liệu, hai tab sửa cùng lúc báo xung đột, ngừng dùng có hỏi, dịch vụ tắt rời bộ chọn nhưng hóa đơn nháp đã có vẫn lưu, hóa đơn cũ giữ giá cũ, giá gợi ý điền sẵn |
| | Không đổi tiền trên hóa đơn cũ | `prices.test`: update never changes lines already on invoices | — |
| 13 Báo cáo | Doanh thu theo danh mục, công nợ | `invoices.test`: revenue… outstanding; by category after discount | `staff-b`: revenue page visible only for quanly_ha |
| | Qua ngày/tháng (biên 00:00 giờ VN) | NEW `business-flows.test`: tiền phát hành và tiền thu rơi đúng ngày qua 00:00 và cuối tháng; mốc 17:00 UTC = 00:00 giờ VN; công nợ là số hiện tại, không đổi theo khoảng ngày | — |
| | Tiền đã thu / phát hành / công nợ không cộng lẫn | `invoices.test`: by category adds up to invoiced | — |
| 14 Đồng thời | Cùng hóa đơn | `invoices.test` (version); NEW `business-flows.test`: hai lần phát hành cùng lúc, hai khoản thu đầy đủ cùng lúc (không thu quá) | `conflict.spec`: stale editor |
| | Cùng yêu cầu | `requests.test`: a stale version throws ConflictError; NEW `business-flows.test`: hai lần xác nhận cùng lúc, chỉ một lịch được tạo | — (màn hình tự làm mới nên không tạo được trạng thái cũ) |
| | Cùng lịch | `appointments.test` (version); NEW `business-flows.test`: hai lần dời cùng lúc | `conflict.spec`: stale reschedule form |
| | Cùng khách/bé | `customers.test`: stale version refused | `giao-dien-nhan-vien-b`: sửa hồ sơ khách bằng phiên bản cũ → báo "vừa được người khác cập nhật" và thẻ hiện dữ liệu mới |
| 15 Truy cập chéo | Khách khác (hóa đơn, nội trú) | `scope.test`: another customer's stay or invoice is not found | `customer-b`; `giao-dien-khach`: another customer's invoice not found |
| | Thú cưng của khách khác | `zone.test`: other accounts' pets cannot be edited | **NEW** mở thú cưng khách khác → "Không tìm thấy trang này" |
| | Hóa đơn nháp | `scope.test`: only issued invoices are listed | — |
| | Spa xem doanh thu | `invoices.test`: spa cannot see invoices or revenue; NEW `business-flows.test`: khách, khách vãng lai, bác sĩ gọi hàm nhân viên / khách bị `ForbiddenError` | `journeys/permissions`; `staff-b` |
| | Khách vào khu nhân viên và ngược lại | — | `guards.spec` |

## Kết quả đợt này (phía giao diện, 21/10/2026)

- Viết 7 test mới ở `e2e/giao-dien-nghiep-vu.spec.ts` (ba cỡ màn hình, chạy 2 lần liên tiếp đều xanh): đặt lịch thử lại tạo đúng một yêu cầu; yêu cầu bị từ chối / không liên lạc được hiển thị đúng cho khách; lịch đã hủy không còn nút đổi/hủy; Back sau đăng xuất không vào được trang khách; thú cưng khách khác "không tìm thấy"; hóa đơn đã phát hành không có ô sửa.
- **Không phát hiện lỗi mới** ở các ca này. (Hai lần test đỏ đầu là do viết test sai, đã sửa test: nút lý do từ chối cần chọn trước; yêu cầu "không liên lạc được" nằm ở tab Đang xử lý theo thiết kế.) Trang chủ có thẻ mẫu "HD-1031 · Dữ liệu mẫu" là minh họa, không phải dữ liệu khách.
- Chưa kiểm thử (ghi rõ): Safari/iPhone thật, Firefox; bàn phím và trình đọc màn hình đầy đủ; mạng lỗi/dữ liệu lớn; backend; các ô **thiếu — 4C/4D** chờ có giao diện nội trú và bảng giá.
- Việc cho nhánh dữ liệu: các ô "thiếu" ở cột Dữ liệu (lỗi ghi rồi thử lại, hủy lịch đã hủy, đổi tên bé, ngừng chia sẻ, sửa hóa đơn đã phát hành, qua ngày/tháng, và quy tắc chặn lịch trùng).

## Kết quả đợt này (phía dữ liệu, 21/10/2026)

- Viết 15 test mới ở `src/data/mock/api/business-flows.test.ts` (và test chặn lịch trùng ở `appointments.test`, `requests.test`, `appointment-overlap.test`, `seed.test`) cho mọi ô "thiếu" ở cột Dữ liệu, trừ những ô chưa có chức năng (hoàn tác khoản thu thật) hoặc thuộc giao diện.
- **Không phát hiện lỗi mới** ở lớp dữ liệu: 15 test đều qua ngay lần chạy đầu (các lần đỏ đầu là do viết test sai: thiếu `consent`, dữ liệu mẫu có hóa đơn cùng ngày, công nợ là số tính tại thời điểm xem). Kiểm tra độ "cắn": tạm bỏ chặn lịch đã hủy và chặn thu quá số còn lại thì 3 test đỏ, trả lại thì xanh.
- Chưa kiểm thử (ghi rõ): hoàn tác khoản thu bằng chức năng thật (chưa có); lỗi ghi giữa chừng ở nơi lưu trữ thật (chỉ có rollback ở `db.test`); nội trú nhiều ca đồng thời; mạng lỗi, dữ liệu lớn, backend thật.

## Kho (phần 5A giao diện, 22/10/2026)

Không nằm trong 15 luồng gốc; ghi ở đây để cùng một chỗ. Dữ liệu: `stock.test`, `stock` (rules), `reports.test` (nhánh dữ liệu).

| Trường hợp | Giao diện (`e2e/giao-dien-nhan-vien-e.spec.ts`) |
|---|---|
| Xem kho, ô tóm tắt, lọc, tìm không dấu, địa chỉ hỏng | `stock list`: bốn ô khớp dữ liệu mẫu, bấm ô lọc và bấm lại bỏ lọc, hai ô hạn dùng cùng bật một bộ lọc, tải lại giữ bộ lọc, địa chỉ hỏng về mặc định |
| Phân quyền | `stock list`: bác sĩ và Spa không thấy mục Kho, vào thẳng địa chỉ thấy trang không đủ quyền; "chỉ xem" kiểm bằng `stockCaps` (test đơn vị), e2e bổ sung ở 5C |
| Thêm/Sửa món | `stock add and edit`: lỗi từng ô bằng câu của quy tắc, tên trùng, loại bị khóa khi sửa, mức báo hết 0, hai tab sửa cùng lúc báo xung đột |
| Nhập/Xuất/Kiểm kê | `stock movements`: số sai (`abc`, 0, 2,5, −3, vượt 1.000.000), xuất quá tồn, xuất hết thành Hết hàng, kiểm kê lệch/khớp/0, hạn dùng gần hơn được giữ, hai tab, món ngừng dùng bị khóa |
| Ngừng dùng/Dùng lại | `stock on and off`: có hỏi, hậu quả được nói rõ, số "Sắp hết" đổi theo, hai tab, bàn phím |
| Trợ năng, 320 px | `stock accessibility` và các ca `@narrow`: axe sạch trên danh sách, món và các hộp thoại; không cuộn ngang |

## Báo cáo vận hành (phần 5B giao diện, 22/10/2026)

Ngoài 15 luồng gốc. Dữ liệu: `reports` và `operations-report` (nhánh dữ liệu).

| Trường hợp | Giao diện (`e2e/giao-dien-nhan-vien-f.spec.ts`, `src/features/staff/reports/reportsView.test.ts`) |
|---|---|
| Kỳ và địa chỉ | `operations report page`: mặc định 7 ngày, hai dòng "Kỳ này / Kỳ trước" đúng độ dài, đổi kỳ đổi địa chỉ, địa chỉ hỏng về 7 ngày, ngày sai báo đúng câu và giữ số, ngày đúng vào địa chỉ |
| Phân quyền | bác sĩ và Spa không thấy mục Báo cáo và bị chặn khi vào địa chỉ; "có quyền xem báo cáo nhưng không xem doanh thu / yêu cầu / kho" kiểm bằng test đơn vị `attentionItems`, `showRevenue`, e2e bổ sung ở 5C |
| Bốn số và "Cần chú ý" | `first row`: đúng thứ tự, mỗi số có so sánh bằng lời, số theo kỳ, khớp kho mẫu, liên kết đi đúng màn |
| Các nhóm cộng đúng | `appointments and requests`: theo dịch vụ = theo nguồn = lịch đã hẹn, theo trạng thái = yêu cầu nhận; biểu đồ có bảng thay thế cộng đúng; kỳ 366 ngày |
| Tỉ lệ không tính được | test đơn vị `percentText`, `minutesText`, `ratioRows`; e2e: không có NaN, Infinity, undefined |
| Nội trú, doanh thu, kỳ rỗng | `inpatient, revenue and empty period`: giải thích số, khối tiền, kỳ rỗng hiện câu và vẫn có "Cần chú ý" |
| Trợ năng, 320 px | axe sạch trên cả trang, khi mở bảng thay thế và khi kỳ rỗng; không cuộn ngang |

---

## Cài đặt (phần 5C giao diện, 22/10/2026)

Ngoài 15 luồng gốc. Dữ liệu: `team`, `profile`, `settings` (nhánh dữ liệu).

| Trường hợp | Giao diện (`e2e/giao-dien-nhan-vien-g.spec.ts`, `src/features/staff/settings/*.test.ts`) |
|---|---|
| Lối vào | `settings shell and hospital`: cả ba vai thấy mục Cài đặt; địa chỉ trần mở Hồ sơ của tôi; cột trang con chỉ có trang được mở |
| Thông tin bệnh viện | đúng nguyên văn, số gọi `tel:+84973555105`, "24/24" chỉ cạnh Cấp cứu, không có ô nhập |
| Hồ sơ | `profile`: đổi tên hiện ở menu tài khoản và sau khi tải lại; tên trống báo dưới ô; mỗi lỗi mật khẩu đúng một ô, không đổi gì; đổi xong đăng nhập bằng mật khẩu mới, mật khẩu cũ không còn; "Quyền của tôi" nằm trong trang, gom theo nhóm việc |
| Tài khoản nhân viên | `staff accounts`: thêm người rồi đăng nhập được; tên trùng và không chọn vai báo đúng chỗ; quyền theo vai tích sẵn và khóa; đổi vai cập nhật ngay; đặt lại mật khẩu cho người khác, không có nút cho chính mình; tắt có hỏi, người đó không đăng nhập được, bật lại không hỏi; Quản lý cuối cùng không bỏ được vai Quản lý; hai tab đụng nhau thì tab sau bị từ chối; quyền cấp hoặc thu có hiệu lực ở lần mở sau |
| Quyền ghi Kho từng việc | `stock rights`, `granting rights end to end`: Bác sĩ và Spa chỉ xem Kho; cấp riêng "Nhập thêm kho" thì chỉ có nút Nhập thêm; cấp thêm "Xuất kho" thì thêm nút Xuất ra |
| Báo cáo không có tiền | cấp riêng "Xem báo cáo vận hành" cho Bác sĩ: thấy Báo cáo, không có khối Doanh thu, dòng yêu cầu đang chờ là chữ khi thiếu quyền tiếp nhận |
| Cài đặt hệ thống | `system settings`: lưu rồi còn nguyên sau khi tải lại; sai nhiều ô cùng lúc báo đúng ô, giữ chữ đã gõ, không lưu gì; ngày lễ sắp theo ngày, ngày không có thật hoặc trùng bị từ chối trước khi gửi; người không có quyền chỉ thấy chữ; hai tab đụng nhau |
| Trợ năng, 320 px | axe sạch trên Hồ sơ, Tài khoản (đang mở hộp thoại sửa), Cài đặt hệ thống; không cuộn ngang |

