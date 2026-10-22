# Phần 5B: Báo cáo vận hành, kế hoạch thực hiện

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm màn **Báo cáo vận hành** cho Quản lý: bộ chọn kỳ (mặc định 7 ngày), bảng bốn số so với kỳ trước, danh sách "Cần chú ý lúc này", các khối Lịch hẹn, Yêu cầu đặt lịch, Nội trú và Doanh thu tóm tắt.

**Architecture:** Chỉ lớp giao diện trong `src/features/staff/reports/`; dữ liệu qua `staff.reports.operations(range)` (hợp đồng đã có, **không đổi**). Mọi quyết định hiển thị (so sánh, phần trăm, danh sách cần chú ý) nằm trong một tệp hàm thuần có test (`reportsView.ts`). Phần chọn kỳ của Doanh thu được tách thành hook dùng chung `usePeriodRange` để hai màn dùng cùng một cách.

**Tech Stack:** React 19, TypeScript, react-router (hash, `useSearchParams`), motion (`m`), CSS Modules + tokens, Vitest, Playwright. Không thêm thư viện.

**Spec:** `docs/superpowers/specs/2026-10-22-phan-5b-nhan-vien-bao-cao-van-hanh-design.md`.

## Global Constraints

- Mọi chữ hiển thị bằng tiếng Việt; không "quý khách", không "lễ tân"; số, ngày, phần trăm dùng class `.num`; số lẻ dùng dấu phẩy.
- **Không dùng dấu gạch dài `—` trong chữ hiển thị mới**; giá trị không tính được hiện bằng chữ **"Chưa có"**, không bao giờ `NaN`, `0%` giả hay `undefined`.
- Hướng thiết kế R43: hệ thống quản lý = Linear 85% + Stripe 15%: nền phẳng, viền mảnh 1 px, **không đổ bóng, không gradient trong vùng dữ liệu**, một màu nhấn (`--plum-700`), nhãn viết thường; con số lớn trọng lượng **500**, giãn chữ −0,02em, `tabular-nums`; nhãn nhỏ dạng viên nền `--plum-100`.
- Bo góc `--r-card` 12 px, `--r-control` 6 px; màu chỉ qua token; không thanh tiến độ có nền rãnh (vạch tỉ lệ chỉ là một vạch mảnh); không chấm màu trang trí; không bốn thẻ giống hệt nhau.
- Quyền: mục Báo cáo và trang cần `reports.operations`; khối Doanh thu chỉ khi `report.revenue` có; liên kết sang Yêu cầu cần `requests.handle`, sang Kho cần `stock.view` (không có quyền thì chỉ là chữ).
- Khoảng ngày kiểm bằng `validateRange` + `RANGE_MSG` (`@/data/rules/calendar`); khoảng sai không bao giờ tới API; số đang hiện giữ nguyên.
- Chuyển động một lần, 150 đến 450 ms, `prefers-reduced-motion` tắt; điều khiển bằng bàn phím; tương phản chữ ≥ 4,5:1; 320 px không cuộn ngang.
- Không đổi `src/data/**`. Cần đổi hợp đồng thì dừng, ghi `PROGRESS.md` "Yêu cầu gửi nhánh kia".
- Hành vi Doanh thu giữ nguyên (mặc định "Tháng này"); `e2e/giao-dien-nhan-vien-d.spec.ts` phải vẫn xanh.
- Commit tiêu đề tiếng Anh `feat:`/`test:`/`docs:`, không ghi tên model. Viết test trước.

## Review Focus

1. Địa chỉ hỏng hoặc lạ (`?ky=abc`, `?tu=2026-02-30&den=2026-03-01`, thiếu một đầu): rơi về 7 ngày, không lỗi; "Chọn ngày" sai báo đúng câu `RANGE_MSG` và không gọi API (Task 2, 3).
2. Tỉ lệ có mẫu số 0 (không có lịch, không có yêu cầu, chưa chuồng nào chạy): hiện "Chưa có", không `NaN`/`0%`/`Infinity` (Task 1, 5, 6).
3. Kỳ không có số liệu nào: câu "Chưa có số liệu trong kỳ này…", không biểu đồ rỗng vỡ, khối "Cần chú ý" vẫn hiện (Task 6).
4. Đổi kỳ liên tiếp nhanh: số cũ giữ đến khi số mới về, dòng "Kỳ này/Kỳ trước" luôn khớp với số đang hiện (lấy từ báo cáo, không từ địa chỉ) (Task 3).
5. Người có `reports.operations` nhưng không có `reports.revenue`, hoặc không có `requests.handle`/`stock.view`: không khối doanh thu, các dòng chỉ là chữ (Task 1 qua `attentionItems`, `showRevenue`).
6. Kỳ dài 366 ngày: biểu đồ gộp theo tuần, 320 px vẫn vừa (Task 5).

---

## File structure

`src/features/staff/reports/`: `reportsView.ts` · `reportsView.test.ts` · `ReportsPage.tsx` · `TrongKy.tsx` · `AttentionList.tsx` · `AppointmentsSection.tsx` · `RequestsSection.tsx` · `InpatientSection.tsx` · `RevenueGlance.tsx` · `DayBars.tsx` · `RatioList.tsx` · `Reports.module.css`.
`src/features/staff/revenue/`: `usePeriodRange.ts` (mới, tách từ `RevenuePage.tsx`) · `revenueView.ts` (`readRange` thêm tham số mặc định) · `revenueView.test.ts`.
Sửa: `StaffShell.tsx` (NAV), `src/app/routes.ts`, `src/app/router.tsx`, `src/features/staff/index.tsx`, `e2e/manifest.ts`. Test: `e2e/giao-dien-nhan-vien-f.spec.ts` (mới).

---

### Task 1: `reportsView.ts`, các quyết định hiển thị

**Files:**
- Create: `src/features/staff/reports/reportsView.ts`
- Test: `src/features/staff/reports/reportsView.test.ts`

**Interfaces:**
- Consumes: `OperationsReport, OpsAppointments, OpsInpatient` (`@/data/staff`); `Cap` (`@/data/rules/capabilities`); `shares` (`../revenue/revenueView`); `formatQty` (`@/lib/units`); `writeFilters, DEFAULT_FILTERS` (`../stock/stockView`); `paths` (`@/app/routes`).
- Produces:
  - `deltaText(now: number, before: number, fmt?: (n: number) => string): string`: `before === 0 && now > 0` → "kỳ trước chưa có"; bằng nhau (kể cả 0 và 0) → "bằng kỳ trước"; lớn hơn → "nhiều hơn kỳ trước {chênh}"; nhỏ hơn → "ít hơn kỳ trước {chênh}"; `fmt` mặc định `toLocaleString('vi-VN')`.
  - `percentText(rate: number | null): string`: `null` → "Chưa có"; `0.125` → "12,5%"; `0.5` → "50%"; `0` → "0%"; một chữ số thập phân, bỏ ",0".
  - `minutesText(min: number | null): string`: `null` → "Chưa có"; `12` → "12 phút"; `60` → "1 giờ"; `75` → "1 giờ 15 phút".
  - `type RatioRow<K extends string> = { key: K; label: string; count: number; share: number; fill: number }`; `ratioRows<K extends string>(counts: Record<K, number>, order: readonly K[], labels: Record<K, string>): RatioRow<K>[]`: giữ đúng thứ tự `order`; `share` là phần trăm nguyên cộng đúng 100 (dùng `shares`; toàn 0 khi tổng 0); `fill` = `count / max(count)` (0 khi max bằng 0).
  - `type Headline = { key: 'scheduled' | 'received' | 'newCustomers' | 'admitted'; label: string; value: number; delta: string }`; `headlines(r: OperationsReport): Headline[]` đúng thứ tự: "Lịch đã hẹn", "Yêu cầu nhận", "Khách mới", "Lượt nhập nội trú", mỗi cái kèm `deltaText` với giá trị `previous*` tương ứng.
  - `type Attention = { key: string; text: string; to?: string }`; `attentionItems(r: OperationsReport, can: (c: Cap | Cap[]) => boolean): Attention[]`: thứ tự và chữ: `requests` "{n} yêu cầu đang chờ xử lý" (`requests.waitingNow`, liên kết `paths.nv.requests` nếu `can('requests.handle')`), `out` "{n} món kho đã hết hàng", `low` "{n} món kho sắp hết", `soon` "{n} món sắp hết hạn", `expired` "{n} món đã hết hạn"; mỗi dòng kho liên kết `paths.nv.stock` kèm `?` + `writeFilters` với `status` `out`/`low`/`expiring` (hai dòng hạn dùng cùng `expiring`) nếu `can('stock.view')`; **bỏ dòng có số 0**.
  - `isEmptyPeriod(r: OperationsReport): boolean`: đúng khi lịch (`appointments.total`), yêu cầu nhận, lượt nhập, lượt xuất nội trú và khách mới đều bằng 0.
  - `showRevenue(r: OperationsReport): r is OperationsReport & { revenue: OpsRevenue }`.
  - `appointmentSummary(a: OpsAppointments): string`: `total === 0` → "Chưa có lịch nào trong kỳ."; ngược lại "Đã hẹn {scheduled} lịch, đã hủy {cancelled} ({percentText(cancelRate)})."
  - `inpatientCells(i: OpsInpatient): { key: 'current' | 'moves' | 'bedDays' | 'occupancy'; label: string; value: string; note?: string }[]`: "Đang nội trú" (số), "Nhập / xuất trong kỳ" ("5 nhập, 3 xuất"), "Ngày-chuồng" (`formatQty(bedDays)` + " ngày", `note` "Tổng số ngày các bé đã ở nội trú trong kỳ."), "Lấp đầy" (`percentText(occupancyRate)`, `note` "Phần chuồng có bé ở, tính theo cả kỳ.").

- [ ] **Step 1: Viết test (đỏ)**: mỗi hàm một `describe`. `deltaText(5, 2)` = "nhiều hơn kỳ trước 3"; `(2, 5)` = "ít hơn kỳ trước 3"; `(4, 4)` và `(0, 0)` = "bằng kỳ trước"; `(3, 0)` = "kỳ trước chưa có"; `deltaText(1500000, 1000000, fmtVnd)` dùng `fmt`. `percentText(null)` = "Chưa có", `(0.125)` = "12,5%", `(0.5)` = "50%", `(0)` = "0%", `(1)` = "100%". `minutesText(null)` / `(12)` / `(60)` / `(75)`. `ratioRows({a:1,b:1,c:1}, ['a','b','c'], …)` cộng `share` đúng 100 (34+33+33) và giữ thứ tự; tổng 0 → mọi `share` và `fill` bằng 0 và không `NaN`; `fill` của hàng lớn nhất bằng 1. `headlines` trên một báo cáo mẫu dựng tay (đủ trường) trả đúng bốn dòng, đúng thứ tự, đúng `delta`. `attentionItems` với `can` luôn đúng: có `to` đúng (`/nv/yeu-cau`, `/nv/kho?tt=het`, `?tt=sap-het`, `?tt=han`), bỏ dòng 0; với `can` luôn sai: vẫn đủ chữ nhưng không có `to`; chỉ có `stock.view`: yêu cầu không `to`, kho có `to`. `isEmptyPeriod` đúng cho báo cáo toàn 0 và sai khi chỉ `newCustomers: 1`. `showRevenue` đúng/sai theo `revenue`. `appointmentSummary` hai ca (`total` 0; 42 hẹn, 6 hủy, 0.125 → "Đã hẹn 42 lịch, đã hủy 6 (12,5%)."). `inpatientCells` cho `occupancyRate: null` → "Chưa có", `bedDays: 12.5` → "12,5 ngày".
- [ ] **Step 2: Chạy, thấy đỏ**: `npx vitest run src/features/staff/reports/reportsView.test.ts`. Expected: FAIL (module chưa có).
- [ ] **Step 3: Cài `reportsView.ts`** theo Interfaces; `percentText` làm tròn một chữ số thập phân rồi bỏ ",0".
- [ ] **Step 4: Chạy, thấy xanh**: cùng lệnh; `npm run typecheck && npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit**: `git add src/features/staff/reports && git commit -m "feat: operations report view helpers"`.

---

### Task 2: tách `usePeriodRange` và cho `readRange` mặc định tùy chọn

**Files:**
- Create: `src/features/staff/revenue/usePeriodRange.ts`
- Modify: `src/features/staff/revenue/revenueView.ts` (`readRange`), `src/features/staff/revenue/RevenuePage.tsx` (dùng hook), `src/features/staff/revenue/revenueView.test.ts`

**Interfaces:**
- Consumes: `readRange, writePeriod, writeRange, Period` (`./revenueView`); `validateRange` (`@/data/rules/calendar`); `system` (`@/data/public`); `PeriodPicker` (`./PeriodPicker`).
- Produces:
  - `readRange(search: string, today: string, fallback: Exclude<Period, 'custom'> = 'month'): { period: Period; from: string; to: string }`: địa chỉ thiếu hoặc hỏng rơi về `fallback` (không đổi hành vi cũ khi không truyền).
  - `usePeriodRange(fallback: Exclude<Period, 'custom'>): { range: { from: string; to: string }; picker: ComponentProps<typeof PeriodPicker> }`: gom toàn bộ trạng thái kỳ hiện nằm trong `RevenuePage` (địa chỉ, "Chọn ngày" ở lại đúng địa chỉ đã chọn, ô ngày gõ tay theo địa chỉ, lỗi, `pick`, `apply` kiểm bằng `validateRange`). `picker` đưa thẳng vào `<PeriodPicker {...picker} />`.

- [ ] **Step 1: Viết test (đỏ)** trong `revenueView.test.ts`: `readRange('', '2026-10-22', '7d')` = `{ period: '7d', from: '2026-10-16', to: '2026-10-22' }`; `readRange('?ky=abc', today, '7d')` cũng vậy; `readRange('?tu=2026-02-30&den=2026-03-01', today, '7d')` rơi về `7d`; không truyền tham số thứ ba vẫn về "Tháng này" như cũ.
- [ ] **Step 2: Chạy, thấy đỏ**: `npx vitest run src/features/staff/revenue/revenueView.test.ts`. Expected: FAIL ở ba ca có tham số `fallback`.
- [ ] **Step 3: Cài**: thêm tham số `fallback` cho `readRange`; viết `usePeriodRange.ts` bằng cách **chuyển nguyên** logic kỳ khỏi `RevenuePage` (không đổi hành vi); `RevenuePage` gọi `usePeriodRange('month')` và dùng `range`, `picker`.
- [ ] **Step 4: Chạy, thấy xanh và không hồi quy**: `npx vitest run src/features/staff/revenue`; `npm run typecheck && npm run lint`; `npm run build && npx playwright test e2e/giao-dien-nhan-vien-d.spec.ts -g "revenue|Doanh thu|range|period" --project=desktop-1440`. Expected: PASS (toàn bộ test Doanh thu của 4D vẫn xanh).
- [ ] **Step 5: Commit**: `refactor: share the period picker state between revenue and reports`.

---

### Task 3: mục Báo cáo, trang khung, kỳ và hai dòng ngày

**Files:**
- Create: `ReportsPage.tsx`, `Reports.module.css`
- Modify: `StaffShell.tsx` NAV (`{ key: 'reports', to: paths.nv.reports, label: 'Báo cáo', icon: 'activity', cap: 'reports.operations' }` đặt ngay trước `revenue`); `src/app/routes.ts` (`nv.reports: '/nv/bao-cao'`, bí danh `'nv-bao-cao'`); `src/app/router.tsx` (route `bao-cao` → `StaffReports`, `cap: 'reports.operations'`, `pageKey: 'nv.reports'`, title "Báo cáo vận hành"); `src/features/staff/index.tsx`; `e2e/manifest.ts` (`{ zone: 'staff', slug: 'bao-cao', route: '/nv/bao-cao', as: 'quanly_ha' }`)
- Test: `e2e/giao-dien-nhan-vien-f.spec.ts` (mới)

**Interfaces:**
- Consumes: `usePeriodRange('7d')`, `PeriodPicker` (Task 2); `staff.reports.operations`; `PageHeader, LoadingBlocks, PageProblem` (`../ui`); `formatDateVi`.
- Produces: `ReportsPage()`; vùng nội dung chưa có khối nào ngoài đầu trang (các task sau thêm khối); dòng kỳ có `data-period="current"` và `data-period="previous"`.

- [ ] **Step 1: Viết e2e (đỏ)** (`desktop-1440`, `phone-390`, `phone-320`): `describe('operations report page')`:
  - *Quản lý vào trang*: `/nv/bao-cao` as `quanly_ha` → tiêu đề "Báo cáo vận hành", dòng phụ "Công việc của Lê Sơn trong một kỳ, so với kỳ liền trước."; chip "7 ngày" được chọn; `[data-period="current"]` bắt đầu "Kỳ này:" và `[data-period="previous"]` bắt đầu "Kỳ trước:", mỗi dòng có hai ngày dạng `dd/mm/yyyy`; kỳ trước dài bằng kỳ này.
  - *Đổi kỳ*: bấm "Hôm nay" → địa chỉ có `ky=hom-nay`, dòng "Kỳ này" chỉ một ngày; "Tháng này" → `ky=thang-nay`.
  - *Địa chỉ hỏng*: `#/nv/bao-cao?ky=abc` và `?tu=2026-02-30&den=2026-03-01` → chip "7 ngày" được chọn, không lỗi.
  - *Chọn ngày sai*: "Chọn ngày", từ `2026-10-20` đến `2026-10-01` → hiện đúng "Ngày kết thúc cần sau hoặc bằng ngày bắt đầu." dưới ô; dòng "Kỳ này" không đổi; số đang hiện giữ nguyên.
  - *Phân quyền*: `bacsi_mai` và `spa_ngocanh` không thấy liên kết "Báo cáo", vào thẳng địa chỉ thấy "Mục này dành cho người có quyền phù hợp"; `quanly_ha` thấy liên kết "Báo cáo" đứng ngay trước "Doanh thu" (chỉ kiểm thứ tự ở màn ≥ 768 px).
  - *Điện thoại* `@narrow`: `fitsDevice`.
- [ ] **Step 2: Build và chạy, thấy đỏ**: `npm run build && npx playwright test e2e/giao-dien-nhan-vien-f.spec.ts --project=desktop-1440 --timeout=15000`. Expected: FAIL (chưa có route).
- [ ] **Step 3: Cài** theo "Files": `ReportsPage` gọi `usePeriodRange('7d')` rồi `useQuery(() => staff.reports.operations(range), [range.from, range.to])`; **hai dòng "Kỳ này/Kỳ trước" lấy từ `data.from/to` và `data.previous` khi có, chưa có thì từ địa chỉ** (để luôn khớp số đang hiện); số cũ giữ trên màn khi đổi kỳ (giữ lại dữ liệu cuối bằng `useState` cập nhật khi `q.data` đổi, như `StockPage`); lần đầu `LoadingBlocks`, lỗi `PageProblem`; nhãn kỳ dạng viên (`--plum-100`).
- [ ] **Step 4: Chạy, thấy xanh**: build lại, chạy cả file ở ba cỡ; `npm run typecheck && npm run lint && npm test`. Expected: PASS.
- [ ] **Step 5: Commit**: `feat: operations report page shell with period picker`.

---

### Task 4: hàng 1, bảng "Trong kỳ" và "Cần chú ý lúc này"

**Files:**
- Create: `TrongKy.tsx`, `AttentionList.tsx`
- Modify: `ReportsPage.tsx`, `Reports.module.css`
- Test: `e2e/giao-dien-nhan-vien-f.spec.ts`

**Interfaces:**
- Consumes: `headlines`, `attentionItems` (Task 1); `useSession().can`; `AppLink` (`@/app/nav`); `CountUp`.
- Produces: `TrongKy({ report }: { report: OperationsReport })`: bốn ô trong một khung (viền dọc mảnh), mỗi ô `data-kpi="{key}"` và `data-value="{số}"`, số lớn (trọng lượng 500), nhãn, dòng `delta`; `aria-label` đọc đủ ("Lịch đã hẹn: 42, nhiều hơn kỳ trước 3"). `AttentionList({ report }: …)`: tiêu đề "Cần chú ý lúc này" và dòng phụ "Không phụ thuộc kỳ đã chọn."; mỗi dòng `data-attention="{key}"`; rỗng → "Hiện chưa có việc nào cần chú ý." kèm biểu tượng `circle-check`. Hàng 1 lưới `3fr / 2fr`, dưới 768 px xếp dọc.

- [ ] **Step 1: Viết e2e (đỏ)**: `describe('first row')`: bốn ô theo đúng thứ tự "Lịch đã hẹn", "Yêu cầu nhận", "Khách mới", "Lượt nhập nội trú", mỗi ô có `data-value` là số nguyên ≥ 0 và một dòng so sánh khớp `/(nhiều hơn|ít hơn) kỳ trước \d|bằng kỳ trước|kỳ trước chưa có/`; **"Cần chú ý" khớp dữ liệu mẫu**: `[data-attention="out"]` chứa "1 món kho đã hết hàng", `low` "3 món kho sắp hết", `soon` "1 món sắp hết hạn", `expired` "1 món đã hết hạn" (cộng thêm dòng `requests` nếu có yêu cầu chờ, kiểm chỉ khi hiện); bấm dòng hết hàng → địa chỉ chứa `/nv/kho` và `tt=het`, trang Kho có đúng một hàng; bấm dòng yêu cầu → `/nv/yeu-cau`. Số trong ô đổi theo kỳ: ở "Hôm nay" mỗi `data-value` không lớn hơn giá trị ở "Tháng này".
- [ ] **Step 2: Chạy, thấy đỏ**: `npx playwright test e2e/giao-dien-nhan-vien-f.spec.ts -g "first row" --project=desktop-1440 --timeout=15000`. Expected: FAIL.
- [ ] **Step 3: Cài** hai thành phần và CSS theo R43: khung trắng viền `--line-soft`, không bóng; số `font-weight: 500`, `letter-spacing: -0.02em`, `font-variant-numeric: tabular-nums`; vạch dọc ngăn ô; liên kết chỉ khi `to` có, nếu không là chữ thường.
- [ ] **Step 4: Chạy, thấy xanh**: build lại, cả file ba cỡ; `npm run typecheck && npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit**: `feat: report headline numbers and attention list`.

---

### Task 5: khối Lịch hẹn và Yêu cầu đặt lịch

**Files:**
- Create: `DayBars.tsx`, `RatioList.tsx`, `AppointmentsSection.tsx`, `RequestsSection.tsx`
- Modify: `ReportsPage.tsx`, `Reports.module.css`
- Test: `e2e/giao-dien-nhan-vien-f.spec.ts`

**Interfaces:**
- Consumes: `appointmentSummary`, `ratioRows`, `percentText`, `minutesText` (Task 1); `bucketDaily, axisEvery` (`../revenue/revenueView`; truyền `count` làm `amount`); `SERVICES, SERVICE_LABEL, APPOINTMENT_SOURCES, APPOINTMENT_SOURCE_LABEL, REQUEST_STATUSES, REQUEST_STATUS_LABEL` (`@/data/contracts/enums`); `DataTable`, `Panel`.
- Produces: `DayBars({ daily, asTable, onToggle }: { daily: { date: string; count: number }[]; asTable: boolean; onToggle: () => void })`: cột tím một màu, nhãn trục thưa dần, `chartRise` một lần, bảng thay thế (`caption` "Bảng lịch đã hẹn theo ngày", cột Ngày / Số lịch), kỳ > 120 ngày gộp theo tuần. `RatioList<K extends string>({ title, rows, data }: { title: string; rows: RatioRow<K>[]; data: string })`: `<ul data-ratio="{data}">`, mỗi hàng `data-ratio-row` `data-count`, tên + một vạch tím mảnh **không có nền rãnh** (`aria-hidden`) + số lượng và phần trăm bằng chữ; **bản thân danh sách chữ là bảng số thay thế** (ghi trong sổ). `AppointmentsSection({ report })` (câu `appointmentSummary`, `DayBars`, hai `RatioList` `data="service"` và `data="source"`); `RequestsSection({ report })` (ba số `data-kpi="received|confirmRate|firstResponse"` + `RatioList` `data="status"` đủ sáu trạng thái theo thứ tự `REQUEST_STATUSES`, số 0 mờ).

- [ ] **Step 1: Viết e2e (đỏ)**: `describe('appointments and requests')`: **các nhóm cộng đúng**: tổng `data-count` của `[data-ratio="service"]` và của `[data-ratio="source"]` đều bằng số lịch đã hẹn trong câu tóm tắt ("Đã hẹn N lịch…") và bằng `data-value` của ô "Lịch đã hẹn"; tổng `[data-ratio="status"]` bằng `data-kpi="received"`; đủ sáu hàng trạng thái kể cả số 0; ở "Tháng này" câu tóm tắt vẫn có dạng "Đã hẹn N lịch, đã hủy M (…)" hoặc "Chưa có lịch nào trong kỳ."; `confirmRate`/`firstResponse` là phần trăm có dấu phẩy hoặc "Chưa có" / "N phút" (kiểm không chứa `NaN`, `Infinity`, `undefined`); biểu đồ: bấm "Xem dạng bảng" → bảng "Bảng lịch đã hẹn theo ngày" có cột "Ngày" và "Số lịch", tổng cột bằng số lịch đã hẹn, bấm "Xem biểu đồ" quay lại; **kỳ 366 ngày** (`Chọn ngày` từ một năm trước đến hôm nay): trang không lỗi và `fitsDevice` ở `@narrow`; điện thoại `@narrow` vừa chiều rộng.
- [ ] **Step 2: Chạy, thấy đỏ**: `npx playwright test e2e/giao-dien-nhan-vien-f.spec.ts -g "appointments and requests" --project=desktop-1440 --timeout=15000`. Expected: FAIL.
- [ ] **Step 3: Cài** theo Interfaces; `DayBars` tham khảo `RevenueChart` (cùng cách gộp tuần và nhãn trục) nhưng đếm số lịch và dùng CSS riêng trong `Reports.module.css`; `RatioList` vạch dùng `fill` làm chiều rộng, không nền rãnh.
- [ ] **Step 4: Chạy, thấy xanh**: build lại, cả file ba cỡ; `npm run typecheck && npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit**: `feat: report appointments and requests sections`.

---

### Task 6: Nội trú, Doanh thu tóm tắt, kỳ rỗng, tài liệu và kiểm tra tổng

**Files:**
- Create: `InpatientSection.tsx`, `RevenueGlance.tsx`
- Modify: `ReportsPage.tsx`, `Reports.module.css`, `docs/thiet-ke/QUYET-DINH.md` (R44), `PROGRESS.md`, `README.md`, `docs/tham-khao/bang-kiem-thu-nghiep-vu-2026-10-21.md` (mục Báo cáo)
- Test: `e2e/giao-dien-nhan-vien-f.spec.ts`

**Interfaces:**
- Consumes: `inpatientCells`, `showRevenue`, `deltaText`, `isEmptyPeriod`, `percentText` (Task 1); `formatVnd` (`@/lib/money`); `paths.nv.revenue`; `AppLink`.
- Produces: `InpatientSection({ report })`: dải bốn ô (`data-kpi="inpatient-current|moves|bedDays|occupancy"`) với ghi chú giải thích dưới "Ngày-chuồng" và "Lấp đầy". `RevenueGlance({ revenue })`: ba số (Đã thu, Đã xuất hóa đơn, Còn nợ lúc này), dòng so sánh "đã thu" với kỳ trước bằng lời (tiền định dạng bằng `formatVnd`), nút chữ "Xem chi tiết doanh thu" (liên kết `paths.nv.revenue`). Trang: khi `isEmptyPeriod(report)` hiện câu "Chưa có số liệu trong kỳ này. Thử chọn kỳ dài hơn." thay cho các khối Lịch hẹn, Yêu cầu, Nội trú (vẫn hiện bảng "Trong kỳ" toàn 0 và "Cần chú ý").

- [ ] **Step 1: Viết e2e (đỏ)**: `describe('inpatient, revenue and empty period')`: khối Nội trú có bốn ô, "Lấp đầy" là phần trăm có dấu phẩy hoặc "Chưa có", "Ngày-chuồng" có ghi chú "Tổng số ngày các bé đã ở nội trú trong kỳ."; khối "Doanh thu trong kỳ" hiện cho `quanly_ha` với ba số tiền dạng `n ₫` và liên kết "Xem chi tiết doanh thu" đi tới `/nv/doanh-thu`; **kỳ rỗng**: "Chọn ngày" từ `2020-01-01` đến `2020-01-07` → hiện "Chưa có số liệu trong kỳ này. Thử chọn kỳ dài hơn.", khối "Cần chú ý lúc này" vẫn có, mọi `data-value` bằng 0, trang không chứa `NaN`; bàn phím: Tab đi qua chip kỳ, nút "Xem dạng bảng" và các liên kết, `Space` bật nút bảng; **axe** không lỗi nghiêm trọng hoặc quan trọng trên trang và khi bảng thay thế đang mở; `@narrow` 320 px vừa chiều rộng ở kỳ 7 ngày và 366 ngày.
- [ ] **Step 2: Chạy, thấy đỏ**: `npx playwright test e2e/giao-dien-nhan-vien-f.spec.ts -g "inpatient, revenue and empty period" --project=desktop-1440 --timeout=15000`. Expected: FAIL.
- [ ] **Step 3: Cài** hai thành phần và trạng thái rỗng; viết tài liệu: R44 trong `QUYET-DINH.md` (Báo cáo vận hành: bố cục, kỳ mặc định 7 ngày, không có thanh theo người phụ trách, "Cần chú ý lúc này" không theo kỳ, chữ "Chưa có", tách `usePeriodRange`, không đổi dữ liệu), `PROGRESS.md` (5B xong, việc tiếp theo 5C kèm quyền Kho tách ba và ghi chú "chỉ xem" cần e2e ở 5C), `README.md` hàng trạng thái, mục "Báo cáo vận hành (phần 5B)" cuối bảng kiểm thử nghiệp vụ.
- [ ] **Step 4: Chạy toàn bộ**: `npm run verify`. Expected: exit 0 (ghi số test; lỗi phía khách do giờ 00:00 đến 08:00 là lỗi cũ đã biết: chạy lại ban ngày hoặc ghi rõ).
- [ ] **Step 5: Commit**: `feat: report inpatient and revenue sections; docs for part 5B`.

---

## Self-review

- **Phủ spec:** §1 hướng thiết kế → Global Constraints + CSS ở Task 4 đến 6; §2 phạm vi và quyền → Task 1 (`attentionItems`, `showRevenue`), 3 (NAV, route, chặn), 6; §3 hàng 1 → Task 4, hàng 2 và 3 → Task 5, hàng 4 và 5 và trạng thái → Task 6, đầu trang và kỳ → Task 3; §4 cấu trúc → File structure; §5 trợ năng → Task 5 và 6 (bảng thay thế, axe, bàn phím, 320 px); §6 kiểm thử → từng task; §7 → ghi `PROGRESS.md` ở Task 6.
- **Chênh với spec (ghi sổ khi chạy):** `RatioList` không có bảng thay thế riêng vì danh sách chữ đã là dữ liệu (spec §3 ghi "mỗi biểu đồ có bảng thay thế": biểu đồ cột có bảng, vạch tỉ lệ thì danh sách chữ chính là bảng); bảng "Trong kỳ" gọi `headlines`.
- **Nhất quán tên:** `headlines`, `attentionItems`, `ratioRows`, `inpatientCells`, `usePeriodRange`, `data-kpi`, `data-ratio`, `data-attention`, `data-period` được định nghĩa ở Task 1 đến 3 và dùng đúng tên ở Task 4 đến 6.
- **Số tiếp theo của quyết định:** R44 (R43 là hướng thiết kế).
