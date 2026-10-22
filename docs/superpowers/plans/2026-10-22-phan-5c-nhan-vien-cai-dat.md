# Phần 5C: Cài đặt, kế hoạch thực hiện

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm mục **Cài đặt** cho nhân viên với bốn trang con (Hồ sơ của tôi, Thông tin bệnh viện, Tài khoản nhân viên, Cài đặt hệ thống), và đổi màn Kho sang bốn quyền ghi mới.

**Architecture:** Chỉ lớp giao diện (`src/features/staff/settings/`, sửa nhỏ `stock/`, `shell/`, `app/`); dữ liệu qua `staff.team`, `staff.profile`, `staff.settings` (hợp đồng đã có, **không đổi**). Logic có điều kiện nằm trong hai tệp hàm thuần có test (`settingsView.ts`, `settingsForm.ts`). Mẫu dựng từ 4D/5A: hộp thoại mở với `version`, `ConflictError` → thông báo + đóng; lỗi `ValidationError.fields` gắn đúng ô.

**Tech Stack:** React 19, TypeScript, react-router (hash, route lồng), CSS Modules + tokens, Vitest, Playwright. Không thêm thư viện.

**Spec:** `docs/superpowers/specs/2026-10-22-phan-5c-nhan-vien-cai-dat-design.md`.

## Global Constraints

- Mọi chữ hiển thị bằng tiếng Việt; không "quý khách", không "lễ tân"; số, ngày, mã dùng class `.num`; **không dùng `—` trong chữ hiển thị mới**.
- R43: Linear 85% + Stripe 15%: nền phẳng, viền mảnh, một màu nhấn tím mận, **không gradient trong vùng dữ liệu**, nhãn viết thường; thẻ bo `--r-card`, ô và nút `--r-control`; không bốn thẻ giống nhau, không chấm trang trí.
- Quyền: Cài đặt cho mọi nhân viên; trang Tài khoản cần `staff.manage`; sửa Cài đặt hệ thống cần `settings.manage`; kiểm ở API **và** ẩn ở giao diện (`useSession().can`).
- Ghi dữ liệu gửi **`version` lúc mở hộp thoại / lúc đọc trang**; `ConflictError` → thông báo `saveError(e)`, đóng hộp thoại hoặc tải lại; lỗi trường lấy từ `ValidationError.fields`, không tự đặt lại câu.
- Câu cố định (chép nguyên): "Bạn không tắt được tài khoản của chính mình." · "Bạn đổi mật khẩu của mình ở Hồ sơ của tôi." · "Hãy báo cho họ; họ đổi lại ở Hồ sơ của họ." · "Chỉ Quản lý sửa được chức danh." · "Quyền ghi Kho cần thêm Xem kho." · "Ngày lễ bệnh viện vẫn làm nhưng chỉ đến 19:00. Khách vẫn đặt được, ngoài các khung giờ sau 19:00. Ghi chú chỉ nhân viên thấy." · "Các thay đổi sẽ áp dụng vào lịch, hóa đơn và yêu cầu ở bước kế tiếp."
- Thông tin bệnh viện đúng nguyên văn tài liệu dự án; chữ "24/24" chỉ gắn với Cấp cứu.
- Chuyển động một lần, 150 đến 450 ms, `prefers-reduced-motion` tắt; bàn phím; tương phản ≥ 4,5:1; 320 px không cuộn ngang.
- Không đổi `src/data/**`. Cần đổi hợp đồng thì dừng, ghi `PROGRESS.md` "Yêu cầu gửi nhánh kia".
- Commit tiêu đề tiếng Anh `feat:`/`test:`/`docs:`, không ghi tên model. Viết test trước. **Đọc kết quả test trước khi chạy `task-done`.**

## Review Focus

1. Hai luật bảo vệ tài khoản: chính mình không có nút tắt; bỏ vai Quản lý của Quản lý cuối cùng hiện nguyên câu lỗi của API, không ghi gì (Task 5).
2. Hai tab sửa cùng một tài khoản hoặc cùng Cài đặt hệ thống: tab sau nhận "vừa được người khác cập nhật", không ghi đè (Task 5, 6).
3. Đổi mật khẩu: sai mật khẩu hiện tại, mới trùng cũ, hai ô không khớp, mỗi lỗi đúng một ô; sau khi đổi, đăng nhập lại bằng mật khẩu mới được, mật khẩu cũ không (Task 3).
4. Cài đặt hệ thống nhập sai ("abc", 7 phút, giờ kết thúc cách bắt đầu dưới 4 giờ, bỏ hết phương thức thanh toán, ngày lễ trùng hoặc không có thật): lỗi đúng ô, không lưu gì, giữ nguyên chữ đã gõ (Task 1, 6).
5. Cấp hoặc thu quyền có hiệu lực ngay: người vừa bị thu quyền xem trang đó bị chặn ở lần mở kế tiếp, nút ghi biến mất (Task 4, 7).
6. Danh sách quyền ở 320 px: không cuộn ngang, ô tích có nhãn đủ (Task 5).

---

## File structure

`src/features/staff/settings/`: `settingsView.ts` · `settingsView.test.ts` · `settingsForm.ts` · `settingsForm.test.ts` · `SettingsLayout.tsx` · `HospitalPage.tsx` · `ProfilePage.tsx` · `TeamPage.tsx` · `TeamDialog.tsx` · `PermissionPicker.tsx` · `ResetPasswordDialog.tsx` · `TeamActiveDialog.tsx` · `SystemPage.tsx` · `HolidaysEditor.tsx` · `Settings.module.css`.
Sửa: `src/app/routes.ts`, `src/app/router.tsx`, `src/features/staff/index.tsx`, `src/features/staff/shell/StaffShell.tsx` (NAV, bỏ `PermsDialog`), `src/features/staff/stock/stockView.ts` + `.test.ts` + `StockPage.tsx` + `StockItemPage.tsx`, `e2e/manifest.ts`.
Test: `e2e/giao-dien-nhan-vien-g.spec.ts` (mới).

---

### Task 1: `settingsView.ts` và `settingsForm.ts`, hàm thuần

**Files:**
- Create: `settingsView.ts`, `settingsView.test.ts`, `settingsForm.ts`, `settingsForm.test.ts` (trong `src/features/staff/settings/`)

**Interfaces:**
- Consumes: `CAPS, CAP_LABEL, PRESETS, PRESET_LABEL, STOCK_WRITE_CAPS, type Cap, type PresetId` (`@/data/rules/capabilities`); `AppSettingsValues, AppSettingsPatch, Holiday, HolidayInput` (`@/data/staff`); `PaymentMethod` (`@/data/contracts/enums`).
- Produces (`settingsView.ts`):
  - `type CapGroup = { key: string; label: string; caps: Cap[] }`; `CAP_GROUPS: CapGroup[]` đúng sáu nhóm theo spec §5, thứ tự: "Yêu cầu và lịch", "Khách hàng", "Nội trú", "Hóa đơn và giá", "Kho", "Báo cáo và cài đặt". `stock.manage` nằm cuối nhóm "Kho".
  - `groupsFor(held: ReadonlySet<Cap>): CapGroup[]`: như `CAP_GROUPS` nhưng **bỏ `stock.manage` khi `held` không có nó**.
  - `inheritedCaps(presets: readonly PresetId[]): ReadonlySet<Cap>`: hợp các quyền của `PRESETS` theo vai.
  - `extraOf(selected: ReadonlySet<Cap>, presets: readonly PresetId[]): Cap[]`: quyền đã chọn mà vai chưa có, theo thứ tự `CAPS`.
  - `rolesText(presets: readonly PresetId[]): string` ("Quản lý, Bác sĩ"); `extraText(n: number): string` ("Không có" khi 0, "3 quyền thêm" khác).
  - `viewNote(selected: ReadonlySet<Cap>, presets: readonly PresetId[]): string | undefined`: có quyền ghi Kho (một trong `STOCK_WRITE_CAPS` hoặc `stock.manage`) mà không có `stock.view` (chọn hoặc theo vai) → "Quyền ghi Kho cần thêm Xem kho."
  - `type SystemDraft`: `{ calendar_start: string; calendar_end: string; default_duration_kham: string; default_duration_spa: string; stock_expiry_days: string; stock_default_min: string; request_overdue_hours: string; payment_methods: PaymentMethod[]; holidays: { date: string; note: string }[] }`; `draftOf(v: AppSettingsValues): SystemDraft`; `patchOf(v: AppSettingsValues, d: SystemDraft): AppSettingsPatch`: **chỉ gồm trường đã đổi** (số bằng giá trị cũ thì bỏ; `payment_methods` so theo tập; `holidays` so theo ngày+ghi chú, gửi cả danh sách khi đổi, ghi chú trống bỏ); số đọc bằng `parseWhole` (không đọc được → `Number.NaN` để API báo đúng ô).
  - `sortHolidays<T extends { date: string }>(list: T[]): T[]` (theo ngày tăng dần, không đổi mảng gốc).
- Produces (`settingsForm.ts`): `parseWhole(raw: string): number | undefined` (số nguyên không âm; khoảng trắng hai đầu ok; "7,5", "-3", "1e3", "", "abc" → `undefined`); `isTime(raw: string): boolean` (`HH:MM` 00:00 đến 23:59); `isRealDay(raw: string): boolean` (`YYYY-MM-DD` có thật, ví dụ `2026-02-30` sai).

- [ ] **Step 1: Viết test (đỏ)**: `settingsView.test.ts`: **mọi quyền trong `CAPS` xuất hiện đúng một lần trong `CAP_GROUPS`** (gộp tất cả `caps`, so với `CAPS`, không trùng không thiếu); `groupsFor(new Set())` không có `stock.manage` trong nhóm Kho còn `groupsFor(new Set(['stock.manage']))` có; `inheritedCaps(['spa'])` có `stock.view` và không có `stock.receive`; `extraOf(new Set(['stock.view','stock.receive','customers.view']), ['spa'])` = `['stock.receive']`; `rolesText(['quan_ly','bac_si'])` = "Quản lý, Bác sĩ"; `extraText(0)` = "Không có", `extraText(3)` = "3 quyền thêm"; `viewNote(new Set(['stock.receive']), ['quan_ly'])` = `undefined` (Quản lý có `stock.view` theo vai), `viewNote(new Set(['stock.receive']), [])` = câu cố định, `viewNote(new Set(['stock.view','stock.receive']), [])` = `undefined`; `patchOf`: không đổi gì → `{}`; đổi `calendar_end` → chỉ `{ calendar_end }`; "abc" ở `stock_expiry_days` → `Number.isNaN(patch.stock_expiry_days)`; đổi thứ tự `payment_methods` nhưng cùng tập → bỏ; thêm một ngày lễ → `holidays` gồm cả danh sách; ghi chú rỗng không có khóa `note`; `sortHolidays` giữ mảng gốc. `settingsForm.test.ts`: các ca của `parseWhole`, `isTime` ("07:00", "24:00" sai, "7:00" sai), `isRealDay`.
- [ ] **Step 2: Chạy, thấy đỏ**: `npx vitest run src/features/staff/settings`. Expected: FAIL (module chưa có).
- [ ] **Step 3: Cài hai tệp** theo Interfaces.
- [ ] **Step 4: Chạy, thấy xanh**: cùng lệnh; `npm run typecheck && npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit**: `feat: settings view and form helpers`.

---

### Task 2: mục Cài đặt, khung bốn trang con, Thông tin bệnh viện

**Files:**
- Create: `SettingsLayout.tsx`, `HospitalPage.tsx`, `Settings.module.css`
- Modify: `src/app/routes.ts` (`nv.settings: '/nv/cai-dat'`, `settingsProfile`, `settingsHospital`, `settingsTeam`, `settingsSystem`: `/nv/cai-dat/ho-so`, `/benh-vien`, `/tai-khoan`, `/he-thong`; bí danh `'nv-cai-dat'`); `src/app/router.tsx` (route lồng `cai-dat`: layout `StaffSettings`, con: `index` chuyển tới `ho-so`, bốn trang với `title` "Hồ sơ của tôi" / "Thông tin bệnh viện" / "Tài khoản nhân viên" (`cap: 'staff.manage'`) / "Cài đặt hệ thống"; trang chưa làm trỏ tạm vào một `Placeholder`? **không**: chỉ đăng ký trang khi nó có); `src/features/staff/index.tsx`; `StaffShell.tsx` NAV (`{ key: 'settings', to: paths.nv.settings, label: 'Cài đặt', icon: 'settings' }` cuối danh sách, không `cap`); `e2e/manifest.ts` (`cai-dat-benh-vien`)
- Test: `e2e/giao-dien-nhan-vien-g.spec.ts` (mới)

**Interfaces:**
- Consumes: `staff.settings.hospital()`; `useSession().can`; `PageHeader, LoadingBlocks, PageProblem` (`../ui`); `AppNavLink` (`@/app/nav`).
- Produces: `SettingsLayout()` (đầu trang "Cài đặt", cột `nav aria-label="Cài đặt"` gồm các liên kết trang con **chỉ gồm trang người đó có quyền**, `Outlet`); `HospitalPage()`; trang con khác được thêm ở các task sau (Task 2 chỉ đăng ký `benh-vien` và `index`; `ho-so` đăng ký ở Task 3, `tai-khoan` ở Task 5, `he-thong` ở Task 6); `index` chuyển tới `ho-so` **từ Task 3** (ở Task 2 chuyển tạm tới `benh-vien`, ghi sổ).

- [ ] **Step 1: Viết e2e (đỏ)** (`desktop-1440`, `phone-390`, `phone-320`): `describe('settings shell and hospital')`: *Mục Cài đặt cho cả ba vai*: `quanly_ha`, `bacsi_mai`, `spa_ngocanh` đều thấy liên kết "Cài đặt" trong `nav "Khu nhân viên"` (kiểm trên màn ≥ 768 px; điện thoại kiểm trong tờ "Thêm" nếu liên kết không nằm trong thanh dưới); *Thông tin bệnh viện*: `/nv/cai-dat/benh-vien` có tên "Bệnh viện Thú y Lê Sơn", địa chỉ "101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội", liên kết "097 355 51 05" với `href="tel:+84973555105"`, "08:00–21:00" kèm "không nghỉ trưa", "Cấp cứu" kèm "24/24" (và chữ "24/24" **chỉ** cạnh Cấp cứu: `main` có đúng một lần "24/24"), "Bác sĩ trưởng Lê Thái Sơn", câu "Nội dung này chỉ để xem. Cần sửa, báo bên làm hệ thống."; *Cột trang con*: `quanly_ha` thấy trang "Thông tin bệnh viện" và (từ Task 5/6) các trang khác; `bacsi_mai` không thấy liên kết "Tài khoản nhân viên"; vào thẳng `/nv/cai-dat/tai-khoan` bằng `bacsi_mai` thấy "Mục này dành cho người có quyền phù hợp" (kiểm ở Task 5); `/nv/cai-dat` chuyển đi; `@narrow`: `fitsDevice`.
- [ ] **Step 2: Build và chạy, thấy đỏ**: `npm run build && npx playwright test e2e/giao-dien-nhan-vien-g.spec.ts --project=desktop-1440 --timeout=15000`. Expected: FAIL.
- [ ] **Step 3: Cài** theo "Files": cột trang con ≥ 900 px dọc bên trái, dưới đó xếp ngang có xuống dòng; liên kết đang mở có `aria-current="page"`; `HospitalPage` dùng định nghĩa danh sách (`dl`) gọn, hotline là `AppLink`/thẻ `a` `tel:`.
- [ ] **Step 4: Chạy, thấy xanh**: build lại, chạy cả file ba cỡ; `npm run typecheck && npm run lint && npm test`. Expected: PASS (đọc kết quả trước khi `task-done`).
- [ ] **Step 5: Commit**: `feat: settings area with the hospital page`.

---

### Task 3: Hồ sơ của tôi, bỏ hộp thoại "Quyền của tôi" cũ

**Files:**
- Create: `ProfilePage.tsx`
- Modify: `router.tsx` (đăng ký `ho-so`, `index` chuyển tới `ho-so`), `index.tsx`, `StaffShell.tsx` (bỏ `PermsDialog` và trạng thái `perms`; hai chỗ "Quyền của tôi" ở menu tài khoản và tờ "Thêm" điều hướng tới `paths.nv.settingsProfile`), `Settings.module.css`
- Test: `e2e/giao-dien-nhan-vien-g.spec.ts`

**Interfaces:**
- Consumes: `staff.profile.get()`, `.updateName(name)`, `.changePassword({ current, next, next2 })`; `groupsFor`, `CAP_LABEL` (Task 1); `useSession`; `Field, Input, Button, useToast`; `FormError, saveError`.
- Produces: `ProfilePage()`: ba khối: *Thông tin* (tên đăng nhập, tên hiển thị sửa được kèm nút **Lưu tên**, chức danh chỉ xem kèm "Chỉ Quản lý sửa được chức danh.", nhóm quyền bằng `rolesText`); *Đổi mật khẩu* (ba ô `type="password"` có nhãn "Mật khẩu hiện tại", "Mật khẩu mới", "Nhập lại mật khẩu mới", mỗi ô có nút hiện/ẩn tên "Hiện mật khẩu"/"Ẩn mật khẩu", nút **Đổi mật khẩu**; lỗi API gắn `current`/`next`/`next2`; thành công: toast "Đã đổi mật khẩu.", xóa ba ô); *Quyền của tôi* (các quyền đang có, gom bằng `groupsFor(held)` chỉ nhóm có quyền, mỗi quyền là một dòng chữ có biểu tượng tích).

- [ ] **Step 1: Viết e2e (đỏ)**: `describe('profile')` (`bacsi_mai`): sửa tên "Bác sĩ Mai Linh" → toast, tên mới hiện ở đầu trang (menu tài khoản) và còn sau khi tải lại; tên trống → lỗi của API dưới ô; *Mật khẩu*: sai hiện tại → lỗi ở ô "Mật khẩu hiện tại"; mới trùng cũ → lỗi ở "Mật khẩu mới"; hai ô khác nhau → lỗi ở "Nhập lại mật khẩu mới"; không có lỗi nào làm đổi mật khẩu (đăng xuất và đăng nhập lại bằng `leson-demo` vẫn được); đổi thành công sang `mat-khau-moi-123` → toast, ba ô trống; đăng xuất, đăng nhập bằng mật khẩu mới được, bằng `leson-demo` không được (đăng nhập qua giao diện trang `/dang-nhap/nhan-vien`); nút hiện/ẩn đổi `type` của ô; chức danh không có ô nhập; *Quyền của tôi*: bấm "Quyền của tôi" ở menu tài khoản → tới `/nv/cai-dat/ho-so`, không còn hộp thoại; `bacsi_mai` thấy "Xem lịch hẹn" và không thấy "Xem doanh thu"; nhóm hiện theo tên ("Nội trú"); `@narrow` vừa; axe.
- [ ] **Step 2: Build và chạy, thấy đỏ**: `npx playwright test e2e/giao-dien-nhan-vien-g.spec.ts --project=desktop-1440 -g profile --timeout=15000`. Expected: FAIL.
- [ ] **Step 3: Cài** theo "Files".
- [ ] **Step 4: Chạy, thấy xanh**: build lại, cả file ba cỡ; `npm run typecheck && npm run lint && npm test`; chạy lại `e2e/staff-a.spec.ts`/`giao-dien-nhan-vien-a.spec.ts` nếu có test dựa vào "Quyền của tôi" (`grep -rn "Quyền của tôi" e2e`) và sửa nhỏ, ghi sổ. Expected: PASS.
- [ ] **Step 5: Commit**: `feat: staff profile page; permissions list moves into it`.

---

### Task 4: màn Kho đổi sang bốn quyền ghi

**Files:**
- Modify: `src/features/staff/stock/stockView.ts`, `stockView.test.ts`, `StockPage.tsx`, `StockItemPage.tsx`, `e2e/giao-dien-nhan-vien-e.spec.ts` (chỉ khi cần, nhỏ)
- Test: `stockView.test.ts`, `e2e/giao-dien-nhan-vien-g.spec.ts`

**Interfaces:**
- Consumes: `Cap` (`@/data/rules/capabilities`).
- Produces: `stockCaps(can): { view: boolean; receive: boolean; issue: boolean; adjust: boolean; items: boolean }`: mỗi quyền ghi **và** `view`; `can('stock.receive')` đã đúng cho cả người có quyền gộp (phía dữ liệu mở rộng), nên không kiểm riêng `stock.manage`.

- [ ] **Step 1: Viết test (đỏ)**: đơn vị `stockCaps`: chỉ `stock.view` → `{ view: true, mọi quyền ghi: false }`; `stock.view` + `stock.issue` → chỉ `issue` đúng; chỉ `stock.receive` (thiếu `view`) → mọi thứ sai (kể cả `receive`); đủ năm → đúng cả. E2E (`describe('stock rights')`): `bacsi_mai` (chỉ xem Kho theo vai) vào `/nv/kho/stock-1` thấy tồn nhưng **không** có nút "Nhập thêm", "Xuất ra", "Kiểm kê", "Sửa thông tin", "Ngừng dùng"; vào `/nv/kho` không có nút "Thêm món"; `spa_ngocanh` cũng vậy; `quanly_ha` có đủ năm nút.
- [ ] **Step 2: Chạy, thấy đỏ**: `npx vitest run src/features/staff/stock` và `npm run build && npx playwright test e2e/giao-dien-nhan-vien-g.spec.ts -g "stock rights" --project=desktop-1440 --timeout=15000`. Expected: FAIL (hàm cũ trả `{ view, manage }`; Bác sĩ hiện đã thấy các nút nếu `manage` gộp, hoặc chưa tùy dữ liệu: ghi lại thực tế).
- [ ] **Step 3: Cài**: đổi `stockCaps`; `StockPage` dùng `items` cho nút Thêm món; `StockItemPage` dùng `receive`, `issue`, `adjust`, `items` cho từng nút (nút **Ngừng dùng/Dùng lại** và **Sửa thông tin** cần `items`); dòng "Món đã ngừng dùng…" vẫn chỉ hiện khi cần. Hộp thoại giữ nguyên.
- [ ] **Step 4: Chạy, thấy xanh**: các lệnh trên; `npx playwright test e2e/giao-dien-nhan-vien-e.spec.ts` (ba cỡ) vẫn xanh; `npm run typecheck && npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit**: `feat: stock screens follow the four stock write rights`.

---

### Task 5: Tài khoản nhân viên

**Files:**
- Create: `TeamPage.tsx`, `TeamDialog.tsx`, `PermissionPicker.tsx`, `ResetPasswordDialog.tsx`, `TeamActiveDialog.tsx`
- Modify: `router.tsx` (đăng ký `tai-khoan`), `index.tsx`, `Settings.module.css`, `e2e/manifest.ts` (`cai-dat-tai-khoan` as `quanly_ha`)
- Test: `e2e/giao-dien-nhan-vien-g.spec.ts`

**Interfaces:**
- Consumes: `staff.team.list/create/update/setActive/resetPassword`; Task 1 (`groupsFor`, `inheritedCaps`, `extraOf`, `rolesText`, `extraText`, `viewNote`); `PRESET_LABEL`, `CAP_LABEL`; `DataTable, Dialog, Field, Input, Checkbox, Button, useToast`; `useStockSave`-kiểu xử lý `ConflictError` (viết gọn trong từng hộp thoại, như `StockItemDialog`).
- Produces: `TeamPage()`; `TeamDialog({ open, onClose, row? }: { open: boolean; onClose: () => void; row?: StaffAdminRow })` (thêm khi không có `row`); `PermissionPicker({ presets, selected, onChange, held }: { presets: PresetId[]; selected: ReadonlySet<Cap>; onChange: (next: Set<Cap>) => void; held: ReadonlySet<Cap> })`: mỗi nhóm một `fieldset` có `legend`, mỗi quyền một `Checkbox` có nhãn `CAP_LABEL`; quyền theo vai tích sẵn, `disabled`, kèm chữ "Có theo vai"; dòng nhắc `viewNote` dưới nhóm Kho; `ResetPasswordDialog({ open, onClose, row })`; `TeamActiveDialog({ open, onClose, row })`.

- [ ] **Step 1: Viết e2e (đỏ)** (`quanly_ha`; ba cỡ khi cần): `describe('staff accounts')`:
  - *Bảng*: có bốn tài khoản mẫu, `quanly_ha` có nhãn "Bạn"; cột Vai, "Quyền thêm" ("Không có"), Trạng thái "Đang dùng"; `bacsi_mai` vào `/nv/cai-dat/tai-khoan` thấy "Mục này dành cho người có quyền phù hợp" và không có liên kết trang đó ở cột trang con.
  - *Thêm nhân viên*: tên đăng nhập "bacsi_lan", mật khẩu "mat-khau-123", tên "Bác sĩ Lan", chức danh "Bác sĩ nội trú", vai Bác sĩ → toast, dòng mới có trong bảng; đăng nhập bằng tài khoản mới được; tên đăng nhập trùng ("bacsi_mai") → lỗi API ở ô tên đăng nhập; không chọn vai nào → lỗi API đúng chỗ.
  - *Sửa vai và quyền lẻ*: sửa `spa_ngocanh`: các quyền của vai Spa hiện tích sẵn khóa kèm "Có theo vai"; tích thêm "Nhập thêm kho" mà **không** có "Xem kho" khi vai trống (kiểm bằng cách thử tài khoản mới không vai? tài khoản phải có vai: thay bằng kiểm dòng nhắc trên một tài khoản mà vai không có `stock.view`: tạo "Bác sĩ Lan" có `stock.view` theo vai Bác sĩ nên không có nhắc; dòng nhắc kiểm bằng test đơn vị `viewNote`, ở e2e chỉ kiểm không hiện nhắc khi đã có `stock.view`); lưu → bảng ghi "1 quyền thêm".
  - *Đặt lại mật khẩu*: cho `bacsi_duc`: có câu "Hãy báo cho họ; họ đổi lại ở Hồ sơ của họ."; đặt "mat-khau-moi-456" → toast; đăng nhập lại bằng `bacsi_duc` / mật khẩu mới được; với dòng của chính mình **không có** nút đặt lại, có chữ "Bạn đổi mật khẩu của mình ở Hồ sơ của tôi."
  - *Tắt / bật*: tắt `spa_ngocanh` có hỏi và nói hậu quả; dòng xuống cuối với "Đã tắt"; người đó không đăng nhập được; bật lại không hỏi; **chính mình không có nút tắt**, có "Bạn không tắt được tài khoản của chính mình."
  - *Quản lý cuối cùng*: sửa chính `quanly_ha`, bỏ chọn vai Quản lý (giữ vai Bác sĩ) → lưu → hiện nguyên câu lỗi của API (đọc từ phản hồi, kiểm có chữ "Quản lý"), bảng không đổi.
  - *Xung đột*: mở sửa `bacsi_mai` ở tab A, sửa chức danh ở tab B và lưu, lưu ở tab A → "vừa được người khác cập nhật", hộp thoại đóng, chức danh của tab B hiện.
  - *Hiệu lực ngay*: cấp `reports.operations` cho `bacsi_duc` (quyền lẻ nhóm "Báo cáo và cài đặt"); mở `bacsi_duc` thấy liên kết "Báo cáo"; thu lại → vào `/nv/bao-cao` bị chặn.
  - `@narrow` 320 px: bảng thành thẻ, hộp thoại sửa với đủ nhóm quyền vừa chiều rộng (`fitsDevice`); axe với hộp thoại sửa mở.
- [ ] **Step 2: Build và chạy, thấy đỏ**: `npm run build && npx playwright test e2e/giao-dien-nhan-vien-g.spec.ts -g "staff accounts" --project=desktop-1440 --timeout=15000`. Expected: FAIL.
- [ ] **Step 3: Cài** theo Interfaces: bảng `DataTable`; `TeamDialog` giữ `version` lúc mở, vai là ba ô tích (`Checkbox`), `extra_capabilities` = `extraOf(selected, presets)`; đổi vai thì cập nhật tích sẵn; `useQuery(() => staff.team.list(), [])` tự làm mới sau ghi; sau khi sửa chính mình, phiên tự cập nhật (SessionProvider theo `system.rev`).
- [ ] **Step 4: Chạy, thấy xanh**: build lại, cả file ba cỡ; `npm run typecheck && npm run lint && npm test`. Expected: PASS.
- [ ] **Step 5: Commit**: `feat: staff accounts page with roles and per-person rights`.

---

### Task 6: Cài đặt hệ thống và ngày lễ

**Files:**
- Create: `SystemPage.tsx`, `HolidaysEditor.tsx`
- Modify: `router.tsx` (đăng ký `he-thong`), `index.tsx`, `Settings.module.css`, `e2e/manifest.ts` (`cai-dat-he-thong`)
- Test: `e2e/giao-dien-nhan-vien-g.spec.ts`

**Interfaces:**
- Consumes: `staff.settings.get()`, `.update(version, patch)` → `AppSettings` (trả bản sau khi đổi); Task 1 (`draftOf`, `patchOf`, `sortHolidays`, `isTime`, `isRealDay`); `PAYMENT_METHOD_LABEL` (`@/data/contracts/enums`); `formatDateVi`.
- Produces: `SystemPage()`: một form, một nút **Lưu cài đặt** (khóa khi `patchOf` rỗng, hoặc khi không có `settings.manage`: người đó thấy các giá trị dạng chữ trong danh sách định nghĩa, không có ô nhập), gửi `version` lúc đọc; lỗi theo tên trường gắn đúng ô (`calendar_end`, `default_duration_kham`, `payment_methods`, `holidays`…); thành công: toast "Đã lưu cài đặt."; `ConflictError`: toast, tải lại giá trị mới. `HolidaysEditor({ value, onChange, error }: { value: { date: string; note: string }[]; onChange: (next: { date: string; note: string }[]) => void; error?: string })`: danh sách sắp theo ngày (ngày kiểu Việt, ghi chú, nút **Xóa** có tên "Xóa ngày lễ {ngày}") và dòng thêm (ô ngày, ô ghi chú không bắt buộc, nút **Thêm**; ngày không có thật báo ngay dưới ô bằng `isRealDay`, chưa gọi API). Khối cuối "Quy định cố định" liệt kê `fixedRules`. Câu "Các thay đổi sẽ áp dụng vào lịch, hóa đơn và yêu cầu ở bước kế tiếp." ở đầu trang.

- [ ] **Step 1: Viết e2e (đỏ)** (`describe('system settings')`): *Quản lý*: thấy các nhóm "Giờ và lịch", "Kho", "Thanh toán", "Yêu cầu đặt lịch", "Ngày lễ", "Quy định cố định"; nút Lưu khóa lúc chưa đổi; đổi "Thời lượng mặc định Khám" 30 → 45 → Lưu → toast, tải lại vẫn 45; *Lỗi đúng ô, giữ chữ đã gõ, không lưu gì*: phút "abc", phút 7 (không bội của 5), "Giờ kết thúc" 08:00 khi bắt đầu 07:00 (gần dưới 4 giờ), bỏ hết phương thức thanh toán, "Báo sắp hết hạn trước" 0; mỗi lỗi hiện câu của API (kiểm có chữ, không `undefined`); sau lỗi, tải lại trang: giá trị cũ còn nguyên; *Ngày lễ*: thêm `2026-12-25` kèm ghi chú "Noel" → Lưu → hiện trong danh sách theo thứ tự ngày cùng một ngày thêm trước đó (thêm 2026-11-20 sau, danh sách vẫn đúng thứ tự); thêm trùng ngày → lỗi; ngày `2026-02-30` → lỗi ngay dưới ô, chưa lưu; xóa một ngày → Lưu → mất; câu giải thích 19:00 có mặt; *Chỉ xem*: `bacsi_mai` vào trang thấy giá trị dạng chữ, không có ô nhập và nút Lưu, không có phần thêm ngày lễ; *Xung đột*: hai tab, tab A đổi và lưu, tab B (mở trước đó) đổi và lưu → "vừa được người khác cập nhật" và giá trị của tab A hiện; `fixedRules` hiện và không sửa được; `@narrow` vừa chiều rộng; axe; bàn phím (Tab qua các ô, Enter ở ô ngày lễ thêm ngày).
- [ ] **Step 2: Build và chạy, thấy đỏ**: `npm run build && npx playwright test e2e/giao-dien-nhan-vien-g.spec.ts -g "system settings" --project=desktop-1440 --timeout=15000`. Expected: FAIL.
- [ ] **Step 3: Cài** theo Interfaces.
- [ ] **Step 4: Chạy, thấy xanh**: build lại, cả file ba cỡ; `npm run typecheck && npm run lint && npm test`. Expected: PASS.
- [ ] **Step 5: Commit**: `feat: system settings page with holidays`.

---

### Task 7: bài "chỉ có quyền xem" đã hẹn, tài liệu, kiểm tra tổng

**Files:**
- Modify: `e2e/giao-dien-nhan-vien-g.spec.ts`, `docs/thiet-ke/QUYET-DINH.md` (R45), `PROGRESS.md`, `README.md`, `docs/tham-khao/bang-kiem-thu-nghiep-vu-2026-10-21.md` (mục Cài đặt)

**Interfaces:** dùng màn Tài khoản (Task 5) làm công cụ cấp quyền trong e2e.

- [ ] **Step 1: Viết e2e (đỏ hoặc xanh ngay; ghi lại thực tế)** (`describe('granting rights end to end')`): *Báo cáo không có tiền*: `quanly_ha` cấp `reports.operations` cho `bacsi_duc` (không cấp `reports.revenue`) → `bacsi_duc` mở `/nv/bao-cao` thấy trang, **không có khối "Doanh thu trong kỳ"**, dòng "yêu cầu đang chờ xử lý" (nếu có) và dòng kho là **chữ không có liên kết** khi thiếu `requests.handle` (Bác sĩ mặc định không có `requests.handle`) trong khi dòng kho có liên kết (Bác sĩ có `stock.view`); *Kho theo từng việc*: `quanly_ha` cấp chỉ `stock.receive` cho `spa_ngocanh` → Spa thấy "Nhập thêm" và **không** thấy "Xuất ra", "Kiểm kê", "Sửa thông tin", "Thêm món"; cấp thêm `stock.issue` → thấy "Xuất ra"; Bác sĩ chỉ xem. Nếu phát hiện ca nào chưa đúng ở màn Kho hay Báo cáo, sửa trong cùng task, test đỏ trước.
- [ ] **Step 2: Chạy**: build lại; `npx playwright test e2e/giao-dien-nhan-vien-g.spec.ts -g "granting rights" --timeout=20000`. Expected: PASS (hoặc sửa rồi PASS).
- [ ] **Step 3: Tài liệu**: R45 trong `QUYET-DINH.md` (Cài đặt: bốn trang con; quyền lẻ gom nhóm, tích sẵn theo vai; hai luật bảo vệ; đặt lại mật khẩu do Quản lý nhập; Cài đặt hệ thống chỉ sửa và lưu, áp dụng ở 5D; ngày lễ làm đến 19:00, không phụ phí lễ; màn Kho theo bốn quyền; không đổi dữ liệu); `PROGRESS.md` (5C xong, việc tiếp theo 5D kèm danh sách cài đặt cần áp dụng và "Việc nhỏ để lại"), `README.md` hàng trạng thái; mục "Cài đặt (phần 5C giao diện)" ở bảng kiểm thử nghiệp vụ.
- [ ] **Step 4: Chạy toàn bộ**: `npm run verify`. Expected: exit 0 (ghi số test; lỗi phía khách do giờ 00:00 đến 08:00 là lỗi cũ đã biết).
- [ ] **Step 5: Commit**: `feat: end-to-end rights checks; docs for part 5C`.

---

## Self-review

- **Phủ spec:** §2 lối vào → Task 2; §3 Hồ sơ → Task 3; §4 Bệnh viện → Task 2; §5 Tài khoản → Task 5 (+ Task 1 cho nhóm quyền); §6 Hệ thống → Task 6; §7 Kho → Task 4; §8 cấu trúc → File structure; §9 trợ năng → từng task; §10 kiểm thử → từng task + Task 7; §11 chờ chủ dự án → Task 7 `PROGRESS.md`.
- **Chênh với spec (ghi sổ khi chạy):** chuyển `index` tạm tới `benh-vien` ở Task 2 (trang Hồ sơ chưa có), tới `ho-so` từ Task 3; dòng nhắc `viewNote` kiểm ở test đơn vị vì tài khoản phải có ít nhất một vai.
- **Nhất quán tên:** `groupsFor`, `inheritedCaps`, `extraOf`, `viewNote`, `draftOf`, `patchOf`, `stockCaps` (năm khóa) định nghĩa ở Task 1/4 và dùng đúng tên ở Task 5 đến 7.
- **Số quyết định tiếp theo:** R45.
