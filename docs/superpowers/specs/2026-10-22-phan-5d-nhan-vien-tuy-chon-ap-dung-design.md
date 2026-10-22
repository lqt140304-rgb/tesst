# Phần 5D: Tùy chọn của tôi và áp dụng cài đặt hệ thống (khu nhân viên)

Ngày 22/10/2026. Nhánh `claude/giao-dien`. Làm tiếp sau 5C (quyết định R45). Số quyết định tiếp theo: R46.

## 1. Mục tiêu

Hai việc, cùng một lý do: **chọn xong thì phải thấy tác dụng**.

- **A. Tùy chọn của tôi:** mỗi nhân viên tự chọn cách làm việc (cỡ chữ, độ dày bảng, chuyển động, trang vào sau đăng nhập, kiểu xem lịch, số dòng mỗi trang, khoảng ngày báo cáo, nhắc việc) và thấy ngay nó có tác dụng khắp khu nhân viên.
- **B. Áp dụng cài đặt hệ thống:** những gì Quản lý đã lưu ở Cài đặt hệ thống (5C) phải đổi hành vi thật của lịch, hóa đơn và yêu cầu.

Chỉ làm giao diện. Dữ liệu (`staff.prefs`, `staff.settings`) đã sẵn từ nhánh dữ liệu; **không đổi `src/data/**`**. Hướng nhìn R43 (Linear 85% + Stripe 15%).

## 2. Đã có sẵn ở phía dữ liệu (không làm lại)

- `staff.prefs.get()/save(patch)/reset()`: mặc định theo vai (cỡ chữ Vừa, bảng Thoáng, chuyển động Theo máy, trang vào Trang chủ, lịch Tuần, 20 dòng, báo cáo 7 ngày, nhắc việc bật cho loại vai có quyền). Mất quyền thì trang vào và nhắc việc tự đọc ra `home`/tắt. `save` chỉ ghép khóa vừa đổi, hai tab đổi khóa khác nhau không ghi đè nhau.
- `staff.settings.get()` mọi nhân viên đọc được. Lớp dữ liệu **đã tự áp dụng**: số ngày báo sắp hết hạn của Kho và Báo cáo; từ chối ghi tiền bằng phương thức đang tắt ("Phương thức này đang tắt."); cờ `overdue` trên yêu cầu đặt lịch; khung giờ ngày lễ chỉ đến 19:00 cho khách. **Giao diện phải tự áp dụng** phần còn lại (mục 5).

## 3. A. Tùy chọn của tôi

**Chỗ đặt:** trang thứ năm của Cài đặt, `#/nv/cai-dat/tuy-chon` ("Tùy chọn của tôi", biểu tượng mới `sliders-horizontal`, thêm vào `scripts/duotone-icons.mjs` (Phosphor `SlidersHorizontal`) và `src/ui/icons/names.ts` rồi chạy `npm run icons`), xếp ngay sau Hồ sơ của tôi; mọi nhân viên đều thấy. Bí danh `nv-tuy-chon`.

**Cách lưu:** **chọn là lưu ngay**, không có nút Lưu. Mỗi lần đổi chỉ gửi đúng khóa vừa đổi (`save({ khóa })`). Có dòng trạng thái nhỏ "Đã lưu." (vùng thông báo `aria-live="polite"`); lưu lỗi thì trả ô về giá trị cũ và báo dưới ô. Nút **Về mặc định** ở cuối trang (có hỏi trước, gọi `reset()`).

**Các nhóm** (mỗi nhóm một khung phẳng, nhãn thường, ô chọn dạng nhóm nút, không dùng ô thả xuống khi chỉ có 2 đến 4 lựa chọn):

1. **Giao diện:** Cỡ chữ (Vừa, Lớn) · Độ dày bảng (Thoáng, Gọn) · Chuyển động (Theo máy, Luôn giảm). Mỗi ô có một dòng giải thích ngắn bằng lời thường, ví dụ "Luôn giảm: bỏ hiệu ứng trượt và phóng, chỉ còn mờ nhẹ, dù máy không bật chế độ giảm chuyển động."
2. **Khi đăng nhập:** Trang vào sau đăng nhập (chỉ liệt kê trang người đó được mở: Trang chủ; Lịch hẹn nếu có `appointments.view`; Nội trú nếu `inpatient.view`; Hóa đơn nếu `invoices.create` hoặc `payments.record`, theo `LANDING_NEEDS` của lớp dữ liệu).
3. **Màn hình làm việc:** Kiểu xem lịch (Tuần, Ngày) · Số dòng mỗi trang (10, 20, 50) · Khoảng ngày báo cáo (7 ngày, 30 ngày, Tháng này).
4. **Nhắc việc:** bốn công tắc, **chỉ hiện loại vai có quyền** (`NUDGE_NEEDS`): Yêu cầu đặt lịch chờ xử lý · Khách xin đổi lịch · Kho sắp hết · Hóa đơn nháp lâu chưa phát hành. Chữ lấy từ `NUDGE_LABEL`.

`onboarding_done` và `onboarding_hidden` là của danh sách "việc đầu tiên" ở 5E, không có ô nào ở 5D.

**Kho chứa tùy chọn ở giao diện:** một `PrefsProvider` trong khu nhân viên đọc `staff.prefs.get()` một lần sau khi biết phiên là nhân viên, nuôi `usePrefs()` (giá trị hiện hành + `savePref(patch)`), tự đọc lại khi `system.rev` đổi (như phiên đăng nhập). Trong lúc chưa đọc xong, dùng mặc định tạm (không nháy giao diện): giá trị lần cuối đã đọc được giữ trong `localStorage` làm mồi cho lần mở sau (chỉ là hiển thị; nguồn thật vẫn là `staff.prefs`).

## 4. A. Áp dụng tùy chọn

| Tùy chọn | Tác dụng |
|---|---|
| Cỡ chữ Lớn | Chữ và khoảng cách trong khu nhân viên to hơn 12,5% (`zoom: 1.125` trên khung `[data-zone="staff"]`, bật bằng `data-text="lg"`); thanh trên và thanh dưới điện thoại cùng đổi theo. Điện thoại 320 px vẫn không cuộn ngang (có test). |
| Độ dày bảng Gọn | `data-density="compact"` trên khung khu nhân viên: hàng của `DataTable` và các danh sách (Lịch trong ngày, thẻ yêu cầu) bớt khoảng đệm dọc, chiều cao chạm vẫn ≥ 40 px trên điện thoại. |
| Chuyển động Luôn giảm | `MotionConfig reducedMotion="always"` cho khu nhân viên và `data-motion="reduced"` tắt các chuyển động CSS riêng (không còn trượt, phóng hay nảy; chỉ còn mờ nhẹ như khi máy bật chế độ giảm chuyển động; các hiệu ứng CSS riêng về 0 giây). "Theo máy" thì theo `prefers-reduced-motion` như cũ. |
| Trang vào sau đăng nhập | Đăng nhập nhân viên thành công và **không có `tiep`** thì vào trang đã chọn (không phải `/nv`). Có `tiep` thì giữ nguyên `tiep`. Bấm logo hoặc "Tổng quan" vẫn về Tổng quan. |
| Kiểu xem lịch | Mở Lịch hẹn không kèm `view` trên địa chỉ thì dùng kiểu đã chọn; có `view` thì theo địa chỉ. |
| Số dòng mỗi trang | Mọi danh sách dạng bảng của khu nhân viên (Khách hàng, Hóa đơn, Kho, Bảng giá, Lịch sử kho, Tài khoản nhân viên) lấy `usePageSize()` làm cỡ trang. **Không áp dụng** cho bảng thay thế của biểu đồ (ngày trong kỳ), vì đó là bảng đối chiếu số liệu. |
| Khoảng ngày báo cáo | Báo cáo vận hành và Doanh thu mở không kèm `ky` thì dùng 7 ngày, 30 ngày hoặc Tháng này. Bộ chọn kỳ **thêm lựa chọn "30 ngày"** (hiện chỉ có Hôm nay, 7 ngày, Tháng này, Tháng trước, Chọn ngày). Doanh thu hiện mở ở Tháng này theo thiết kế 4D; từ 5D nó theo tùy chọn này (mặc định 7 ngày), ghi trong R46. |
| Nhắc việc | Khối **Nhắc việc** ở đầu Tổng quan, mỗi dòng một loại đang bật **và đang có việc** (số lượng), bấm vào đi thẳng tới màn xử lý: yêu cầu chờ xử lý; khách xin đổi lịch (`staff.requests.reschedules()`); món kho hết hoặc sắp hết (`staff.stock.summary()`); hóa đơn nháp để quá 2 ngày chưa phát hành. Không có việc nào thì khối không hiện. Tắt "Yêu cầu đặt lịch chờ xử lý" cũng tắt thông báo bật lên khi có yêu cầu mới. |

Con số "2 ngày" của hóa đơn nháp là ngưỡng của bản demo, ghi nhãn "ngưỡng mẫu" trong tài liệu, không phải số liệu bệnh viện.

## 5. B. Áp dụng cài đặt hệ thống

| Cài đặt | Tác dụng ở giao diện |
|---|---|
| Thời lượng khám và spa | Hộp thoại xác nhận yêu cầu (`ConfirmDialog`) và Tạo lịch hẹn (`NewAppointmentDialog`) lấy thời lượng mặc định từ cài đặt thay cho hằng số cứng (`SERVICE_MINUTES`); nội trú vẫn 30 phút (không có cài đặt riêng). Người dùng vẫn đổi tay được. |
| Giờ bắt đầu, kết thúc của lưới lịch | Lưới ngày và tuần chạy từ giờ nguyên chứa `calendar_start` đến giờ nguyên chứa `calendar_end` (làm tròn ra ngoài). Lịch hẹn nằm ngoài khung vẫn nới khung ra để không bị giấu (như hiện nay). |
| Phương thức thanh toán | Hộp thoại Thu tiền chỉ liệt kê phương thức đang bật; mặc định là phương thức đầu trong số đó. Lịch sử thanh toán cũ vẫn hiện phương thức đã dùng. Bảng "theo phương thức" ở Doanh thu vẫn đủ ba hàng. |
| Quá hạn của yêu cầu | Thẻ và chi tiết yêu cầu có nhãn **"Quá hạn"** (nhãn cam, có chữ, không chỉ màu) khi `overdue`; Tổng quan thêm số quá hạn vào thẻ "Yêu cầu cần xử lý". |
| Ngưỡng báo hết mặc định | Đã dùng ở hộp thoại Thêm món (5A); chỉ thêm test đối chiếu. |
| Số ngày báo sắp hết hạn | Lớp dữ liệu đã áp dụng; chữ giải thích ở Kho không được ghi cứng "30 ngày" (rà soát và đổi nếu có). |
| Ngày lễ | Phía nhân viên chỉ **cảnh báo, không chặn**: lịch ngày và tuần đánh dấu ngày lễ kèm ghi chú; hộp thoại Tạo lịch hẹn và xác nhận yêu cầu nhắc "Ngày lễ: bệnh viện làm đến 19:00" khi giờ hẹn kết thúc sau 19:00. Phía khách (trang đặt lịch) làm cùng đợt với việc đặt lịch ngoài giờ, không làm trong 5D. |

Mọi cài đặt đọc bằng `staff.settings.get()` qua một hook dùng chung (`useAppSettings()`), tự đọc lại khi cài đặt đổi (cùng cơ chế `system.rev`).

## 6. Quyền, lỗi, hai tab

- Tùy chọn của tôi: mọi nhân viên, chỉ của chính mình. Ô trang vào và nhắc việc chỉ hiện lựa chọn được phép; nếu quyền bị thu sau khi đã lưu, màn hiển thị giá trị đã hạ (`home`, tắt), giống lớp dữ liệu.
- Hai tab đổi hai khóa khác nhau: cả hai giữ (dữ liệu ghép từng khóa). Cùng một khóa: tab sau thắng, tab trước tự cập nhật khi `system.rev` đổi.
- Lưu hỏng (`ValidationError`): trả ô về giá trị cũ, câu lỗi của API hiện dưới ô.
- Cài đặt hệ thống chưa đọc xong thì dùng mặc định cũ (07–21, 30 và 60 phút, đủ ba phương thức) trong tích tắc đầu, không báo lỗi; đọc lỗi kéo dài thì giữ mặc định và không chặn việc.

## 7. Trợ năng, chuyển động, điện thoại

- Mỗi nhóm nút chọn là `radiogroup` có tên, điều khiển bằng bàn phím, ô bật tắt có nhãn, trạng thái "Đã lưu." đọc được bằng trình đọc màn hình.
- Chữ cỡ Lớn, tương phản chữ ≥ 4,5:1, điện thoại 320 px không cuộn ngang ở cả hai cỡ chữ và cả hai độ dày.
- Chuyển động theo hệ chung (150 đến 450 ms, một lần); với "Luôn giảm" chỉ còn mờ nhẹ, không trượt, không phóng, không nảy (đúng như khi máy bật chế độ giảm chuyển động).

## 8. Cấu trúc tệp (dự kiến)

- `src/features/staff/prefs/`: `PrefsProvider.tsx`, `usePrefs.ts`, `prefsView.ts` (+ test: trang vào → địa chỉ, danh sách trang/nhắc việc được phép theo quyền, kỳ báo cáo → kỳ, hạ giá trị khi mất quyền), `useAppSettings.ts`, `settingsEffects.ts` (+ test: giờ lưới từ cài đặt, thời lượng mặc định, phương thức đang bật, ngày lễ và giờ kết thúc), `nudges.ts` (+ test: dòng nhắc theo công tắc và số lượng).
- `src/features/staff/settings/PrefsPage.tsx` + `Prefs.module.css` (trang Tùy chọn của tôi).
- Sửa: `SettingsLayout` (thêm trang), `router.tsx`, `routes.ts`, `StaffShell` (gắn `PrefsProvider`, thuộc tính `data-text/data-density/data-motion`), `RootLayout` (chuyển động), `LoginPage` (trang vào), `CalendarPage`, `gridMath`, `ConfirmDialog`, `NewAppointmentDialog`, `PaymentDialog`, các trang có `DataTable`, `PeriodPicker`/`revenueView` (thêm 30 ngày), `DashboardPage` (khối Nhắc việc), thẻ yêu cầu (nhãn Quá hạn), CSS của `DataTable` và các danh sách.
- E2E: `e2e/giao-dien-nhan-vien-h.spec.ts` (ba cỡ màn hình).

## 9. Kiểm thử

- Đơn vị cho từng hàm thuần ở mục 8.
- E2E: đổi từng tùy chọn thì đổi ngay trên màn thật (cỡ chữ đo được bằng kích thước chữ; độ dày đo chiều cao hàng; chuyển động Luôn giảm kiểm bằng hộp thoại mở ra không còn trượt hay phóng; trang vào qua đăng nhập thật với và không với `tiep`; kiểu xem lịch; số dòng; khoảng ngày báo cáo gồm lựa chọn "30 ngày"; nhắc việc bật tắt và bấm đi đúng màn); tab thứ hai thấy tùy chọn mới sau khi tải lại; "Về mặc định" có hỏi; spa không thấy lựa chọn trang Hóa đơn hay nhắc việc Kho theo quyền. Cài đặt hệ thống: Quản lý đổi thời lượng thì hộp thoại xác nhận dùng số mới; đổi giờ lưới thì lưới đổi; tắt QR thì hộp thu tiền không còn QR; hạ ngưỡng quá hạn thì yêu cầu mẫu hiện nhãn Quá hạn; thêm ngày lễ hôm nay thì lịch đánh dấu và hộp thoại tạo lịch nhắc.
- Trợ năng (axe) trên trang Tùy chọn; 320 px ở cỡ chữ Lớn và bảng Gọn; bàn phím đi hết các ô.

## 10. Chưa làm trong 5D

Tùy chọn khác (màu giao diện, ngôn ngữ); danh sách việc đầu tiên và Trợ giúp (5E); phụ phí lễ (chủ dự án cập nhật sau); đặt lịch ngoài giờ cho khách và ghi chú ngày lễ ở trang đặt lịch; cài đặt cho khách.

## 11. Chủ dự án đã chốt (22/10/2026)

1. **Lịch hẹn mở ở kiểu Ngày** khi chưa chọn gì. Lớp dữ liệu đang đặt mặc định Tuần: đã ghi yêu cầu đổi mặc định `appointments_view` sang `day` cho nhánh dữ liệu (`PROGRESS.md`, "Yêu cầu gửi nhánh kia"). Giao diện không phân biệt được "chưa chọn" với "đã chọn Tuần" (`get()` đã ghép mặc định), nên việc áp dụng kiểu xem lịch xếp **cuối kế hoạch** và chỉ chạy khi mặc định phía dữ liệu đã là `day`; nếu tới lúc đó chưa có, mình báo bạn thay vì tự sửa thư mục dữ liệu.
2. **Doanh thu theo tùy chọn "Khoảng ngày báo cáo"** của từng người (mặc định 7 ngày), giống Báo cáo vận hành.
3. **Hóa đơn nháp "lâu chưa phát hành" = quá 2 ngày** (ngưỡng mẫu của bản demo).
