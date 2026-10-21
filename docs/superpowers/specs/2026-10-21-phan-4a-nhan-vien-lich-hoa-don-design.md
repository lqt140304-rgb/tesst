# Phần 4A — Khu nhân viên: nền chung, Lịch hẹn, Hóa đơn

Ngày: 21/10/2026 · Nhánh `claude/giao-dien` · Chủ dự án đã duyệt từng đoạn bằng lời (21/10/2026), tệp này chờ duyệt bản viết.

Nằm trong thiết kế lớn `2026-10-20-lam-lai-giao-dien-design.md` §4 mục 4. Phần 4 tách 4 đợt: **4A (tệp này)** · 4B Khách hàng · 4C Nội trú đầy đủ · 4D Bảng giá và Doanh thu. Chủ dự án chọn (21/10): làm 4A theo bảng mẫu `04-nv-lich-hen-hoa-don.webp`; 4B–4D dựng cùng phong cách vì chưa có bảng mẫu, sẽ chỉnh khi có.

## 1. Mục tiêu

Khu nhân viên có giao diện cùng họ với khu khách đã làm (thẻ trắng bo góc, đường dẫn, tiêu đề chữ UI đậm, icon Duotone, khung chi tiết bên cạnh danh sách), và hai màn lớn của bảng mẫu 04: **Lịch hẹn dạng lưới giờ có khung chi tiết bên phải** và **Hóa đơn soạn bên trái, xem trước bên phải**. Chức năng hiện có giữ nguyên (đổi/hủy lịch có lý do và kiểm tra phiên bản, hóa đơn chỉ lấy dòng từ bảng giá, thanh toán tại quầy, in hóa đơn).

Không đổi hợp đồng dữ liệu. Không thêm thư viện.

## 2. Giữ nguyên / không làm

- Thanh bên tím mận, hiện mục theo quyền, người đăng nhập và đăng xuất ở cuối; điện thoại giữ thanh dưới 4 mục + "Thêm".
- Màu, chữ (Lora chỉ cho tiêu đề công khai/khu khách; khu nhân viên tiêu đề Be Vietnam Pro 600 theo quy chuẩn 21/10), hero.
- Lịch hẹn chỉ có Đã hẹn / Đã hủy (+ Đã qua), không check-in (R8). **Không làm** "Chờ xác nhận" và nút "Xác nhận" trên lịch hẹn như ảnh mẫu (§3.3 thiết kế lớn); xác nhận nằm ở trang Yêu cầu đặt lịch.
- Không kéo thả (đổi giờ lịch bằng kéo; đổi thứ tự dòng hóa đơn): chưa cần, dễ gây lỗi; đổi giờ đi qua form có lý do.
- Màn Yêu cầu đặt lịch, Tổng quan, Tài khoản web: chỉ nhận nền chung (đường dẫn, thẻ, icon), không đổi bố cục. Hàng chờ "Khách xin đổi lịch" giữ chỗ cũ.

## 3. Nền chung khu nhân viên

- Nền trang `--canvas-staff`; khối nội dung là thẻ `SectionCard` / `Panel` (trắng, `--r-card`, viền `--line-soft`). `Panel` của khu nhân viên dùng lại `SectionCard` để hai khu cùng một kiểu.
- Mỗi trang có `crumbs` ("Lịch hẹn", "Hóa đơn" …; trang con "Hóa đơn › HD-1028"). Nút "‹ Hóa đơn" nhỏ hiện nay (`eyebrow`) thay bằng đường dẫn.
- Tiêu đề trang: Be Vietnam Pro 600 (đã có theo quy chuẩn chữ và số).
- Icon: dùng bộ Duotone đã có (`Icon`); không thêm icon mới ngoài bảng sinh sẵn trừ khi thật cần (`npm run icons`).
- Bảng: `DataTable` của bộ UI (phân trang, hàng chọn được, thẻ trên điện thoại).
- Phản hồi lưu: `SaveState` (đang lưu / đã lưu / chưa lưu / lỗi).

### 3a. Bổ sung sau báo cáo review ngoài (`docs/tham-khao/bao-cao-review-2026-10-21.md`, chủ dự án duyệt 21/10/2026)

- **Bỏ dấu chân** trang trí trên thanh bên nhân viên (nền tím mận phẳng).
- **Bo góc điều khiển:** nút và ô nhập (Input/Select/Textarea/ô tìm) bo 6 px (`--r-control`), thay cho nút viên thuốc và 10–12 px; thẻ nội dung giữ `--r-card`; nhãn trạng thái, tab, nhóm chọn vẫn dạng viên. Áp cho cả ba khu (công khai, khách, nhân viên); hero không đổi (không dùng nút chung).
- **Điện thoại:** trang đặt lịch đưa form lên sớm (ba bước thu thành mục mở/đóng, mặc định đóng); nhãn "Bản demo · dữ liệu mẫu" thu thành nút biểu tượng nhỏ có nhãn đọc màn hình, không che nội dung.
- **Lịch trùng (chủ dự án chọn: chặn):** cùng người phụ trách không được có hai lịch giao giờ (bỏ qua lịch đã hủy; chạm nhau như 09:30 không tính trùng). Quy tắc này nằm ở nhánh dữ liệu (`staff.appointments.create`, `reschedule`, xác nhận yêu cầu) — ghi trong "Yêu cầu gửi nhánh kia" của `PROGRESS.md`. Giao diện hiện lỗi của API tại ô giờ, và lưới vẫn hiện lịch giao giờ cạnh nhau (dữ liệu cũ có thể đã trùng).
- **Video nội trú giữ 15 giây** (đúng quyết định đã ghi, quyết định 20/10); báo cáo ghi 20 giây là nhầm, chủ dự án chọn giữ.
- Số doanh thu hiện ngay, chỉ biểu đồ chuyển động: không chọn (giữ như hiện nay).

## 4. Lịch hẹn

Đường dẫn: `#/nv/lich-hen` (giữ `?view=ngay|tuan`, `?date=`, `?lich=<id>`).

**Đầu trang.** Đường dẫn "Lịch hẹn", tiêu đề "Lịch hẹn", mô tả ngắn, nút "Tạo lịch hẹn" (khi `can('appointments.manage')`).

**Hàng điều khiển.** "Hôm nay" · lùi/tiến (ngày hoặc tuần) · nhãn ngày/tuần (`aria-live`) · công tắc **Ngày | Tuần** · ô tìm "Tìm theo tên khách, thú cưng…" · lọc người phụ trách · "Hiện lịch đã hủy".

**Tìm nhanh (mới).** Không đổi dữ liệu tải; lọc phía giao diện, không dấu, không phân biệt hoa thường, theo tên khách, tên bé, số điện thoại. Lịch không khớp **mờ đi** trong lưới (vẫn thấy vị trí) và danh sách điện thoại **ẩn** lịch không khớp. Có kết quả thì thông báo "N lịch khớp" (vùng `status`).

**Lưới tuần (mới).** 7 cột ngày (T2–CN, kèm ngày/tháng), trục giờ 07:00–21:00 mỗi 30 phút (như lưới ngày hiện có, dùng chung hằng `START_H`, `END_H`, `ROW`), khối lịch đặt đúng giờ và độ dài, chồng giờ thì chia cột trong ô ngày. Khối: giờ, tên bé, dịch vụ · họ khách; màu theo dịch vụ (Khám/Spa/Nội trú, đã duyệt); Đã qua nhạt; Đã hủy gạch + sọc; có "Đang chờ đổi lịch" thì thêm chấm. Hôm nay có nền nhạt và viền trên đậm; vạch "bây giờ" khi tuần có hôm nay. Bấm tiêu đề cột → xem ngày đó. Cuộn dọc trong khung (cao tối đa ~70vh), tiêu đề cột dính.

**Lưới ngày.** Giữ cột theo người phụ trách; chỉ đổi kiểu (thẻ, viền, khối) cho cùng họ với lưới tuần.

**Khung chi tiết (thay hộp thoại).** Dùng `MasterDetail` (cạnh danh sách từ 1024 px). Ở màn rộng, lưới chiếm cột trái, khung chi tiết cột phải (~360 px), mở khi bấm một lịch (`?lich=`), đóng bằng nút ✕ và Esc; không tự mở lịch đầu tiên (khác khu khách, vì lưới không phải danh sách). Từ 899 px xuống: danh sách (agenda) như hiện nay; chi tiết là trang riêng có nút quay lại, địa chỉ có `?lich=` nên nút Back của máy quay về danh sách.

Nội dung khung (3 chế độ trong cùng khung: xem · đổi lịch · hủy lịch; logic đổi/hủy giữ nguyên từ `AppointmentDialog`):
- Đầu: ảnh bé (`PetAvatar` 96), tên bé, "loài · giống · giới · tuổi" (tuổi từ `birth_year`), chủ nuôi (liên kết hồ sơ khi `can('customers.view')`), số điện thoại (`Tel`).
- Chỉ lấy hồ sơ bé (`staff.customers.get`) khi `can('customers.view')`; không có quyền thì chỉ hiện loài.
- Khối thông tin: Thời gian (ngày, giờ–giờ, số phút), Dịch vụ, Người phụ trách, Nguồn (qua yêu cầu web / điện thoại / tại quầy), Mã lịch, Ghi chú nội bộ (có nhãn "khách không thấy"), cảnh báo an toàn của bé, Trạng thái (Đã hẹn / Đã hủy, thêm Đã qua).
- Nút: **Đổi lịch** (`appointments.manage`), **Hủy lịch** (`appointments.manage`), **Tạo hóa đơn** (`invoices.create`, ngày hẹn là hôm nay hoặc trước đó). Lịch đã hủy: chỉ thông tin.
- Đang chờ đổi lịch: khối "Khách xin đổi lịch" nêu ngày mong muốn, khung giờ, lý do; nút "Dời lịch" (mở chế độ đổi, điền sẵn ngày mong muốn) và "Không đổi" (`staff.requests.keepAppointment`, có chặn bấm kép và báo lỗi). Mở khung bằng `?lich=` từ hàng chờ vẫn chạy.
- Xung đột phiên bản: `ConflictError` báo tại chỗ và tải lại, như hiện nay.

**Điện thoại.** Giữ danh sách (agenda) và dải 7 ngày; thêm chấm khi ngày có lịch chờ đổi.

## 5. Hóa đơn

### 5.1 Danh sách `#/nv/hoa-don`
Giữ dải tóm tắt, ô tìm, nút lọc trạng thái. Bảng chuyển sang `DataTable` (cột: Số HĐ, Ngày, Khách hàng, Thú cưng, Tổng tiền, Đã thu, Còn lại, Trạng thái), phân trang 10, hàng bấm mở hóa đơn; "Còn lại" > 0 dùng màu nhấn. Số tiền và mã dùng `.num`. Điện thoại: thẻ như hiện nay. Đường dẫn "Hóa đơn".

### 5.2 Lập hóa đơn — bước chọn `#/nv/hoa-don/moi`
Thẻ "Thông tin khách hàng": tìm khách (tên, số điện thoại, tên bé), chọn khách, tích bé; khi đã chọn khách hiện tên, mã, số điện thoại và nút **Chọn lại** (khi đến từ lịch hẹn hoặc hồ sơ có `?khach=` thì không có nút này). "Tạo hóa đơn nháp" rồi chuyển sang màn soạn (logic `createDraft` giữ nguyên).

### 5.3 Soạn bản nháp `#/nv/hoa-don/:id` (trạng thái `draft`)
Hai cột từ 1100 px (soạn ~60%, xem trước ~40%, cột phải dính khi cuộn); dưới 1100 px một cột, xem trước nằm cuối trong khối thu gọn "Xem trước hóa đơn".

Đầu trang: đường dẫn "Hóa đơn › Lập hóa đơn", tiêu đề "Lập hóa đơn", nhãn `SaveState`: "Bản nháp · Chưa lưu thay đổi" khi có sửa chưa lưu; "Bản nháp · Đã lưu" **chỉ sau khi lưu thành công**; lỗi giữ dữ liệu nhập.

Cột soạn:
1. **Thông tin khách hàng**: thẻ khách (tên, mã, `Tel`) và thẻ bé (ảnh, tên, loài · giống) cho mỗi bé trên hóa đơn.
2. **Dịch vụ**: bảng dòng — Tên dịch vụ (kèm đơn vị), Đơn giá, SL (nút − / +), Thành tiền, nút xóa (có nhãn). Mục giá linh hoạt: ô nhập đơn giá (điền sẵn `reference_price` nếu có, theo yêu cầu của nhánh dữ liệu). Nút **Thêm dịch vụ** mở khung chọn (hộp thoại; trên màn rộng là bảng nổi): ô tìm trong bảng giá, nút lọc nhóm, danh sách mục **đang bật** (`active`), bấm một mục là thêm (thêm lại mục giá cố định thì tăng SL), khung có thể giữ mở để thêm nhiều mục. Dòng vẫn chỉ lấy từ bảng giá; mục đã tắt không hiện. Cảnh báo liều thuốc ở ghi chú giữ nguyên (`useDoseLint`).
3. **Ghi chú trên hóa đơn** (tùy chọn): khách sẽ thấy.
4. **Tổng cộng** (tạm tính, tổng) và hai nút **Lưu bản nháp** · **Phát hành hóa đơn** (khóa khi chưa có dòng; hỏi xác nhận như hiện nay).

Cột xem trước: thẻ **"Xem trước hóa đơn"** dùng đúng `InvoiceSheet` của khách (dòng thuốc và vật tư điều trị gộp thành "Thuốc và vật tư điều trị" qua `customerLines`; "Thanh toán tại quầy"; lời cảm ơn gọi "bạn"). Số hóa đơn hiện mã nháp kèm "(Dự kiến)"; ngày là ngày lập. Cập nhật theo từng thao tác (cùng tính toán `invoiceTotals`), không gọi máy chủ riêng. Có nhãn "Nội dung mẫu" như tờ hóa đơn hiện có (watermark).

Xung đột phiên bản (`ConflictError`): giữ hành vi cũ — hiện bản đã lưu của tab kia thay cho phần đang sửa và báo.

### 5.4 Hóa đơn đã phát hành `#/nv/hoa-don/:id`
Cùng bố cục hai cột: trái là dòng, tổng, giảm giá, đã thu, còn lại, các lần thanh toán, nút **Ghi nhận thanh toán** (`payments.record`); phải là bản hóa đơn khách thấy, **luôn hiện** (thay nút "Xem như khách"). Nút "In hóa đơn" giữ. Đầu trang: đường dẫn, mã, nhãn trạng thái thanh toán, khách (liên kết hồ sơ khi có quyền), bé.

## 6. Cấu trúc code

Tệp mới (trong `src/features/staff/`):
- `appointments/WeekGrid.tsx`, `DayGrid.tsx` — tách lưới khỏi `CalendarPage.tsx` (đang 229 dòng), dùng chung `gridMath.ts` (`layoutDay`, `layoutWeek`, `minutesOf`, hằng giờ) có test đơn vị.
- `appointments/AppointmentPanel.tsx` — khung chi tiết 3 chế độ; `AppointmentDialog.tsx` bị thay (xóa sau khi chuyển hết logic).
- `appointments/search.ts` (+ test) — khớp không dấu.
- `invoices/InvoiceLinesTable.tsx`, `invoices/AddServiceDialog.tsx`, `invoices/InvoicePreview.tsx` (ghép dữ liệu nháp → `InvoiceSheetData`, có test đơn vị `draftToSheet`).
- `ui.tsx`: `Panel` dựng trên `SectionCard`.

Sửa: `CalendarPage.tsx`, `InvoicesPage.tsx`, `InvoiceNewPage.tsx`, `InvoicePage.tsx`, `DraftEditor.tsx`, `StaffShell` (chỉ chỗ cần cho đường dẫn/nền), các `*.module.css` liên quan, `e2e` (spec mới `giao-dien-nhan-vien-a.spec.ts`; spec cũ chỉnh nhỏ và ghi lại).

## 7. Chuyển động và trợ năng

- Khung chi tiết vào bằng `preset('enterPanel')`; khối lưới không động; danh sách lịch/dòng hóa đơn vào bằng `enterList` một lần. Dòng hóa đơn thêm/xóa giữ hiệu ứng ngắn hiện có. `prefers-reduced-motion` tắt dịch chuyển.
- Mọi điều khiển dùng được bằng bàn phím: khối lịch là nút có nhãn "giờ · bé · khách (· đã hủy)"; mở khung chi tiết chuyển tiêu điểm vào tiêu đề khung, đóng trả về khối đã mở; Esc đóng.
- Tương phản chữ ≥ 4,5:1 (kể cả khối màu dịch vụ và chữ trên nền sọc); điện thoại 320 px không cuộn ngang (lưới tuần không dùng trên điện thoại).
- Nhãn "Đã lưu" chỉ sau lưu thành công; lỗi không rung.

## 8. Kiểm thử

Đơn vị: `gridMath` (khối đúng ngày/giờ/độ dài, chồng giờ), `search` (không dấu, số điện thoại), `draftToSheet` (gộp nhóm điều trị, tổng khớp `invoiceTotals`, mã "Dự kiến").

e2e (viết trước, xem thất bại, rồi làm; chạy ở 1440, 390, và 320 cho phần @narrow):
- Lưới tuần: 7 cột; khối lịch seed nằm đúng cột ngày; bấm khối mở khung bên phải với ảnh bé, giờ, dịch vụ, nút đúng quyền; Esc đóng và tiêu điểm trả về.
- Đổi lịch và hủy lịch ngay trong khung vẫn cần lý do; sau đổi, khối chuyển ô; xung đột phiên bản báo tại chỗ.
- Tìm nhanh: gõ tên bé làm mờ phần còn lại, thông báo số lịch khớp; không khớp thì báo.
- Lịch chờ đổi: có dấu; khung hiện mong muốn của khách; "Không đổi" đóng yêu cầu.
- Hóa đơn nháp: thêm dịch vụ từ khung chọn, đổi SL, xóa dòng → xem trước và tổng khớp từng bước; mục giá linh hoạt cần giá; thuốc và vật tư điều trị gộp trong xem trước; nhãn "Chưa lưu thay đổi" → "Đã lưu" chỉ sau lưu; lỗi lưu giữ dữ liệu; Phát hành vẫn hỏi xác nhận.
- Hóa đơn đã phát hành: xem trước luôn hiện; Ghi nhận thanh toán; In hóa đơn.
- Danh sách hóa đơn: phân trang, lọc, tìm; "Còn lại" màu nhấn.
- Quyền: Spa/Bác sĩ không thấy nút ngoài quyền; không có `customers.view` thì khung không hiện tuổi/giống và không có liên kết hồ sơ.
- Điện thoại (@narrow, 320): Lịch hẹn, chi tiết lịch (Back của máy về danh sách), Hóa đơn (danh sách, soạn, xem trước thu gọn) không cuộn ngang; không "Hoàn thành", không "quý khách".
- Trang trong `e2e/manifest.ts` vẫn qua kiểm tra chữ/số và trợ năng chung.

Cuối cùng: `npm run verify` xanh, rồi `npm run build:single` để chủ dự án xem.

## 9. Việc chờ chủ dự án

- 3 bảng mẫu còn lại (khách hàng và hồ sơ khách; quản lý nội trú và cập nhật cho chủ nuôi; bảng giá và doanh thu) — cho 4B–4D.
- Giờ thật của các khung giờ đặt lịch (đang tạm).
