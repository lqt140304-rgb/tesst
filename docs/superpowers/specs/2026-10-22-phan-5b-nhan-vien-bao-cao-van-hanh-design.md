# Phần 5B: Khu nhân viên, Báo cáo vận hành

Ngày: 22/10/2026 · Nhánh `claude/giao-dien` · Chủ dự án đã duyệt hướng bằng lời (22/10/2026): **dùng skill taste và awesome-design khi thiết kế**, **không có thanh theo người phụ trách**, **kỳ mặc định 7 ngày**; tệp này chờ duyệt bản viết.

Thuộc phần 5 (`2026-10-21-phan-5-kho-bao-cao-cai-dat-design.md` §3.2, R40). **Dữ liệu đã có đủ** từ nhánh dữ liệu: `staff.reports.operations({ from, to })` (quyền `reports.operations`, mặc định chỉ Quản lý). Không đổi `src/data`.

## 1. Cách nhìn thiết kế (kết quả đọc hai skill)

**Design Read:** màn báo cáo cho Quản lý xem nhanh tình hình của tuần, giọng điềm tĩnh và đáng tin, mật độ vừa (taste-skill nói rõ nó dành cho trang giới thiệu, nên ở đây chỉ dùng kỷ luật bố cục và danh sách kiểm; không dùng phần hiệu ứng). Dial: `DESIGN_VARIANCE 4 · MOTION_INTENSITY 3 · VISUAL_DENSITY 6`.

**Tham chiếu awesome-design, tỉ lệ chủ dự án chốt 22/10/2026: hệ thống quản lý = Linear 85% + Stripe 15%** (website giới thiệu là Stripe 70% + Linear 30%, thuộc việc khác). Mượn **cấu trúc**, không mượn màu hay chữ của hai hãng.

*Linear (85%), nền tảng của mọi màn quản lý:*
- Chiều sâu bằng **nền phẳng + viền mảnh** (1 px), **không đổ bóng**; mặt phẳng nâng một bậc là bảng trắng trên nền `--canvas-staff`.
- **Một màu nhấn dùng rất tiết kiệm**: tím mận `--plum-700` cho cột biểu đồ, liên kết, vòng tiêu điểm. Xanh ngọc/hồng đậm chỉ giữ cho trạng thái thật (như Kho).
- Thân chữ 400, nhãn viết thường (không IN HOA giãn chữ); hàng danh sách ngăn bằng viền dưới mảnh, không đóng khung từng hàng; mật độ gọn, đọc nhanh.
- Bo góc theo bậc có sẵn của dự án (`--r-card` 12 px, `--r-control` 6 px); nút không bo tròn hết cỡ.

*Stripe (15%), chỉ ở chi tiết chữ số và nhãn:*
- **Con số lớn nhẹ nét, giãn chữ âm, chữ số đều bề ngang** (`tabular-nums`): trọng lượng 500 (tệp chữ 300 không có trong gói; không thêm), giãn chữ khoảng −0,02em. Đây là chữ ký "dữ liệu tài chính tinh tế" của Stripe.
- **Nhãn dạng viên thuốc nền tím nhạt** (`--plum-100`, chữ `--plum-700`) cho các nhãn nhỏ như tên kỳ ("7 ngày"), thay cho viền đậm.
- Vạch phân cách hơi lạnh và rất nhạt; **tuyệt đối không dùng gradient trong vùng dữ liệu** (chủ dự án dặn); gradient mềm chỉ dành cho website giới thiệu.

*Không mượn:* nền tối của Linear, mạng gradient của Stripe, hai phông riêng của họ (giữ Be Vietnam Pro và token của dự án; thương hiệu của chủ dự án thắng tham chiếu).

**Kỷ luật bố cục (taste-skill) áp vào đây:** không bốn thẻ giống hệt nhau xếp hàng; hàng đầu **bất đối xứng** (3fr / 2fr); thẻ chỉ dùng khi tách tầng thật, còn lại nhóm bằng viền và khoảng trống; không chấm màu trang trí; không thanh tiến độ có nền rãnh (thanh tỉ lệ chỉ là một vạch tím mảnh kèm con số); không dấu gạch dài `—` trong chữ hiển thị mới (giá trị không tính được ghi bằng chữ **"Chưa có"**); trạng thái rỗng, đang tải, lỗi đều có; màu nhấn và bo góc nhất quán cả trang; chữ trong nút nằm một dòng.

## 2. Phạm vi và quyền

- Mục **Báo cáo** ở thanh bên (biểu tượng `activity`), đặt trước **Doanh thu**; địa chỉ `#/nv/bao-cao`; bí danh `nv-bao-cao`; quyền `reports.operations`. Bác sĩ và Spa mặc định không thấy (vào thẳng địa chỉ thì thấy trang "Mục này dành cho người có quyền phù hợp").
- Khối **Doanh thu tóm tắt** chỉ hiện khi `report.revenue` có (người xem có thêm `reports.revenue`).
- Liên kết trong khối "Cần chú ý": sang **Yêu cầu** chỉ khi có `requests.handle`, sang **Kho** chỉ khi có `stock.view`; không có quyền thì chỉ là chữ, không phải liên kết.
- **Không làm:** thanh theo người phụ trách (chủ dự án bỏ), xuất tệp, in, bảng chi tiết từng dòng, biểu đồ tùy chọn, so sánh nhiều kỳ.

## 3. Màn hình `#/nv/bao-cao`

**Đầu trang:** "Báo cáo vận hành", dòng phụ "Công việc của Lê Sơn trong một kỳ, so với kỳ liền trước." Dưới là **bộ chọn kỳ** dùng lại của Doanh thu (Hôm nay · 7 ngày · Tháng này · Tháng trước · Chọn ngày, cùng kiểm tra khoảng ngày), **mặc định 7 ngày**; kỳ nằm trên địa chỉ (`?ky=…` hoặc `?tu=…&den=…`), địa chỉ hỏng rơi về 7 ngày. Bên cạnh có hai dòng nhỏ: "Kỳ này: 16/10 đến 22/10/2026" và "Kỳ trước: 09/10 đến 15/10/2026" (từ `report.from/to/previous`).

**Hàng 1 (3fr / 2fr):**
- *Trái, bảng "Trong kỳ":* bốn con số cùng một bảng, ngăn bằng viền dọc mảnh (không phải bốn thẻ): **Lịch đã hẹn**, **Yêu cầu nhận**, **Khách mới**, **Lượt nhập nội trú**. Mỗi số là chữ lớn kèm dòng so sánh bằng lời: "nhiều hơn kỳ trước 3" / "ít hơn kỳ trước 2" / "bằng kỳ trước" / "kỳ trước chưa có" (khi kỳ trước bằng 0 và kỳ này lớn hơn 0). Không dùng mũi tên hay màu để mang nghĩa.
- *Phải, "Cần chú ý lúc này"* (không phụ thuộc kỳ, ghi rõ): các dòng chỉ hiện khi khác 0: "N yêu cầu đang chờ xử lý" (`waitingNow`), "N món kho đã hết hàng", "N món sắp hết", "N món sắp hết hạn", "N món đã hết hạn". Mỗi dòng có mũi tên sang màn tương ứng nếu có quyền. Không có gì cần chú ý: một dòng "Hiện chưa có việc nào cần chú ý." kèm biểu tượng tích.

**Hàng 2, "Lịch hẹn"** (toàn chiều rộng, 2fr / 1fr): câu tóm tắt "Đã hẹn 42 lịch, đã hủy 6 (12,5%)" (tỉ lệ hủy `null` thì "Chưa có lịch nào trong kỳ"). Trái: **biểu đồ cột theo ngày** một màu tím, đặt trục ngày theo số ngày (kỳ dài hơn 120 ngày gộp theo tuần như Doanh thu), có **bảng thay thế**. Phải: hai danh sách tỉ lệ **theo dịch vụ** và **theo nguồn đặt**, mỗi dòng là tên, một vạch tím mảnh (không có nền rãnh) và con số; mỗi nhóm cộng đúng bằng số lịch đã hẹn.

**Hàng 3, "Yêu cầu đặt lịch"** (1fr / 1fr): trái ba con số: **đã nhận**, **tỉ lệ xác nhận** (`null` → "Chưa có"), **phản hồi đầu tiên trung bình** ("12 phút", `null` → "Chưa có"); phải danh sách **theo trạng thái** (sáu trạng thái chuẩn, số 0 mờ nhưng vẫn hiện để cộng đủ bằng số đã nhận).

**Hàng 4, "Nội trú"**: một dải bốn ô ngăn viền mảnh: **Đang nội trú**, **Nhập / xuất trong kỳ** ("5 nhập, 3 xuất"), **Ngày-chuồng** (kèm giải thích "Tổng số ngày các bé đã ở nội trú trong kỳ."), **Lấp đầy** (kèm "Phần chuồng có bé ở, tính theo cả kỳ."; `null` → "Chưa có").

**Hàng 5, "Doanh thu trong kỳ"** (nếu có quyền): **Đã thu**, **Đã xuất hóa đơn**, **Còn nợ lúc này**, so sánh "đã thu" với kỳ trước bằng lời, và nút chữ "Xem chi tiết doanh thu".

**Trạng thái:** đang tải = khung giữ chỗ cùng hình dạng; lỗi = `PageProblem` có thử lại; kỳ không có số liệu nào (mọi số kỳ bằng 0) = câu "Chưa có số liệu trong kỳ này. Thử chọn kỳ dài hơn." đặt cạnh các số (khối "Cần chú ý" vẫn hiện); đổi kỳ giữ số cũ đến khi số mới về, không nhảy bố cục.

## 4. Cấu trúc code

`src/features/staff/reports/`:
- `ReportsPage.tsx` (ghép), `TrongKy.tsx` (bảng bốn số), `AttentionList.tsx`, `AppointmentsSection.tsx`, `RequestsSection.tsx`, `InpatientSection.tsx`, `RevenueGlance.tsx`, `DayBars.tsx` (biểu đồ cột theo ngày + bảng thay thế), `RatioList.tsx` (danh sách tỉ lệ vạch mảnh + bảng thay thế), `Reports.module.css`.
- `reportsView.ts` (hàm thuần có test): `deltaText(now, before)`, `percentText(rate)` ("12,5%" hoặc "Chưa có"), `minutesText(min)`, `ratioRows(counts, labels)` (thứ tự cố định, cộng đúng tổng, tỉ lệ nguyên lớn nhất còn dư), `attentionItems(report, can)`, `isEmptyPeriod(report)`, `defaultPeriodParams` (mặc định 7 ngày).
- Dùng lại: `PeriodPicker`, `readRange/writePeriod/writeRange/previousPeriod/validateRange`, `bucketDaily/axisEvery/shares` của Doanh thu. Phần trạng thái kỳ trong `RevenuePage` (chọn kỳ, ngày nhập tay, lỗi) tách thành hook dùng chung `usePeriodRange(defaultPeriod)` ở `src/features/staff/revenue/usePeriodRange.ts`; Doanh thu giữ mặc định "Tháng này" và hành vi cũ (e2e 4D là lưới an toàn).
- Chỗ khác: `NAV`, `paths.nv.reports`, bí danh, lộ trình, xuất trang, `e2e/manifest.ts`.

## 5. Chuyển động và trợ năng

Chuyển động một lần, ngắn: cột biểu đồ mọc lên (`chartRise`), tôn trọng `prefers-reduced-motion`; không vòng lặp. Mọi biểu đồ có bảng thay thế và tên; mỗi con số có nhãn đọc được đủ ("Lịch đã hẹn: 42, nhiều hơn kỳ trước 3"); điều khiển bằng bàn phím; tương phản chữ ≥ 4,5:1; 320 px không cuộn ngang (hàng 1 xếp dọc, dải nội trú thành hai cột rồi một cột).

## 6. Kiểm thử

Đơn vị (viết trước): `reportsView` (so sánh đủ ba chiều và kỳ trước bằng 0; phần trăm có dấu phẩy và `null`; phút; `ratioRows` cộng đúng tổng kể cả tổng 0; `attentionItems` theo quyền và theo số 0; `isEmptyPeriod`).

E2E `e2e/giao-dien-nhan-vien-f.spec.ts` (ba cỡ màn hình): Quản lý thấy trang với kỳ mặc định 7 ngày và hai dòng ngày kỳ này/kỳ trước; đổi kỳ đổi địa chỉ, địa chỉ hỏng về 7 ngày, "Chọn ngày" báo lỗi đúng câu; **các nhóm cộng đúng**: theo dịch vụ = lịch đã hẹn, theo nguồn = lịch đã hẹn, theo trạng thái = yêu cầu đã nhận (đọc từ bảng thay thế); "Cần chú ý" khớp dữ liệu mẫu (kho: 1 hết hàng, 3 sắp hết, 1 sắp hết hạn, 1 đã hết hạn) và các liên kết đi đúng màn; khối doanh thu hiện cho Quản lý; Bác sĩ và Spa không thấy mục Báo cáo và bị chặn khi vào địa chỉ; bảng thay thế có đủ cột; bàn phím; `axe` không lỗi nghiêm trọng; 320 px không cuộn ngang. "Có quyền xem báo cáo nhưng không xem doanh thu" chưa thử được bằng giao diện (cần màn cấp quyền ở 5C): kiểm bằng test đơn vị `attentionItems`/`showRevenue` và bổ sung e2e ở 5C.

## 7. Việc chờ chủ dự án

Bảng mẫu "Báo cáo" (chỉnh bố cục khi có). Chọn lại kỳ mặc định cho từng người sẽ có ở 5D (Tùy chọn cá nhân).
