# Phần 5D: Tùy chọn của tôi và áp dụng cài đặt hệ thống, kế hoạch thực hiện

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho mỗi nhân viên trang "Tùy chọn của tôi" có tác dụng thật khắp khu nhân viên, và làm cho các giá trị Quản lý đã lưu ở Cài đặt hệ thống đổi hành vi thật của lịch, hóa đơn và yêu cầu.

**Architecture:** Chỉ lớp giao diện. Một `PrefsProvider` (trong `SessionProvider`) đọc `staff.prefs` và `staff.settings` một lần, nuôi `usePrefs()` và `useAppSettings()`; các hàm thuần (`prefsView`, `settingsEffects`, `nudges`) có test quyết định mọi chuyển đổi. Cỡ chữ, độ dày, chuyển động áp bằng thuộc tính `data-staff-*` trên `<html>` (chỉ khi phiên là nhân viên) và CSS. Dữ liệu **không đổi** (`src/data/**` chỉ đọc).

**Tech Stack:** React 19, TypeScript, react-router (hash), motion, CSS Modules, Vitest, Playwright. Không thêm thư viện.

**Spec:** `docs/superpowers/specs/2026-10-22-phan-5d-nhan-vien-tuy-chon-ap-dung-design.md`.

## Global Constraints

- Mọi chữ hiển thị bằng tiếng Việt; không "quý khách", không "lễ tân"; số, ngày, mã dùng class `.num`; **không dùng `—` trong chữ hiển thị mới**.
- R43: Linear 85% + Stripe 15%: nền phẳng, viền mảnh, một màu nhấn tím mận, không gradient trong vùng dữ liệu.
- Không đổi `src/data/**`. Cần đổi thì dừng, ghi `PROGRESS.md` "Yêu cầu gửi nhánh kia".
- Tùy chọn: **chọn là lưu ngay**, mỗi lần chỉ gửi đúng khóa vừa đổi (`staff.prefs.save({ khóa })`), trang có dòng trạng thái `aria-live="polite"` "Đã lưu."; lưu hỏng thì trả ô về giá trị cũ và báo dưới ô (câu của API).
- Câu cố định (chép nguyên): "Đã lưu." · nhóm "Giao diện", "Khi đăng nhập", "Màn hình làm việc", "Nhắc việc" · "Nhắc việc" ở Tổng quan · "Quá hạn" · "Ngày lễ: bệnh viện làm đến 19:00." · lựa chọn kỳ mới "30 ngày".
- Ngưỡng mẫu của bản demo: hóa đơn nháp "lâu" là **quá 2 ngày** (`DRAFT_DAYS = 2`).
- Chuyển động một lần, 150 đến 450 ms, `prefers-reduced-motion` và tùy chọn "Luôn giảm" đều tắt chuyển động; bàn phím; tương phản ≥ 4,5:1; điện thoại 320 px không cuộn ngang ở **cả cỡ chữ Lớn và bảng Gọn**.
- Quyền: ô Trang vào và Nhắc việc chỉ liệt kê cái người đó được phép (`LANDING_NEEDS`, `NUDGE_NEEDS` trong `@/data/rules/staff-prefs`).
- Commit tiêu đề tiếng Anh `feat:`/`test:`/`docs:`, không ghi tên model. Viết test trước. **Đọc kết quả test trước khi chạy `task-done`.**

## Review Focus

1. Cỡ chữ Lớn và bảng Gọn ở 320 px: không cuộn ngang trên Tổng quan, một bảng, một hộp thoại, thanh dưới (Task 4).
2. Tùy chọn của người này không lọt sang người kế tiếp đăng nhập trên cùng trình duyệt: đăng xuất thì `<html>` trở về không có thuộc tính; bản nhớ tạm theo mã nhân viên (Task 2).
3. Người đã chọn trang vào "Hóa đơn" rồi bị thu quyền: đăng nhập vào Tổng quan, không vào trang bị chặn (Task 5).
4. Hai tab đổi hai tùy chọn khác nhau: cả hai giữ; cùng một tùy chọn: tab sau thắng và tab kia tự cập nhật (Task 3).
5. Cài đặt hệ thống chưa tải xong hoặc đọc lỗi: dùng mặc định cũ (07–21 nới theo lịch, 30 và 60 phút, đủ ba phương thức), không báo lỗi; hộp Thu tiền luôn có ít nhất một phương thức (Task 7).
6. Đổi giờ lưới lịch: lịch hẹn nằm ngoài khung mới vẫn hiện (khung nới ra), không mất lịch (Task 7).

---

## File structure

Mới, `src/app/prefs/`: `prefsView.ts` · `prefsView.test.ts` · `settingsEffects.ts` · `settingsEffects.test.ts` · `nudges.ts` · `nudges.test.ts` · `PrefsProvider.tsx` · `useAppSettings.ts` · `index.ts`.
Mới, `src/features/staff/settings/`: `PrefsPage.tsx` · `Prefs.module.css`. Mới: `src/features/staff/dashboard/NudgeList.tsx`. Mới: `e2e/giao-dien-nhan-vien-h.spec.ts`.
Sửa: `src/app/routes.ts`, `src/app/router.tsx`, `src/app/layouts/RootLayout.tsx`, `src/app/guards.tsx`, `src/ui/motion.ts` (+ 12 tệp đổi nguồn `useReducedMotion`), `src/styles/base.css`, `src/ui/kit/DataTable.module.css`, `src/features/staff/index.tsx`, `settings/SettingsLayout.tsx`, `shell/StaffShell.tsx`, `dashboard/DashboardPage.tsx`, `revenue/{revenueView.ts,PeriodPicker.tsx,RevenuePage.tsx}`, `reports/ReportsPage.tsx`, các trang có `DataTable` (Customers, Invoices, Stock, Prices, MoveHistory, Team), `appointments/{gridMath.ts,DayGrid.tsx,WeekGrid.tsx,CalendarPage.tsx,NewAppointmentDialog.tsx}`, `requests/{ConfirmDialog.tsx,RequestsPage.tsx,RequestDetail.tsx}`, `invoices/PaymentDialog.tsx`, `src/ui/icons/names.ts`, `scripts/duotone-icons.mjs`, `e2e/manifest.ts`.

---

### Task 1: hàm thuần (`prefsView`, `settingsEffects`, `nudges`) và kỳ "30 ngày"

**Files:**
- Create: `src/app/prefs/{prefsView,settingsEffects,nudges}.ts` và ba tệp `.test.ts`
- Modify: `src/features/staff/revenue/revenueView.ts` (+ `revenueView.test.ts` nếu có), `PeriodPicker.tsx`

**Interfaces:**
- Consumes: `LANDING_NEEDS, NUDGE_NEEDS, defaultPrefs` (`@/data/rules/staff-prefs`); `PAYMENT_METHODS` (`@/data/contracts/enums`); `findHoliday`, `DEFAULT_SETTINGS` (`@/data/rules/app-settings`); `HOLIDAY_CLOSE` (`@/data/rules/booking`); `paths` (`@/app/routes`); kiểu `StaffPrefs, AppSettingsValues, StaffInvoiceRow, StaffRequestCard` (`@/data/staff`).
- Produces (`prefsView.ts`):
  - `landingPath(p: LandingPage): string` (home → `paths.nv.home`, appointments → `paths.nv.calendar`, inpatient → `paths.nv.board`, invoices → `paths.nv.invoices`).
  - `landingChoices(can: (c: Cap | Cap[]) => boolean): LandingPage[]` theo thứ tự `LANDING_PAGES`; `nudgeChoices(can): NudgeKey[]` theo `NUDGE_KEYS`.
  - `reportPeriod(r: ReportRange): Fixed` (`'7d'→'7d'`, `'30d'→'30d'`, `'month'→'month'`).
  - `viewFromPref(v: CalendarView): 'ngay' | 'tuan'`.
  - `appearanceAttrs(p: Pick<StaffPrefs,'text_size'|'density'|'motion'>): { 'data-staff-text': 'md'|'lg'; 'data-staff-density': 'comfortable'|'compact'; 'data-staff-motion': 'system'|'reduced' }`.
  - `readCachedPrefs(staffId: string): StaffPrefs | null`, `writeCachedPrefs(staffId: string, p: StaffPrefs): void`, `clearCachedPrefs(): void` (khóa `leson.staffPrefs.<staffId>` trong `localStorage`; mọi truy cập bọc `try/catch`; đọc ra giá trị sai hình thì `null`).
- Produces (`settingsEffects.ts`): `hoursOf(s: Pick<AppSettingsValues,'calendar_start'|'calendar_end'>): { startH: number; endH: number }` (làm tròn ra ngoài: giờ bắt đầu lấy phần giờ, giờ kết thúc làm tròn lên); `minutesFor(service: Service, s: Pick<AppSettingsValues,'default_duration_kham'|'default_duration_spa'>): number` (`noi_tru` luôn 30); `enabledMethods(s: Pick<AppSettingsValues,'payment_methods'>): PaymentMethod[]` (theo thứ tự `PAYMENT_METHODS`, luôn ít nhất một: rỗng thì trả `['cash']`); `holidayMark(date: string, holidays: readonly Holiday[]): Holiday | undefined`; `holidayNotice(date: string, endTime: string | undefined, holidays: readonly Holiday[]): string | undefined` (trả "Ngày lễ: bệnh viện làm đến 19:00." khi `date` là ngày lễ và `endTime` > `HOLIDAY_CLOSE`).
- Produces (`nudges.ts`): `DRAFT_DAYS = 2`; `oldDrafts(rows: Pick<StaffInvoiceRow,'status'|'created_at'>[], now: Date): number` (nháp có `created_at` cũ hơn `DRAFT_DAYS` ngày); `type NudgeLine = { key: NudgeKey; text: string; to: string }`; `nudgeLines(input: { enabled: Record<NudgeKey, boolean>; requests: number; reschedules: number; stock: number; drafts: number }): NudgeLine[]` (chỉ loại đang bật và số > 0, thứ tự `NUDGE_KEYS`; chữ "N yêu cầu đặt lịch đang chờ xử lý", "N khách xin đổi lịch", "N món kho đã hết hoặc sắp hết", "N hóa đơn nháp để quá 2 ngày chưa phát hành"; đích: requests và reschedules → `paths.nv.requests`, stock → `paths.nv.stock`, drafts → `paths.nv.invoices` kèm `?tt=nhap` nếu trang Hóa đơn có tham số lọc nháp, nếu không thì không kèm); `toastWanted(enabled: Record<NudgeKey, boolean>): boolean` (= `enabled.requests`).
- `revenueView.ts`: thêm `'30d'` vào `Period`/`FIXED`, `periodRange('30d', today)` = `{ from: addDays(today, -29), to: today }`, địa chỉ `?ky=30-ngay`; `PeriodPicker` nhãn "30 ngày" xếp sau "7 ngày".

- [ ] **Step 1: Viết test (đỏ).** `prefsView.test.ts`: `landingPath` bốn giá trị; `landingChoices` với quyền `new Set(['appointments.view'])` = `['home','appointments']`, với tập rỗng = `['home']`, với `invoices.create` có `invoices`; `nudgeChoices` cho Spa (không có `requests.handle`, `stock.receive`, `stock.items`, `invoices.create`) = `[]`, cho Quản lý đủ bốn; `reportPeriod` ba giá trị; `viewFromPref('day')='ngay'`, `'week'='tuan'`; `appearanceAttrs` ba cặp; bản nhớ tạm: ghi rồi đọc ra y hệt, khác `staffId` đọc ra `null`, JSON sai hình/giá trị ngoài danh sách đọc ra `null`, `clearCachedPrefs` xóa mọi khóa `leson.staffPrefs.*`. `settingsEffects.test.ts`: `hoursOf({'08:00','21:00'})={8,21}`, `{'08:30','20:30'}={8,21}`, `{'07:00','19:00'}={7,19}`; `minutesFor`: kham/spa theo cài đặt, `noi_tru` 30; `enabledMethods` đúng thứ tự `['qr','cash']` → `['cash','qr']`, `[]` → `['cash']`; `holidayMark` tìm theo ngày; `holidayNotice('2026-12-25','19:30',[{date:'2026-12-25',note:'Noel'}])` = câu cố định, `'19:00'` → `undefined`, ngày thường → `undefined`, `endTime` vắng → `undefined`. `nudges.test.ts`: `oldDrafts` chỉ đếm `draft` cũ hơn 2 ngày (ranh giới đúng 2 ngày không tính); `nudgeLines` bỏ loại tắt và số 0, đúng chữ và thứ tự; `toastWanted`. `revenueView.test.ts`: `periodRange('30d','2026-10-22')`, `readRange('?ky=30-ngay',…)` ra `period:'30d'`, `writePeriod('30d')`.
- [ ] **Step 2: Chạy, thấy đỏ:** `npx vitest run src/app/prefs src/features/staff/revenue`. Expected: FAIL (mô-đun chưa có; `30d` chưa có).
- [ ] **Step 3: Cài** theo Interfaces; `npm run typecheck` chỉ ra mọi chỗ cần nhãn/ánh xạ cho `Period` mới (PeriodPicker, RevenuePage…): sửa đúng chỗ đó.
- [ ] **Step 4: Chạy, thấy xanh:** cùng lệnh; `npm run typecheck && npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: prefs and settings-effect helpers; 30-day period`.

---

### Task 2: `PrefsProvider`, `usePrefs`, `useAppSettings`, thuộc tính giao diện

**Files:**
- Create: `src/app/prefs/PrefsProvider.tsx`, `useAppSettings.ts`, `index.ts`
- Modify: `src/app/layouts/RootLayout.tsx` (bọc `PrefsProvider` trong `SessionProvider`)
- Test: `e2e/giao-dien-nhan-vien-h.spec.ts` (mới)

**Interfaces:**
- Consumes: Task 1; `staff.prefs.get/save/reset`, `staff.settings.get` (`@/data/staff`); `useSession` (`session.kind`, `session.staffId`); `system.subscribe/rev` (`@/data/public`).
- Produces (`PrefsProvider.tsx`, xuất lại ở `index.ts`):
  - `PrefsProvider({ children })`; `usePrefs(): { prefs: StaffPrefs; ready: boolean; save(patch: StaffPrefsPatch): Promise<void>; reset(): Promise<void> }`. Ngoài khu nhân viên hoặc trước khi đọc xong: `prefs = defaultPrefs(new Set())` (không nhắc việc), hoặc bản nhớ tạm của đúng nhân viên nếu có. `save` đặt giá trị mới ngay (trả lại giá trị cũ khi API từ chối rồi ném lại lỗi); đọc lại khi `system.rev` đổi; ghi bản nhớ tạm theo mã nhân viên; đăng xuất thì `clearCachedPrefs`.
  - Hiệu ứng phụ: khi phiên là nhân viên, đặt ba thuộc tính `appearanceAttrs(prefs)` lên `document.documentElement`; khi không phải nhân viên (hoặc gỡ), xóa ba thuộc tính.
  - `useAppSettings(): AppSettingsValues` (mặc định `DEFAULT_SETTINGS` trước khi đọc xong hoặc khi đọc lỗi; đọc lại theo `system.rev`).
  - `usePageSize(): number` (= `prefs.page_size`).

- [ ] **Step 1: Viết e2e (đỏ)** trong `e2e/giao-dien-nhan-vien-h.spec.ts`, `describe('prefs plumbing')` (`desktop-1440`, `phone-390`): nhân viên `bacsi_mai` vào `/nv`: `<html>` có `data-staff-text="md"`, `data-staff-density="comfortable"`, `data-staff-motion="system"`; đăng xuất (qua `__lesonDemo.logout()`) rồi mở trang công khai: `<html>` **không còn** ba thuộc tính; khách hàng `lan_nguyen` vào `/khach-hang`: không có ba thuộc tính; đổi người: `bacsi_mai` đặt tùy chọn (qua `page.evaluate` gọi `__lesonDemo` nếu có đường tắt, nếu không thì để ca này kiểm ở Task 3 và ở đây chỉ kiểm hai ca đầu); bản nhớ tạm không lọt sang người khác kiểm ở Task 3.
- [ ] **Step 2: Build và chạy, thấy đỏ:** `npm run build && npx playwright test e2e/giao-dien-nhan-vien-h.spec.ts --project=desktop-1440 --timeout=15000`. Expected: FAIL.
- [ ] **Step 3: Cài** theo Interfaces; gắn trong `RootLayout` sau `SessionProvider`, trước `ToastProvider`.
- [ ] **Step 4: Chạy, thấy xanh:** build lại, cả file hai cỡ; `npm run typecheck && npm run lint && npm test`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: prefs and app-settings providers`.

---

### Task 3: trang "Tùy chọn của tôi"

**Files:**
- Create: `src/features/staff/settings/PrefsPage.tsx`, `Prefs.module.css`
- Modify: `src/app/routes.ts` (`settingsPrefs: '/nv/cai-dat/tuy-chon'`, bí danh `nv-tuy-chon`), `src/app/router.tsx` (`tuy-chon`, tiêu đề "Tùy chọn của tôi"), `src/features/staff/index.tsx`, `settings/SettingsLayout.tsx` (liên kết thứ hai, biểu tượng `sliders-horizontal`), `src/ui/icons/names.ts`, `scripts/duotone-icons.mjs` (+ `npm run icons`), `e2e/manifest.ts` (`cai-dat-tuy-chon`)
- Test: `e2e/giao-dien-nhan-vien-h.spec.ts`

**Interfaces:**
- Consumes: `usePrefs()`; `landingChoices`, `nudgeChoices` (Task 1); `useSession().can`; `ChipGroup`, `Checkbox`, `Button`, `Dialog`; `PageHeader, Panel, MiniTag, FormError` (`../ui`); nhãn `TEXT_SIZE_LABEL, DENSITY_LABEL, MOTION_PREF_LABEL, LANDING_PAGE_LABEL, CALENDAR_VIEW_LABEL, REPORT_RANGE_LABEL, NUDGE_LABEL` (`@/data/contracts/enums`).
- Produces: `PrefsPage()` (h1 "Tùy chọn của tôi"; bốn khung đúng tên và thứ tự trong Global Constraints; mỗi `ChipGroup` có `label`; dòng `role="status"` "Đã lưu." sau mỗi lần lưu thành công; lỗi hiện dưới ô; nút "Về mặc định" mở hộp thoại hỏi "Đưa mọi tùy chọn về mặc định?" với "Để sau" và "Về mặc định").

- [ ] **Step 1: Viết e2e (đỏ)**, `describe('personal options page')`: *Lối vào*: cả ba vai thấy liên kết "Tùy chọn của tôi" trong cột Cài đặt, nằm sau "Hồ sơ của tôi"; *Hình*: có h1 và bốn khung; mỗi ô là nhóm nút (`radiogroup` có tên: "Cỡ chữ", "Độ dày bảng", "Chuyển động", "Trang vào sau đăng nhập", "Kiểu xem lịch", "Số dòng mỗi trang", "Khoảng ngày báo cáo"); *Theo quyền*: `spa_ngocanh` thấy trang vào chỉ "Trang chủ", "Lịch hẹn", "Nội trú" (không "Hóa đơn"), và không thấy ô nhắc việc "Yêu cầu đặt lịch chờ xử lý" hay "Khách xin đổi lịch" hay "Hóa đơn nháp lâu chưa phát hành"; `quanly_ha` thấy đủ bốn nhắc việc và bốn trang vào; *Lưu ngay*: `bacsi_mai` chọn "Lớn" ở Cỡ chữ → dòng trạng thái "Đã lưu." và `<html data-staff-text="lg">`; tải lại trang vẫn "Lớn" và nút "Lớn" được chọn; *Về mặc định*: bấm → hộp thoại hỏi → "Về mặc định" → trở về "Vừa", `data-staff-text="md"`; "Để sau" không đổi gì; *Không lọt sang người khác*: `bacsi_mai` chọn "Lớn", đăng xuất, `bacsi_duc` vào: `data-staff-text="md"`; *Hai tab*: tab A mở trang, tab B (cùng trình duyệt, cùng người) chọn "Gọn"; tab A chọn "Lớn" ở Cỡ chữ: cả hai khóa giữ (tải lại: Cỡ chữ Lớn và Độ dày Gọn); *Cùng một khóa*: tab B đổi Cỡ chữ về "Vừa" thì ô ở tab A tự cập nhật thành "Vừa"; *Trợ năng*: axe sạch; bàn phím chọn được một lựa chọn bằng phím mũi tên; `@narrow` vừa chiều rộng.
- [ ] **Step 2: Build và chạy, thấy đỏ:** `npm run build && npx playwright test e2e/giao-dien-nhan-vien-h.spec.ts --project=desktop-1440 -g "personal options" --timeout=15000`. Expected: FAIL.
- [ ] **Step 3: Cài** theo Interfaces. Mỗi lựa chọn gọi `save({ khóa })` đúng một khóa; nhắc việc gọi `save({ nudges: { [khóa]: bật } })`. Thêm icon `sliders-horizontal` (Phosphor `SlidersHorizontal`) và chạy `npm run icons`.
- [ ] **Step 4: Chạy, thấy xanh:** build lại, cả file ba cỡ; `npm run typecheck && npm run lint && npm test`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: personal options page`.

---

### Task 4: cỡ chữ, độ dày bảng và chuyển động có tác dụng

**Files:**
- Modify: `src/styles/base.css` (quy tắc `html[data-staff-*]`), `src/ui/kit/DataTable.module.css` và danh sách ở `src/features/staff/Staff.module.css` (khoảng đệm hàng gọn), `src/ui/motion.ts` (xuất `useReducedMotion` mới và `ForceReducedMotion` context), `src/app/prefs/PrefsProvider.tsx` (cấp context và `MotionConfig`), 12 tệp `src/ui/kit/*` và `src/features/staff/**` đổi `import { useReducedMotion } from 'motion/react'` sang `@/ui/motion` (các tệp khách và công khai giữ nguyên)
- Test: `e2e/giao-dien-nhan-vien-h.spec.ts`

**Interfaces:**
- Consumes: `usePrefs` (Task 2), nút chọn ở Task 3.
- Produces: `useReducedMotion(): boolean` trong `@/ui/motion` (= hệ thống muốn giảm **hoặc** tùy chọn "Luôn giảm"); `ForceReducedMotion` (React context boolean, mặc định `false`); `PrefsProvider` cấp `true` khi `prefs.motion === 'reduced'` trong khu nhân viên và bọc `MotionConfig reducedMotion="always"`.

- [ ] **Step 1: Viết e2e (đỏ)**, `describe('options have effect')`: *Cỡ chữ*: `quanly_ha` vào `/nv/khach-hang`; đo chiều cao chữ của h1 trước, chọn "Lớn" ở trang tùy chọn, quay lại: `getComputedStyle(document.querySelector('[data-zone="staff"]')).zoom` là `'1.125'` (hoặc kích thước chữ vẽ ra lớn hơn khoảng 12,5%); *Độ dày*: chiều cao một hàng bảng (`[data-row]` đầu tiên của Khách hàng) khi "Gọn" nhỏ hơn khi "Thoáng", và trên điện thoại vẫn ≥ 40 px; *Chuyển động*: chọn "Luôn giảm"; mở hộp thoại "Thêm nhân viên" ở Tài khoản (hoặc "Thêm món" ở Kho): ở khung hình đầu sau khi hộp thoại có trong trang, `opacity` của hộp thoại là `1` (đọc bằng `requestAnimationFrame` trong `page.evaluate`); *Trên điện thoại 320 px* (`@narrow`): với cỡ Lớn và bảng Gọn cùng bật, Tổng quan, bảng Khách hàng, hộp thoại "Sửa tài khoản nhân viên", thanh dưới không cuộn ngang (`fitsDevice`); không có hai điều khiển đè nhau ở thanh dưới.
- [ ] **Step 2: Build và chạy, thấy đỏ:** cùng lệnh với `-g "options have effect"`. Expected: FAIL.
- [ ] **Step 3: Cài** theo Interfaces. Cỡ chữ: `html[data-staff-text="lg"] [data-zone="staff"] { zoom: 1.125; }`. Nếu 320 px tràn ngang, thu gọn bằng cách đặt tối thiểu cho các lưới ở khu nhân viên, không bỏ `zoom`; nếu không cứu được thì áp Lớn chỉ từ 600 px trở lên và ghi `Ruling` vào sổ. Độ dày: `html[data-staff-density="compact"]` giảm khoảng đệm dọc hàng, giữ vùng chạm ≥ 40 px trên điện thoại. Chuyển động: CSS `html[data-staff-motion="reduced"] [data-zone="staff"] *` đặt `transition-duration` và `animation-duration` bằng 0.
- [ ] **Step 4: Chạy, thấy xanh:** build lại, cả file ba cỡ; `npm run typecheck && npm run lint && npm test`; chạy lại `e2e/giao-dien-nhan-vien-b.spec.ts` và `e2e/giao-dien-nhan-vien-e.spec.ts` (bảng, hộp thoại). Expected: PASS.
- [ ] **Step 5: Commit:** `feat: text size, density and motion options take effect`.

---

### Task 5: trang vào sau đăng nhập, số dòng mỗi trang, khoảng ngày báo cáo

**Files:**
- Modify: `src/app/guards.tsx` (`RequireGuest`: nhân viên đã đăng nhập, không có `tiep` hợp lệ trong `/nv` → chờ đọc tùy chọn rồi `Navigate` tới `landingPath`), `src/features/staff/{customers/CustomersPage.tsx,invoices/InvoicesPage.tsx,stock/StockPage.tsx,stock/MoveHistory.tsx,pricelist/PricesPage.tsx,settings/TeamPage.tsx}` (truyền `pageSize={usePageSize()}`), `src/features/staff/reports/ReportsPage.tsx` và `revenue/RevenuePage.tsx` (`usePeriodRange(reportPeriod(prefs.report_range))`)
- Test: `e2e/giao-dien-nhan-vien-h.spec.ts`

**Interfaces:**
- Consumes: Task 1 (`landingPath`, `reportPeriod`), Task 2 (`usePrefs`, `usePageSize`).
- Produces: không có API mới. Bảng thay thế của biểu đồ (`DayBars`, `RevenueChart`) **giữ** cỡ trang riêng.

- [ ] **Step 1: Viết e2e (đỏ)**, `describe('landing, page size and report range')`: *Trang vào*: `bacsi_mai` đặt "Lịch hẹn", đăng xuất, đăng nhập bằng trang đăng nhập nhân viên (dùng `signInAs`) → địa chỉ `#/nv/lich-hen`; đặt lại "Trang chủ" → `#/nv`; có `?tiep=%2Fnv%2Fnoi-tru` thì vào Nội trú dù đã chọn Lịch hẹn; *Mất quyền*: Quản lý cấp `invoices.create` cho `bacsi_mai` qua màn Tài khoản (`bacsi_mai` đã có quyền này theo vai Bác sĩ nên thay bằng `spa_ngocanh`, vai Spa không có), `spa_ngocanh` đặt trang vào "Hóa đơn", Quản lý thu quyền lại, `spa_ngocanh` đăng nhập lại → vào Tổng quan `#/nv`, không phải Hóa đơn; *Số dòng*: `quanly_ha` mở `/nv/kho` (13 món): với 10 dòng hiện 10 hàng và có phân trang, với 20 hiện 13 hàng; *Báo cáo*: đặt "30 ngày qua": `/nv/bao-cao` mở với nút "30 ngày" được chọn, hai dòng kỳ dài 30 ngày; đặt "Tháng này": nút "Tháng này" được chọn; `/nv/doanh-thu` theo cùng tùy chọn (mặc định "7 ngày"); `?ky=hom-nay` trên địa chỉ vẫn thắng tùy chọn; *Bộ chọn kỳ có "30 ngày"* ở cả Báo cáo và Doanh thu.
- [ ] **Step 2: Build và chạy, thấy đỏ:** cùng lệnh với `-g "landing, page size"`. Expected: FAIL.
- [ ] **Step 3: Cài** theo Files. Trong `RequireGuest`, trong lúc chờ đọc tùy chọn không dựng lại trang đăng nhập (tránh nháy).
- [ ] **Step 4: Chạy, thấy xanh:** build lại, cả file ba cỡ, cùng `e2e/guards.spec.ts`, `e2e/auth.spec.ts`, `giao-dien-nhan-vien-d.spec.ts`, `giao-dien-nhan-vien-f.spec.ts` (kỳ mặc định của Doanh thu đổi từ Tháng này sang 7 ngày: sửa nhỏ các kiểm tra cũ, ghi sổ); `npm run typecheck && npm run lint && npm test`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: landing page, page size and report range options`.

---

### Task 6: khối "Nhắc việc" ở Tổng quan

**Files:**
- Create: `src/features/staff/dashboard/NudgeList.tsx` (+ CSS trong `Staff.module.css`)
- Modify: `src/features/staff/dashboard/DashboardPage.tsx` (đặt khối ngay dưới lời chào), `src/features/staff/shell/StaffShell.tsx` (`useQueueBadge` chỉ hiện thông báo bật lên khi `toastWanted(prefs.nudges)`)
- Test: `e2e/giao-dien-nhan-vien-h.spec.ts`

**Interfaces:**
- Consumes: Task 1 (`nudgeLines`, `oldDrafts`, `toastWanted`), Task 2 (`usePrefs`); `staff.requests.list({ tab: 'can_xu_ly' })`, `staff.requests.reschedules()`, `staff.stock.summary()`, `staff.invoices.list({ state: 'draft' })`; mỗi truy vấn chỉ chạy khi người đó có quyền đúng loại (`NUDGE_NEEDS`) và loại đang bật.
- Produces: `NudgeList()` (khung "Nhắc việc", mỗi dòng một liên kết; không có dòng nào thì **không dựng khối**).

- [ ] **Step 1: Viết e2e (đỏ)**, `describe('nudges')`: `quanly_ha` mở `/nv`: thấy khối "Nhắc việc" có dòng "yêu cầu đặt lịch đang chờ xử lý" (số > 0) bấm đi `#/nv/yeu-cau` và dòng "món kho đã hết hoặc sắp hết" bấm đi Kho; tắt "Yêu cầu đặt lịch chờ xử lý" ở Tùy chọn → quay lại Tổng quan không còn dòng yêu cầu, dòng kho còn; tắt hết bốn → không còn khối "Nhắc việc"; `spa_ngocanh` không có khối (không loại nào hợp quyền); `bacsi_mai` chỉ có thể thấy dòng hóa đơn nháp nếu có (kiểm bằng đếm: không có dòng yêu cầu, không có dòng đổi lịch); khối đo bằng axe sạch và `@narrow` vừa. Thông báo bật lên: kiểm bằng test đơn vị `toastWanted` (Task 1), không có e2e.
- [ ] **Step 2: Build và chạy, thấy đỏ:** `-g "nudges"`. Expected: FAIL.
- [ ] **Step 3: Cài** theo Interfaces.
- [ ] **Step 4: Chạy, thấy xanh:** build lại, cả file ba cỡ; chạy lại `e2e/staff-a.spec.ts` (Tổng quan); `npm run typecheck && npm run lint && npm test`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: nudges on the overview`.

---

### Task 7: áp dụng cài đặt hệ thống

**Files:**
- Modify: `src/features/staff/ui.tsx` (bỏ `SERVICE_MINUTES`), `requests/ConfirmDialog.tsx` và `appointments/NewAppointmentDialog.tsx` (`minutesFor`, cảnh báo ngày lễ), `appointments/gridMath.ts` (+ `gridMath.test.ts`: `windowOf(items, bounds)` nhận khung lưới), `DayGrid.tsx`, `WeekGrid.tsx` (dùng `hoursOf(useAppSettings())`; đánh dấu ngày lễ), `invoices/PaymentDialog.tsx` (`enabledMethods`), `requests/RequestsPage.tsx` và `RequestDetail.tsx` (nhãn "Quá hạn"), `dashboard/DashboardPage.tsx` (số quá hạn), chữ giải thích ở Kho nếu ghi cứng "30 ngày"
- Test: `gridMath.test.ts`, `e2e/giao-dien-nhan-vien-h.spec.ts`

**Interfaces:**
- Consumes: Task 1 (`hoursOf`, `minutesFor`, `enabledMethods`, `holidayMark`, `holidayNotice`), Task 2 (`useAppSettings`); `StaffRequestCard.overdue`, `StaffRequestDetail.overdue`.
- Produces: `windowOf(items: Span[], bounds?: { startH: number; endH: number }): { startH: number; endH: number }` (mặc định `{ startH: 7, endH: 21 }`; khung nới ra khi có lịch ngoài khung).

- [ ] **Step 1: Viết test (đỏ).** Đơn vị `gridMath.test.ts`: `windowOf([], {8,21})` = `{8,21}`; có lịch 07:30–08:00 và khung `{8,21}` → `startH` 7; có lịch kết thúc 21:30 → `endH` 22; không truyền `bounds` giữ 7–21 như cũ. E2E `describe('system settings take effect')` (`quanly_ha` đổi cài đặt qua trang Cài đặt hệ thống): *Thời lượng*: đặt khám 45 → mở "Tạo lịch hẹn" ở Lịch hẹn, dịch vụ mặc định Khám có thời lượng 45 phút; đổi dịch vụ sang Spa → 60 (hoặc số đã đặt); xác nhận một yêu cầu: ô thời lượng theo dịch vụ của yêu cầu; *Lưới lịch*: đặt giờ bắt đầu 09:00, kết thúc 18:00 → lịch ngày hiện nhãn giờ đầu tiên "09:00" (hoặc sớm hơn nếu hôm nay có lịch sớm hơn: chọn ngày không có lịch sớm); lịch hẹn ngoài khung vẫn hiện (khung nới); *Thanh toán*: tắt "QR ngân hàng" và "Chuyển khoản" → mở Thu tiền của một hóa đơn còn nợ (`inv-27` theo bộ mẫu; chọn hóa đơn có `remaining > 0`): chỉ có "Tiền mặt"; bỏ hết trừ "QR ngân hàng" → mặc định chọn QR; *Quá hạn*: đặt "Báo yêu cầu quá hạn sau" 1 giờ → danh sách yêu cầu có ít nhất một thẻ "Quá hạn" và chi tiết của thẻ đó cũng có; đặt 168 → số thẻ "Quá hạn" ít hơn hoặc bằng; Tổng quan nói số quá hạn trong thẻ "Yêu cầu cần xử lý" khi > 0; *Ngày lễ*: thêm hôm nay làm ngày lễ → lịch ngày hôm nay có nhãn "Ngày lễ" và ghi chú; "Tạo lịch hẹn" hôm nay giờ 18:30 thời lượng 60 → có dòng "Ngày lễ: bệnh viện làm đến 19:00." (cảnh báo, vẫn lưu được); giờ 17:30 thời lượng 30 → không có dòng; ngày thường không có dòng; *Mặc định khi cài đặt chưa đọc được*: kiểm bằng đơn vị (`enabledMethods([])`, `useAppSettings` mặc định ở Task 1/2).
- [ ] **Step 2: Build và chạy, thấy đỏ:** `npx vitest run src/features/staff/appointments` và `npm run build && npx playwright test e2e/giao-dien-nhan-vien-h.spec.ts --project=desktop-1440 -g "system settings take effect" --timeout=20000`. Expected: FAIL.
- [ ] **Step 3: Cài** theo Files. Nhãn "Quá hạn" dùng `MiniTag tone="orange"` có chữ (không chỉ màu). Nhãn ngày lễ ở lịch: `MiniTag` "Ngày lễ" kèm `title`/chữ ghi chú cho nhân viên (ghi chú chỉ nhân viên thấy).
- [ ] **Step 4: Chạy, thấy xanh:** các lệnh trên cộng cả file ba cỡ; chạy lại `e2e/giao-dien-nhan-vien-b.spec.ts`, `e2e/staff-b.spec.ts`, `giao-dien-nhan-vien-c.spec.ts` (lịch, hóa đơn, yêu cầu; lưới mặc định đổi từ 07 sang 08 nên sửa nhỏ các kiểm tra cũ về giờ đầu lưới, ghi sổ); `npm run typecheck && npm run lint && npm test`. Expected: PASS.
- [ ] **Step 5: Commit:** `feat: system settings take effect on the calendar, payments and requests`.

---

### Task 8: kiểu xem lịch (chờ nhánh dữ liệu), tài liệu, kiểm tra tổng

**Files:**
- Modify: `src/features/staff/appointments/CalendarPage.tsx`, `e2e/giao-dien-nhan-vien-h.spec.ts`, `docs/thiet-ke/QUYET-DINH.md` (R46), `PROGRESS.md`, `README.md`, `docs/tham-khao/bang-kiem-thu-nghiep-vu-2026-10-21.md`

**Interfaces:**
- Consumes: Task 1 (`viewFromPref`), Task 2 (`usePrefs`).
- Produces: Lịch hẹn mở không kèm `view` thì dùng `viewFromPref(prefs.appointments_view)`.

- [ ] **Step 1: Kiểm điều kiện.** `git fetch origin && git merge origin/claude/focused-pascal-rfxnnp`; chạy `grep -n "appointments_view" src/data/rules/staff-prefs.ts`. Nếu mặc định đã là `'day'`: làm Step 2 đến 5 đầy đủ. Nếu vẫn `'week'`: **không sửa thư mục dữ liệu**; ghi vào sổ `Task 8: Ruling: calendar view option not applied — data default still week, request open in PROGRESS`, bỏ Step 2 đến 4 của phần này, ghi rõ trong `PROGRESS.md` "Việc tiếp theo" và trong báo cáo cuối; các việc tài liệu và kiểm tra tổng vẫn làm.
- [ ] **Step 2: Viết e2e (đỏ).** `describe('calendar view option')`: mặc định (chưa chọn) Lịch hẹn mở kiểu Ngày; chọn "Tuần" ở Tùy chọn → mở Lịch hẹn không kèm `view` là Tuần; `?view=ngay` trên địa chỉ vẫn thắng; chọn lại "Ngày".
- [ ] **Step 3: Chạy, thấy đỏ.** Expected: FAIL (đang cố định Ngày).
- [ ] **Step 4: Cài** theo Interfaces; chạy lại e2e lịch cũ (`giao-dien-nhan-vien-b.spec.ts`, `staff-b.spec.ts`).
- [ ] **Step 5: Tài liệu.** R46 trong `QUYET-DINH.md` (trang Tùy chọn của tôi; chọn là lưu ngay; tác dụng từng tùy chọn; Doanh thu theo tùy chọn khoảng ngày; kỳ "30 ngày" mới; khối Nhắc việc, ngưỡng mẫu 2 ngày; cài đặt hệ thống đã áp dụng vào đâu; ngày lễ chỉ cảnh báo phía nhân viên; chưa làm: phía khách, phụ phí lễ, danh sách việc đầu tiên); `PROGRESS.md` (5D xong, việc tiếp theo 5E, mục "Việc nhỏ để lại"), `README.md` hàng trạng thái, mục "Tùy chọn và cài đặt có tác dụng (phần 5D giao diện)" ở bảng kiểm thử nghiệp vụ.
- [ ] **Step 6: Chạy toàn bộ:** `npm run verify` (chạy nền, khoảng 20 phút; không chạy Playwright khác song song). Expected: exit 0.
- [ ] **Step 7: Commit:** `feat: calendar view option; docs for part 5D`.

---

## Self-review

- **Phủ spec:** §3 trang tùy chọn → Task 3; §4 từng tùy chọn → Task 4 (giao diện, chuyển động), 5 (trang vào, số dòng, kỳ báo cáo), 6 (nhắc việc), 8 (kiểu lịch); §5 từng cài đặt → Task 7 (thời lượng, lưới, thanh toán, quá hạn, ngày lễ; ngưỡng báo hết và số ngày hết hạn đã có sẵn, Task 7 chỉ rà chữ ghi cứng "30 ngày"); §6 quyền và hai tab → Task 3, 5; §7 trợ năng → Task 3, 4; §8 cấu trúc → File structure; §9 kiểm thử → từng task; §10 không làm → không có task; §11 quyết định → Task 5 (Doanh thu theo tùy chọn), Task 6 (2 ngày), Task 8 (Ngày).
- **Chênh với spec (ghi sổ khi chạy):** thuộc tính giao diện đặt trên `<html>` (`data-staff-*`) thay vì trên khung `[data-zone="staff"]`, vì khung đó nằm ngoài `SessionProvider`; `PrefsProvider` đặt ở `src/app/prefs/` (thư mục của giao diện); "Luôn giảm" làm bằng ba lớp (context `useReducedMotion` thay thế, `MotionConfig`, CSS) vì `useReducedMotion` của thư viện không biết tùy chọn.
- **Nhất quán tên:** `landingPath`, `landingChoices`, `nudgeChoices`, `reportPeriod`, `viewFromPref`, `appearanceAttrs`, `hoursOf`, `minutesFor`, `enabledMethods`, `holidayMark`, `holidayNotice`, `nudgeLines`, `oldDrafts`, `toastWanted`, `usePrefs`, `usePageSize`, `useAppSettings` định nghĩa ở Task 1/2 và dùng đúng tên ở Task 3 đến 8.
- **Số quyết định tiếp theo:** R46.
