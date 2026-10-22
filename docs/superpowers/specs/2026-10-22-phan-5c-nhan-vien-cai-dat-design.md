# Phần 5C: Khu nhân viên, Cài đặt

Ngày: 22/10/2026 · Nhánh `claude/giao-dien` · Chủ dự án đã duyệt thiết kế bằng lời (22/10/2026: **bốn trang con trong một mục Cài đặt**, **Quản lý tự nhập mật khẩu mới khi đặt lại cho người khác**, "ổn rồi"); tệp này chờ duyệt bản viết.

Thuộc phần 5 (`2026-10-21-phan-5-kho-bao-cao-cai-dat-design.md` §3.3 A và C). **Dữ liệu đã có đủ** từ nhánh dữ liệu: `staff.team`, `staff.profile`, `staff.settings` (`hospital()`, `get()`, `update()`, có `holidays`), quyền Kho tách bốn (`stock.receive`, `stock.issue`, `stock.adjust`, `stock.items`). Không đổi `src/data`.

## 1. Hướng thiết kế và phạm vi

Theo R43: **Linear 85% + Stripe 15%**, nền phẳng, đường kẻ mảnh, một màu nhấn tím mận, không gradient trong vùng dữ liệu; chữ số đều bề ngang; nhãn viết thường. Kỷ luật bố cục của taste-skill: không bốn thẻ giống nhau, không chấm trang trí, không gạch dài `—` trong chữ mới.

**Có trong 5C:** mục **Cài đặt** với bốn trang con; đổi màn Kho sang bốn quyền ghi mới; hai bài e2e "chỉ có quyền xem" đã hẹn ở 5A và 5B.

**Chưa có trong 5C (để 5D):** *áp dụng* các cài đặt hệ thống vào ứng dụng (lưới lịch theo giờ đã đặt, thời lượng mặc định, phương thức thanh toán đang bật, yêu cầu quá hạn) và Tùy chọn cá nhân. Ở 5C các cài đặt chỉ sửa và lưu được; trang ghi rõ một câu "Các thay đổi sẽ áp dụng vào lịch, hóa đơn và yêu cầu ở bước kế tiếp." đến khi 5D xong, rồi bỏ câu đó.

**Không làm:** xóa hẳn nhân viên, tự đăng ký nhân viên, sửa thông tin bệnh viện, nhật ký thao tác trên giao diện, mật khẩu mạnh theo chính sách riêng (dùng luật của lớp dữ liệu).

## 2. Lối vào và địa chỉ

- Mục **Cài đặt** ở thanh bên cho **mọi nhân viên** (biểu tượng `settings`), đặt cuối danh sách. Địa chỉ `#/nv/cai-dat` chuyển thẳng tới `#/nv/cai-dat/ho-so`; bí danh `nv-cai-dat`.
- Bốn trang con (liên kết, không phải tab trong trang): `ho-so` "Hồ sơ của tôi" · `benh-vien` "Thông tin bệnh viện" · `tai-khoan` "Tài khoản nhân viên" (quyền `staff.manage`) · `he-thong` "Cài đặt hệ thống" (xem: mọi nhân viên; sửa: `settings.manage`).
- Danh sách trang con là cột bên trái ở ≥ 900 px, trên điện thoại xếp thành lưới liên kết nằm ngang có xuống dòng (không cuộn ngang). Trang con không có quyền thì không hiện; vào thẳng địa chỉ thì thấy "Mục này dành cho người có quyền phù hợp".

## 3. Hồ sơ của tôi

- **Thông tin:** tên đăng nhập (chỉ xem), tên hiển thị (sửa được, lưu bằng `profile.updateName`), chức danh (chỉ xem, ghi "Chỉ Quản lý sửa được chức danh."), nhóm quyền.
- **Đổi mật khẩu:** ba ô (hiện tại, mới, nhập lại), mỗi ô có nút hiện/ẩn; lỗi từ API gắn đúng ô (`current`, `next`, `next2`). Thành công: thông báo "Đã đổi mật khẩu.", xóa ba ô, giữ nguyên phiên.
- **Quyền của tôi:** các quyền đang có, **gom theo nhóm việc** (bảng nhóm ở §5), dạng chữ dễ đọc. Mục "Quyền của tôi" cũ ở menu tài khoản trên đầu trang mở thẳng trang này (bỏ hộp thoại cũ, một chỗ duy nhất).

## 4. Thông tin bệnh viện (chỉ xem)

Một khối đọc, từ `settings.hospital()`: tên, địa chỉ, hotline (liên kết gọi `tel:+84973555105`), **Giờ làm việc 08:00–21:00, không nghỉ trưa, Chủ nhật như ngày thường**, **Cấp cứu 24/24** (nhãn riêng, chữ "24/24" chỉ gắn với Cấp cứu), Bác sĩ trưởng. Đúng nguyên văn tài liệu dự án; câu "Nội dung này chỉ để xem. Cần sửa, báo bên làm hệ thống." thay cho nút sửa.

## 5. Tài khoản nhân viên (quyền `staff.manage`)

- **Bảng chung** (`DataTable`, điện thoại: thẻ): **Tên** (kèm tên đăng nhập nhỏ bên dưới, nhãn "Bạn" cho chính mình), **Vai**, **Quyền thêm** ("3 quyền thêm" hoặc "Không có"), **Trạng thái** (Đang dùng / Đã tắt). Người đã tắt xếp cuối (API đã sắp). Nút **Thêm nhân viên**.
- **Thêm / Sửa nhân viên** (một hộp thoại): Tên đăng nhập (chỉ khi thêm), Mật khẩu (chỉ khi thêm), Tên hiển thị, Chức danh, **Vai** (ba ô chọn Quản lý / Bác sĩ / Nhân viên Spa, ít nhất một), **Quyền thêm**: danh sách tích chọn **gom theo nhóm việc**. Quyền đã nằm trong vai thì tích sẵn, khóa, kèm chữ "Có theo vai" (đổi vai thì cập nhật ngay). Nhóm: 
  - *Yêu cầu và lịch:* `requests.handle`, `appointments.view`, `appointments.manage`
  - *Khách hàng:* `customers.view`, `customers.edit`, `accounts.link`
  - *Nội trú:* `inpatient.view`, `inpatient.admit`, `inpatient.clinical`, `inpatient.diary_write`, `inpatient.share`
  - *Hóa đơn và giá:* `invoices.create`, `payments.record`, `invoices.void`, `pricelist.edit`
  - *Kho:* `stock.view`, `stock.receive`, `stock.issue`, `stock.adjust`, `stock.items` (quyền gộp cũ `stock.manage` chỉ hiện khi tài khoản đang giữ nó, để bỏ tích được)
  - *Báo cáo và cài đặt:* `reports.revenue`, `reports.operations`, `staff.manage`, `settings.manage`, `support.inbox`
  Một quyền ghi Kho mà thiếu `stock.view` cho dòng nhắc "Quyền ghi Kho cần thêm Xem kho."; nhãn lấy từ `CAP_LABEL`. Gửi `version` lúc mở; `ConflictError` → thông báo, đóng hộp thoại.
- **Đặt lại mật khẩu** (hộp thoại riêng, chỉ cho người khác): Quản lý gõ mật khẩu mới + nhắc "Hãy báo cho họ; họ đổi lại ở Hồ sơ của họ." Với chính mình nút ẩn, chỉ chữ "Bạn đổi mật khẩu của mình ở Hồ sơ của tôi."
- **Tắt / Bật tài khoản:** tắt có hỏi và nói hậu quả ("Người này sẽ không đăng nhập được nữa. Lịch sử vẫn giữ tên."); bật không hỏi. Hai luật bảo vệ được nói bằng lời: chính mình không có nút tắt (kèm chữ "Bạn không tắt được tài khoản của chính mình."); người Quản lý cuối cùng không tắt và không bỏ được vai Quản lý (lỗi API hiện nguyên câu).
- Tài khoản tạo mới là "tài khoản mẫu" của demo (ghi một dòng nhỏ dưới bảng).

## 6. Cài đặt hệ thống

Mọi nhân viên xem; nút sửa và nút Lưu chỉ cho người có `settings.manage` (người khác thấy giá trị ở dạng chữ). Một form, **một nút Lưu cho cả trang**, gửi `version` lúc đọc, chỉ gửi trường đã đổi; nút Lưu khóa khi chưa đổi gì; lỗi gắn đúng ô theo tên trường của API (ví dụ `calendar_end`); `ConflictError` → thông báo và tải lại. Các nhóm, mỗi nhóm một khối ngăn bằng đường kẻ:
- **Giờ và lịch:** Giờ bắt đầu lưới lịch, Giờ kết thúc (kiểu giờ `HH:MM`), Thời lượng mặc định Khám (phút), Thời lượng mặc định Spa (phút).
- **Kho:** "Báo sắp hết hạn trước (ngày)", "Mức báo hết gợi ý khi thêm món".
- **Thanh toán:** ba ô tích Tiền mặt / Chuyển khoản / QR (ít nhất một; lỗi từ API).
- **Yêu cầu đặt lịch:** "Coi là quá hạn sau (giờ)".
- **Ngày lễ:** danh sách ngày đã nhập (theo thứ tự ngày, mỗi dòng có ngày kiểu Việt, ghi chú nội bộ và nút Xóa), dòng thêm mới gồm ô ngày và ô ghi chú (không bắt buộc) và nút Thêm; chú thích "Ngày lễ bệnh viện vẫn làm nhưng chỉ đến 19:00. Khách vẫn đặt được, ngoài các khung giờ sau 19:00. Ghi chú chỉ nhân viên thấy." Ngày trùng hoặc không có thật: câu của API dưới ô. Không có phụ phí lễ (để sau).
- **Quy định cố định:** `fixedRules` ở dạng chỉ đọc, đầu khối ghi "Đã chốt, không sửa ở đây."

## 7. Màn Kho đổi sang bốn quyền

Hàm `stockCaps(can)` trả `{ view, receive, issue, adjust, items }` (mỗi quyền ghi cần thêm `view`; `stock.manage` đã gộp vào phía dữ liệu nên `can` đã trả đúng). **Thêm món, Sửa thông tin, Ngừng dùng / Dùng lại** cần `items`; **Nhập thêm** cần `receive`; **Xuất ra** cần `issue`; **Kiểm kê** cần `adjust`. Nút không có quyền thì ẩn (không làm mờ). Test đơn vị của `stockCaps` mở rộng; bài e2e cũ của Kho giữ xanh (Quản lý có đủ).

## 8. Cấu trúc code

`src/features/staff/settings/`: `SettingsLayout.tsx` (cột trang con + `Outlet`) · `ProfilePage.tsx` · `HospitalPage.tsx` · `TeamPage.tsx` · `TeamDialog.tsx` · `ResetPasswordDialog.tsx` · `TeamActiveDialog.tsx` · `PermissionPicker.tsx` · `SystemPage.tsx` · `HolidaysEditor.tsx` · `settingsView.ts` (hàm thuần: nhóm quyền, quyền thừa hưởng theo vai, nhãn vai, tóm tắt "N quyền thêm", so sánh để biết đã đổi gì, dựng bản vá chỉ gồm trường đổi, sắp xếp ngày lễ) · `settingsForm.ts` (đọc và kiểm tra ô: số phút, số ngày, giờ `HH:MM`, ngày) · `Settings.module.css`. Có test cạnh tệp. Chỗ khác: `NAV`, `paths.nv.settings*`, bí danh, lộ trình lồng, xuất trang, `e2e/manifest.ts`; bỏ `PermsDialog` ở `StaffShell` và trỏ mục "Quyền của tôi" sang trang Hồ sơ; `src/features/staff/stock/*` đổi theo §7.

## 9. Chuyển động và trợ năng

Một lần, ngắn, theo `prefers-reduced-motion`. Mọi ô có nhãn và lỗi gắn `aria-describedby`; danh sách quyền là nhóm có tiêu đề và ô tích có nhãn đủ; nút hiện/ẩn mật khẩu có tên; điều khiển bằng bàn phím; tương phản ≥ 4,5:1; 320 px không cuộn ngang (cột trang con xếp lên trên, bảng thành thẻ, hộp thoại toàn màn hình).

## 10. Kiểm thử

Đơn vị (viết trước): `settingsView` (**mọi quyền trong `CAPS` có đúng một nhóm** để quyền mới không bị quên; quyền theo vai; "N quyền thêm"; bản vá chỉ gồm trường đổi; sắp ngày lễ), `settingsForm` (phút bội của 5, giờ hợp lệ, ngày thật, số ngày), `stockCaps` mở rộng.

E2E `e2e/giao-dien-nhan-vien-g.spec.ts` (ba cỡ màn hình): mục Cài đặt cho cả ba vai, trang Tài khoản chỉ cho Quản lý; Hồ sơ: sửa tên, đổi mật khẩu (từng lỗi đúng ô, thành công và đăng nhập lại bằng mật khẩu mới), chức danh chỉ xem; Thông tin bệnh viện đúng nguyên văn; Tài khoản: thêm nhân viên, sửa vai và quyền lẻ, đặt lại mật khẩu, tắt/bật, chính mình không có nút tắt, hai tab sửa cùng lúc báo xung đột; **hai bài đã hẹn:** Quản lý cấp `reports.operations` cho Bác sĩ thì Bác sĩ thấy Báo cáo nhưng **không có khối Doanh thu** và các dòng "Cần chú ý" về yêu cầu/kho chỉ là chữ khi thiếu quyền; Quản lý chỉ cấp `stock.receive` cho Spa thì Spa thấy **Nhập thêm** mà không thấy Xuất ra, Kiểm kê, Sửa, Thêm món (và Bác sĩ chỉ xem Kho); Cài đặt hệ thống: đổi và lưu, lỗi đúng ô, thêm/xóa ngày lễ, người không có `settings.manage` chỉ xem; axe, bàn phím, 320 px.

## 11. Việc chờ chủ dự án

Bảng mẫu "Cài đặt" (chỉnh bố cục khi có). Sau 5D sẽ bỏ câu "áp dụng ở bước kế tiếp".
