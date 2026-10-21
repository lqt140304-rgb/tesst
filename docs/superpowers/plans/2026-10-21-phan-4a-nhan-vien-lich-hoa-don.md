# Phần 4A — Khu nhân viên: nền chung, Lịch hẹn, Hóa đơn — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khu nhân viên có nền chung cùng họ với khu khách; Lịch hẹn có lưới giờ (tuần/ngày), tìm nhanh và khung chi tiết bên phải; Hóa đơn soạn bên trái với bản xem trước bên phải.

**Architecture:** Giữ nguyên hợp đồng dữ liệu và logic ghi (đổi/hủy lịch, lưu/phát hành hóa đơn). Tách lưới lịch khỏi `CalendarPage.tsx` (tính toán thuần có test trong `gridMath.ts`), thay hộp thoại bằng `AppointmentPanel` trong `MasterDetail`; hóa đơn dùng `InvoiceSheet` của khách làm bản xem trước qua `draftToSheet`.

**Tech Stack:** React 19, TypeScript, Vite, react-router (hash), motion, CSS Modules, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-21-phan-4a-nhan-vien-lich-hoa-don-design.md` (cha: `docs/superpowers/specs/2026-10-20-lam-lai-giao-dien-design.md`). Bảng mẫu: `docs/tham-khao/mau-giao-dien/04-nv-lich-hen-hoa-don.webp`.

## Global Constraints

- Mọi chữ hiển thị tiếng Việt; khách là "bạn", bệnh viện "Lê Sơn"; không "quý khách", không "lễ tân"; không "Hoàn thành" cho lịch hẹn.
- Lịch hẹn chỉ Đã hẹn / Đã hủy (+ "Đã qua"); không check-in, không nút "Xác nhận" trên lịch hẹn (R8).
- Dòng hóa đơn chỉ lấy từ bảng giá; mục `active: false` không hiện trong khung thêm; thuốc/vật tư/thủ thuật điều trị gộp thành "Thuốc và vật tư điều trị" cho khách (R7).
- Thanh toán tại quầy; nhãn "Đã lưu" chỉ sau khi lưu thành công; lỗi giữ dữ liệu nhập.
- Quyền: ẩn nút ở giao diện bằng `useSession().can(...)` và API đã kiểm tra; lấy hồ sơ bé (`staff.customers.get`) chỉ khi `can('customers.view')`.
- Số, tiền, ngày giờ, mã, điện thoại dùng class `.num` (Be Vietnam Pro), nhưng **không** đặt `.num` (nowrap) lên dòng dài ghép nhiều thứ.
- Chuyển động: 150–450 ms, dịch chuyển 8–12 px, không nảy, tôn trọng `prefers-reduced-motion`; điện thoại 320 px không cuộn ngang; tương phản ≥ 4,5:1; điều khiển bằng bàn phím được.
- Màu/chữ qua biến trong `src/styles/tokens.css`; không thêm thư viện; không đổi `src/data/**` (nhánh dữ liệu sở hữu).
- Giao diện chỉ gọi dữ liệu qua `@/data/staff`; viết code giống code xung quanh.
- Commit tiêu đề tiếng Anh `feat:`/`fix:`/`test:`/`docs:`; **thân commit kết thúc bằng hai dòng** `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` và `Claude-Session: https://claude.ai/code/session_013xgtFbNtYrgX8b1A7NpkL4`. Không ghi tên model vào code/tài liệu.
- Chạy e2e: `npm run build && npx playwright test <file> -g "<tên>" --project=desktop-1440 --project=phone-390` (thêm `--project=phone-320` cho bài `@narrow`). Unit: `npx vitest run <file>`.

## Review Focus

Các trường hợp thiết kế không nêu nhưng dễ gặp; mỗi dòng có bài kiểm tra ở nhiệm vụ nêu trong ngoặc:

1. Hai lịch cùng giờ trong một cột ngày: đứng cạnh nhau, đều bấm được, không đè lên nhau (T2, T3).
2. Lịch ngoài khung 07:00–21:00 (ví dụ 06:30 hoặc 21:30): lưới nới khung để vẫn thấy, không bị cắt (T2, T3).
3. Tìm bằng số điện thoại gõ có khoảng trắng/đầu 0 hoặc +84 ("097 355") khớp lịch của khách đó (T2).
4. `?lich=` trỏ tới mã không có (hoặc đã hủy khi đang ẩn lịch hủy): khung báo "Không tìm thấy lịch hẹn này." hoặc vẫn hiện lịch đã hủy, không trắng trang (T4).
5. Hóa đơn nháp chưa có dòng hoặc có dòng giá linh hoạt chưa nhập giá: xem trước không hỏng (hiện "Chưa có dịch vụ" / dòng 0 đ), "Phát hành hóa đơn" bị khóa khi chưa có dòng (T6, T7).

---

### Task 1: Nền chung — đường dẫn và thẻ cho mọi trang nhân viên

**Files:**
- Modify: `src/features/staff/ui.tsx` (`Panel`), `src/features/staff/Staff.module.css` (`.panel`)
- Modify (thêm `crumbs`, bỏ `eyebrow` nút "‹ …"): `dashboard/DashboardPage.tsx`, `requests/RequestsPage.tsx`, `appointments/CalendarPage.tsx`, `customers/CustomersPage.tsx`, `customers/CustomerPage.tsx`, `web-accounts/AccountsPage.tsx`, `inpatient/BoardPage.tsx`, `inpatient/StayPage.tsx`, `invoices/InvoicesPage.tsx`, `invoices/InvoicePage.tsx`, `invoices/InvoiceNewPage.tsx`, `invoices/DraftEditor.tsx`, `pricelist/PricesPage.tsx`, `revenue/RevenuePage.tsx` (đều trong `src/features/staff/`)
- Create: `e2e/giao-dien-nhan-vien-a.spec.ts`

**Interfaces:**
- Consumes: `PageHeader` (`crumbs?: Crumb[]`), `paths.nv.*`.
- Produces: quy ước crumbs của khu nhân viên: trang gốc `[{ label: 'Tổng quan', to: paths.nv.home }, { label: '<Tên trang>' }]` (riêng Tổng quan không có crumbs); trang con `[{ Tổng quan }, { label: '<Trang cha>', to: <đường cha> }, { label: '<mã hoặc tên>' }]`.

- [ ] **Step 1: Write the failing test** trong `e2e/giao-dien-nhan-vien-a.spec.ts` (đầu tệp: `const main = (page) => page.locator('[data-zone="staff"] main')`):

```ts
test('every staff page has a breadcrumb and one h1, and fits the device @narrow', async ({ page }) => {
  for (const s of SCREENS.filter((x) => x.zone === 'staff' && x.slug !== 'khong-du-quyen' && x.slug !== 'tong-quan' && x.slug !== 'tong-quan-spa')) {
    await open(page, s.route, { as: s.as });
    await expect(main(page).getByRole('navigation', { name: 'Đường dẫn' }), s.slug).toBeVisible();
    await expect(main(page).getByRole('heading', { level: 1 }), s.slug).toHaveCount(1);
    await fitsDevice(page);
  }
});
```

- [ ] **Step 2: Run it to verify it fails** — Run: `npm run build && npx playwright test e2e/giao-dien-nhan-vien-a.spec.ts -g "breadcrumb" --project=desktop-1440`. Expected: FAIL (navigation "Đường dẫn" not found).
- [ ] **Step 3: Implement** — `Panel` dùng nền `--surface-card`, viền `--line-soft`, bo `--r-card`, đổ bóng `--sh-card` (cùng giá trị `.section` của `SectionCard`/khu khách); thêm `crumbs` theo quy ước trên cho từng trang, thay các nút `eyebrow` "‹ …" bằng crumbs (giữ `data-*`, nhãn nút khác nguyên vẹn). Trang `StayPage` / `CustomerPage` dùng nhãn cuối là tên bé/khách.
- [ ] **Step 4: Run test + staff specs cũ** — Run: `npm run build && npx playwright test e2e/giao-dien-nhan-vien-a.spec.ts e2e/staff-a.spec.ts e2e/staff-b.spec.ts e2e/giao-dien-chu.spec.ts --project=desktop-1440 --project=phone-390`. Expected: PASS (nếu test cũ phụ thuộc nút "‹ Hóa đơn" thì chỉnh nhỏ và ghi vào sổ).
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: staff pages get breadcrumbs and the shared card look"` (kèm hai dòng ghi nhận cuối thân commit).

### Task 2: Tính toán lưới và tìm nhanh (thuần, có test đơn vị)

**Files:**
- Create: `src/features/staff/appointments/gridMath.ts`, `gridMath.test.ts`, `search.ts`, `search.test.ts`

**Interfaces:**
- Consumes: `formatTimeVi`, `addDays` từ `@/lib/dates`; `StaffAppointment`.
- Produces (các task sau dùng đúng tên):
  - `export const START_H = 7, END_H = 21, ROW = 48` (30 phút = `ROW` px).
  - `export const minutesOf = (iso: string): number` (phút trong ngày theo giờ VN).
  - `export const mondayOf = (date: string): string`, `export const weekDays = (from: string): string[]` (7 ngày từ `from`).
  - `export type Placed = { id: string; top: number; height: number; col: number; cols: number }`.
  - `export function layoutColumn(items: Pick<StaffAppointment, 'id' | 'start_at' | 'duration_min'>[], startH: number): Placed[]` — `top = ((minutes − startH·60) / 30) · ROW`, `height = max(ROW − 4, duration/30·ROW − 4)`; lịch chồng giờ chia thành `cols` cột đều nhau, `col` từ 0.
  - `export function windowOf(items: Pick<StaffAppointment, 'start_at' | 'duration_min'>[]): { startH: number; endH: number }` — mặc định 7–21; nới xuống giờ tròn của lịch sớm nhất và lên giờ tròn kế tiếp của lịch muộn nhất (kể cả phần kết thúc).
  - `export function matchesAppointment(a: Pick<StaffAppointment, 'petName' | 'customerName' | 'customerPhone' | 'code'>, q: string): boolean` — rỗng → `true`; so khớp tên bé / tên khách / mã không dấu, không phân biệt hoa thường; chuỗi toàn số khớp số điện thoại bất kể khoảng trắng, đầu `0` hay `+84`.

- [ ] **Step 1: Write the failing tests** (`gridMath.test.ts`, `search.test.ts`):

```ts
// gridMath.test.ts — giờ trong ví dụ là giờ VN (+07:00)
const a = (id: string, hhmm: string, min = 30) => ({ id, start_at: `2026-10-21T${hhmm}:00+07:00`, duration_min: min });
it('places a 09:00 30-minute appointment at the right offset', () => {
  expect(layoutColumn([a('x', '09:00')], 7)).toEqual([{ id: 'x', top: 4 * ROW, height: ROW - 4, col: 0, cols: 1 }]);
});
it('puts two appointments at the same time side by side', () => {
  const p = layoutColumn([a('x', '10:00'), a('y', '10:00')], 7);
  expect(p.map((q) => [q.col, q.cols])).toEqual([[0, 2], [1, 2]]);
});
it('does not split appointments that only touch', () => {
  expect(layoutColumn([a('x', '10:00'), a('y', '10:30')], 7).every((q) => q.cols === 1)).toBe(true);
});
it('widens the window for early and late appointments', () => {
  expect(windowOf([a('x', '06:30'), a('y', '21:30', 60)])).toEqual({ startH: 6, endH: 23 });
  expect(windowOf([a('x', '09:00')])).toEqual({ startH: 7, endH: 21 });
});
// search.test.ts
const row = { petName: 'Bông', customerName: 'Nguyễn Thị Lan', customerPhone: '+84973555105', code: 'LH-0001' };
it.each(['bong', 'BÔNG', 'lan', 'nguyen thi', '097 355', '0973555105', '+84 973 555 105', '973555'])('matches %s', (q) => expect(matchesAppointment(row, q)).toBe(true));
it.each(['mit', '0912', 'zzz'])('does not match %s', (q) => expect(matchesAppointment(row, q)).toBe(false));
it('an empty query matches everything', () => expect(matchesAppointment(row, '  ')).toBe(true));
```

- [ ] **Step 2: Run to verify RED** — `npx vitest run src/features/staff/appointments`. Expected: FAIL (modules not found).
- [ ] **Step 3: Implement** both modules per the signatures (không phụ thuộc React). `layoutColumn`: sắp theo giờ bắt đầu, gom thành nhóm chồng giờ, `cols` = số cột tối thiểu của nhóm.
- [ ] **Step 4: Run to verify GREEN** — `npx vitest run src/features/staff/appointments`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: week/day grid math and appointment search`.

### Task 3: Lịch hẹn — lưới tuần, lưới ngày, tìm nhanh, thanh điều khiển

**Files:**
- Create: `src/features/staff/appointments/WeekGrid.tsx`, `DayGrid.tsx`
- Modify: `src/features/staff/appointments/CalendarPage.tsx` (rút gọn: toolbar, dữ liệu, chọn chế độ), `Calendar.module.css`
- Test: `e2e/giao-dien-nhan-vien-a.spec.ts`

**Interfaces:**
- Consumes: Task 2 (`layoutColumn`, `windowOf`, `weekDays`, `mondayOf`, `matchesAppointment`, hằng số), `StaffAppointment`.
- Produces: thuộc tính kiểm thử ổn định — cột ngày `[data-week-col][data-date="YYYY-MM-DD"]` (cột hôm nay có `aria-current="date"`); khối `[data-appointment][data-start="<ISO>"]` (mờ khi không khớp tìm: `data-dim="true"`); ô tìm `searchbox` tên "Tìm lịch hẹn"; vùng `role="status"` báo "N lịch khớp" / "Không có lịch nào khớp."; props `WeekGrid`/`DayGrid`: `{ …, items, query, onOpen(id), focusId }`.

- [ ] **Step 1: Write the failing tests** (desktop 1440):

```ts
test('week view: seven day columns, each block sits in its own day at its own time', async ({ page }) => {
  await open(page, '/nv/lich-hen?view=tuan', { as: 'quanly_ha' });
  const cols = main(page).locator('[data-week-col]');
  await expect(cols).toHaveCount(7);
  const blocks = main(page).locator('[data-week-col] [data-appointment]');
  expect(await blocks.count()).toBeGreaterThan(0);
  for (const b of await blocks.all()) {
    const start = (await b.getAttribute('data-start'))!;
    const colDate = await b.locator('xpath=ancestor::*[@data-week-col]').getAttribute('data-date');
    expect(colDate).toBe(new Date(start).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }));
  }
  await expect(main(page).locator('[data-week-col][aria-current="date"]')).toHaveCount(1);
});
test('search dims appointments that do not match and says how many do', async ({ page }) => {
  await open(page, '/nv/lich-hen?view=tuan', { as: 'quanly_ha' });
  await main(page).getByRole('searchbox', { name: 'Tìm lịch hẹn' }).fill('mit');
  await expect(main(page).getByRole('status').filter({ hasText: /lịch khớp/ })).toBeVisible();
  expect(await main(page).locator('[data-appointment][data-dim="true"]').count()).toBeGreaterThan(0);
  await main(page).getByRole('searchbox', { name: 'Tìm lịch hẹn' }).fill('zzzz');
  await expect(main(page).getByText('Không có lịch nào khớp.')).toBeVisible();
});
test('two appointments at the same time do not overlap in the day view', async ({ page }) => { /* tạo hai lịch cùng giờ bằng staff.appointments qua UI "Tạo lịch hẹn" hoặc dữ liệu seed; assert boundingBox của hai khối không giao nhau và cả hai click được */ });
test('an appointment outside 07:00–21:00 is still visible in the day view', async ({ page }) => { /* tạo lịch 06:30 bằng "Tạo lịch hẹn"; assert khối nằm trong khung cuộn (top ≥ 0) */ });
```
(Hai bài cuối: người làm chọn cách tạo dữ liệu gọn nhất — qua "Tạo lịch hẹn" của giao diện — và viết assertion như chú thích; không bỏ qua.)

- [ ] **Step 2: Run to verify RED** — Expected: FAIL (`data-week-col` / ô tìm chưa có).
- [ ] **Step 3: Implement** — `WeekGrid`: 7 cột ngày với trục giờ (`windowOf` của cả tuần), khối đặt theo `layoutColumn`, nền hôm nay + vạch "bây giờ", bấm tiêu đề cột → `onDay`; `DayGrid`: chuyển phần cột-theo-người-phụ-trách hiện có sang tệp riêng, dùng `layoutColumn` cho lịch chồng giờ; `CalendarPage`: hàng điều khiển theo spec §4 (Hôm nay · lùi/tiến · nhãn · Ngày|Tuần · ô tìm · người phụ trách · hiện lịch hủy), `query` truyền xuống, agenda điện thoại **ẩn** lịch không khớp, thông báo kết quả trong `role="status"`. Lịch có `rescheduleRequest` thêm chấm nhỏ có nhãn "Đang chờ đổi lịch" trên khối và một chấm trong dải 7 ngày trên điện thoại. Giữ `data-appointment` và `aria-label` của khối.
- [ ] **Step 4: Run + regression** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-a.spec.ts e2e/staff-a.spec.ts e2e/conflict.spec.ts e2e/a11y.spec.ts --project=desktop-1440 --project=phone-390`. Expected: PASS (các bài `conflict` về hộp thoại dời lịch vẫn dùng hộp thoại ở task này).
- [ ] **Step 5: Commit** — `feat: appointment week grid, day grid and quick search`.

### Task 4: Lịch hẹn — khung chi tiết bên phải thay hộp thoại

**Files:**
- Create: `src/features/staff/appointments/AppointmentPanel.tsx`
- Modify: `CalendarPage.tsx` (bọc lưới + agenda trong `MasterDetail`; `?lich=` chọn lịch), `Calendar.module.css`
- Delete: `src/features/staff/appointments/AppointmentDialog.tsx` (sau khi chuyển hết logic View/Move/Cancel)
- Modify (ghi vào sổ): `e2e/conflict.spec.ts` (bài "a stale reschedule dialog…": thay `getByRole('dialog')` bằng `main.locator('[data-detail]')`, đọc tên bé từ tiêu đề khung)
- Test: `e2e/giao-dien-nhan-vien-a.spec.ts`

**Interfaces:**
- Consumes: `MasterDetail` (`@/ui`, props `label, list, detail, detailKey, onBack, backLabel, focusDetail`), `StaffAppointment`, `staff.appointments.reschedule/cancel`, `staff.requests.keepAppointment`, `staff.customers.get` (chỉ khi `can('customers.view')`), `PetAvatar`.
- Produces: `AppointmentPanel({ apt: StaffAppointment; onClose(): void })`; trong khung: `<h2 tabIndex={-1}>` là tên bé (nhận tiêu điểm), vùng `[data-detail]` do `MasterDetail` cấp; nút theo tên cũ: "Đổi lịch", "Hủy lịch", "Tạo hóa đơn", "Mở để dời" / "Không đổi" cho yêu cầu đổi lịch.

- [ ] **Step 1: Write the failing tests:**

```ts
test('clicking an appointment opens the panel on the right with the pet, service and role-based buttons', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1024, 'side by side from 1024px');
  await open(page, '/nv/lich-hen?view=tuan', { as: 'quanly_ha' });
  const block = main(page).locator('[data-appointment]').filter({ visible: true }).first();
  await block.click();
  const panel = main(page).locator('[data-detail]');
  await expect(panel.getByRole('heading', { level: 2 })).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Đổi lịch' })).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Hủy lịch' })).toBeVisible();
  await expect(panel.getByText('Xác nhận', { exact: true })).toHaveCount(0); // R8: no confirm on an appointment
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(block).toBeFocused();
});
test('Spa without customer access sees no age, breed or customer link', async ({ page }) => { /* spa_ngocanh mở một lịch: không có link tới /nv/khach-hang, không có chữ "tuổi" */ });
test('reschedule and cancel run inside the panel and still need their reasons', async ({ page }) => { /* Đổi lịch → đổi giờ → khối chuyển ô; Hủy lịch bỏ trống lý do → báo "Bạn ghi lý do hủy lịch nhé."; sau khi hủy (đang ẩn lịch hủy) khung vẫn hiện lịch với "Đã hủy" */ });
test('an unknown ?lich= says so instead of a blank page', async ({ page }) => {
  await open(page, '/nv/lich-hen?lich=khong-co', { as: 'quanly_ha' });
  await expect(main(page).getByText('Không tìm thấy lịch hẹn này.')).toBeVisible();
});
test('phones: the panel is its own page and the system Back returns to the list @narrow', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 1024, 'phone flow');
  /* mở /nv/lich-hen, bấm một dòng agenda → [data-detail] hiện, URL có ?lich=; page.goBack() → danh sách, không còn [data-detail]; fitsDevice */
});
test('a reschedule wish shows in the panel with "Mở để dời" and "Không đổi"', async ({ page, context }) => { /* theo mẫu bài "the customer asks, sees it waiting" trong giao-dien-khach.spec.ts: khách gửi yêu cầu đổi lịch, nhân viên mở ?lich=<id>; thấy ngày mong muốn; "Không đổi" đóng yêu cầu */ });
```

- [ ] **Step 2: Run to verify RED** — Expected: FAIL (không có `[data-detail]`, vẫn là hộp thoại).
- [ ] **Step 3: Implement** — `AppointmentPanel` gồm đầu (ảnh `PetAvatar` 96, tên, "loài · giống · giới · tuổi" khi có quyền xem khách, chủ nuôi + `Tel`), khối thông tin theo spec §4, ba chế độ xem/đổi/hủy (chuyển nguyên logic từ `AppointmentDialog`, giữ phiên bản lúc mở, `ConflictError` báo tại chỗ), khối "Khách xin đổi lịch" với nút "Mở để dời" (điền sẵn ngày mong muốn) và "Không đổi" (chặn bấm kép, báo lỗi); `CalendarPage`: `selected` tìm trong toàn bộ dữ liệu (kể cả đã hủy), không thấy → `EmptyState` "Không tìm thấy lịch hẹn này." có nút về lịch; `MasterDetail` `focusDetail`, đóng bằng ✕ và Esc, tiêu điểm trả về khối đã mở; trên điện thoại mở bằng điều hướng `?lich=` (mục vào lịch sử) để Back của máy quay về danh sách.
- [ ] **Step 4: Run + regression** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-a.spec.ts e2e/conflict.spec.ts e2e/staff-a.spec.ts e2e/giao-dien-khach.spec.ts e2e/a11y.spec.ts --project=desktop-1440 --project=phone-390 --project=phone-320`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: appointment detail panel replaces the dialog`.

### Task 5: Danh sách hóa đơn bằng DataTable

**Files:**
- Modify: `src/features/staff/invoices/InvoicesPage.tsx` (bỏ bảng và thẻ tự dựng)
- Modify (ghi vào sổ): `e2e/staff-b.spec.ts` (`[data-invoice-row]` → `[data-row]` ở các bài danh sách nhân viên)
- Test: `e2e/giao-dien-nhan-vien-a.spec.ts`

**Interfaces:**
- Consumes: `DataTable<T>` / `Column<T>` (`@/ui`), `invoicePill`, `StaffInvoiceRow`.
- Produces: hàng danh sách `[data-row]` mở hóa đơn bằng bấm hoặc Enter; liên kết trong cột Số HĐ giữ nguyên.

- [ ] **Step 1: Write the failing test:**

```ts
test('invoice list: a paged table, rows open the invoice, the balance stands out', async ({ page }) => {
  await open(page, '/nv/hoa-don', { as: 'quanly_ha' });
  await expect(main(page).getByRole('table')).toBeVisible();
  expect(await main(page).locator('[data-row]').count()).toBeLessThanOrEqual(10);
  await main(page).getByRole('searchbox', { name: 'Tìm hóa đơn' }).fill('HD-1027');
  await main(page).locator('[data-row]').first().click();
  await expect(page).toHaveURL(/#\/nv\/hoa-don\/inv-27$/);
});
```

- [ ] **Step 2: Run to verify RED** — Expected: FAIL (không có `[data-row]`; bảng cũ không phân trang, 15+ hàng).
- [ ] **Step 3: Implement** — `DataTable` với cột Số HĐ (liên kết, `primary`), Ngày, Khách hàng, Thú cưng, Tổng tiền, Đã thu, Còn lại (màu nhấn khi > 0), Trạng thái; `pageSize` 10; `onOpen` điều hướng tới `paths.nv.invoice(id)`; giữ dải tóm tắt, ô tìm "Tìm hóa đơn", nhóm lọc trạng thái, trạng thái rỗng/lỗi.
- [ ] **Step 4: Run + regression** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-a.spec.ts e2e/staff-b.spec.ts e2e/journeys/billing.spec.ts --project=desktop-1440 --project=phone-390`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: staff invoice list uses the shared table`.

### Task 6: Bản xem trước hóa đơn nháp (thuần + component)

**Files:**
- Create: `src/features/staff/invoices/draftToSheet.ts`, `draftToSheet.test.ts`, `InvoicePreview.tsx`
- Modify: `src/features/staff/invoices/draft-lines.ts` (`Line.item` thêm `customer_group`; `linesOf` đọc `l.customer_group`)

**Interfaces:**
- Consumes: `customerLines` (`@/data/rules/invoice-lines`), `invoiceTotals` (`@/data/rules/invoice-math`), `InvoiceSheet`, `InvoiceSheetData` (`@/features/shared/InvoiceSheet`), `Line`.
- Produces:
  - `Line['item']` gồm thêm `customer_group: CustomerGroup`.
  - `export function draftToSheet(d: { code: string; createdAt: string; customerName: string; customerPhone: string; petNames: string[] }, lines: Line[], note: string): InvoiceSheetData` — dòng giá linh hoạt chưa nhập giá tính 0; `code` hiển thị là `"<code> (Dự kiến)"`; `state: 'unpaid'`, `paid: 0`, `payments: []`.
  - `InvoicePreview({ d, lines, note })` — hiện `InvoiceSheet` (có nhãn "Nội dung mẫu"); khi `lines.length === 0` hiện "Chưa có dịch vụ nào. Thêm dịch vụ để xem hóa đơn." thay vì tờ hóa đơn trống.

- [ ] **Step 1: Write the failing tests** (`draftToSheet.test.ts`):

```ts
const item = (over: object) => ({ id: 'p1', name: 'Khám lâm sàng', unit: 'lần', price: 150000, price_mode: 'fixed' as const, customer_group: 'itemized' as const, ...over });
const d = { code: 'HD-1028', createdAt: '2026-10-21T08:00:00+07:00', customerName: 'Nguyễn Thị Lan', customerPhone: '+84973555105', petNames: ['Miu'] };
it('totals match invoiceTotals and the code is marked as expected', () => {
  const s = draftToSheet(d, [{ key: 'a', item: item({}), qty: 2 }], '');
  expect(s.total).toBe(300000); expect(s.code).toBe('HD-1028 (Dự kiến)'); expect(s.state).toBe('unpaid');
});
it('folds treatment lines into one the way the customer will read them (R7)', () => {
  const s = draftToSheet(d, [
    { key: 'a', item: item({}), qty: 1 },
    { key: 'b', item: item({ id: 'p2', name: 'Tiêm X', customer_group: 'treatment', price: 80000 }), qty: 1 },
    { key: 'c', item: item({ id: 'p3', name: 'Thuốc Y', customer_group: 'treatment', price: 20000 }), qty: 1 },
  ], '');
  expect(s.lines.map((l) => l.label)).toEqual(['Khám lâm sàng', 'Thuốc và vật tư điều trị']);
  expect(s.lines[1]!.total).toBe(100000);
});
it('an open-price line without a price counts as 0 and does not break the sheet', () => {
  const s = draftToSheet(d, [{ key: 'a', item: item({ price_mode: 'open', price: 0 }), qty: 1 }], '');
  expect(s.total).toBe(0);
});
```

- [ ] **Step 2: Run to verify RED** — `npx vitest run src/features/staff/invoices/draftToSheet.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `draftToSheet` (nối `customerLines` và `invoiceTotals`; dòng `line_total = unit_price·qty`), cập nhật `Line`/`linesOf`/chỗ thêm dòng trong `DraftEditor` để có `customer_group` (typecheck sẽ chỉ chỗ), và `InvoicePreview`.
- [ ] **Step 4: Run to verify GREEN** — `npx vitest run src/features/staff/invoices && npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: live preview model for invoice drafts`.

### Task 7: Soạn hóa đơn nháp — bố cục hai cột, thêm dịch vụ, nhãn lưu, xem trước

**Files:**
- Create: `src/features/staff/invoices/InvoiceLinesTable.tsx`, `AddServiceDialog.tsx`
- Modify: `DraftEditor.tsx`, `Invoices.module.css`
- Modify (ghi vào sổ): `e2e/helpers.ts` (thêm `addService`), và các chỗ dùng ô "Tìm trong bảng giá" trực tiếp: `e2e/staff-b.spec.ts` (2), `e2e/journeys/billing.spec.ts`, `e2e/conflict.spec.ts` (chuyển sang `addService`; bài conflict đổi `heading /Hóa đơn nháp/` → `/Lập hóa đơn/`)
- Test: `e2e/giao-dien-nhan-vien-a.spec.ts`

**Interfaces:**
- Consumes: Task 6 (`InvoicePreview`, `Line`), `useSaveStatus` + `SaveState` (`@/ui`), `staff.invoices.updateDraft/issue`, `staff.prices.list`, `draftInput`/`linesOf`.
- Produces:
  - `e2e/helpers.ts`: `export async function addService(page: Page, query: string, name: RegExp | string)` — bấm "Thêm dịch vụ", điền ô "Tìm trong bảng giá", bấm nút `Thêm <name>`, đóng khung (Esc).
  - `AddServiceDialog({ open, onClose, prices: StaffPriceItem[], onAdd(item: StaffPriceItem): void })` — ô tìm accessible name "Tìm trong bảng giá"; nút mỗi mục name `Thêm <tên mục>`; chỉ mục `active`; khung giữ mở sau khi thêm; thêm lại mục giá cố định tăng số lượng (logic ở `DraftEditor.add`).
  - `InvoiceLinesTable({ lines, onChange(fn): void })` — mỗi dòng giữ `data-line`; nút "Giảm số lượng …"/"Tăng số lượng …"/"Bỏ …"; ô "Đơn giá …" cho mục giá linh hoạt (điền sẵn `reference_price` nếu có); tổng cộng giữ `data-total` ở `DraftEditor`.
  - Nhãn nút giữ nguyên để test cũ ít đổi: "Lưu nháp", "Phát hành hóa đơn", toast "Đã lưu hóa đơn nháp." (Ruling: mẫu ghi "Lưu bản nháp", giữ "Lưu nháp").

- [ ] **Step 1: Write the failing tests:**

```ts
test('editor: add, change quantity and remove lines — total and preview agree at every step', async ({ page }) => {
  await open(page, '/nv/hoa-don/inv-28', { as: 'quanly_ha' });
  const preview = main(page).locator('[data-invoice-preview]');
  const total = main(page).locator('[data-total]');
  await addService(page, 'khám lâm sàng', /Khám lâm sàng/);
  await expect(main(page).locator('[data-line]', { hasText: 'Khám lâm sàng' })).toBeVisible();
  const t1 = await total.innerText();
  await expect(preview).toContainText('Khám lâm sàng');
  await expect(preview).toContainText(t1.trim());
  await main(page).getByRole('button', { name: /Tăng số lượng Khám lâm sàng/ }).click();
  await expect(total).not.toHaveText(t1);
  await expect(preview).toContainText((await total.innerText()).trim());
  await main(page).getByRole('button', { name: /Bỏ Khám lâm sàng/ }).click();
  await expect(preview).not.toContainText('Khám lâm sàng');
});
test('the save label says "Chưa lưu thay đổi" until a real save, then "Đã lưu"', async ({ page }) => {
  await open(page, '/nv/hoa-don/inv-28', { as: 'quanly_ha' });
  await expect(main(page).locator('[data-save]')).toHaveAttribute('data-save', 'clean');
  await addService(page, 'tái khám', /Tái khám/);
  await expect(main(page).locator('[data-save]')).toHaveAttribute('data-save', 'dirty');
  await main(page).getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(main(page).locator('[data-save]')).toHaveAttribute('data-save', 'saved');
});
test('a draft with no lines cannot be issued and its preview says so', async ({ page }) => { /* tạo nháp mới (journeys/billing mẫu) → "Phát hành hóa đơn" disabled; preview có "Chưa có dịch vụ nào" */ });
test('treatment items fold into one line in the preview', async ({ page }) => { /* thêm "Thủ thuật theo chỉ định" (staff-b:147) → preview có "Thuốc và vật tư điều trị", không có tên thủ thuật */ });
test('phones: the editor and its collapsible preview fit 320 px @narrow', async ({ page }) => { /* inv-28: fitsDevice; nút "Xem trước hóa đơn" mở/đóng vùng xem trước */ });
```

- [ ] **Step 2: Run to verify RED** — Expected: FAIL (`data-invoice-preview`, `data-save`, "Thêm dịch vụ" chưa có).
- [ ] **Step 3: Implement** — bố cục hai cột từ 1100 px (soạn ~60% / xem trước ~40%, cột phải dính), dưới 1100 px xem trước nằm cuối trong khối thu gọn "Xem trước hóa đơn" (nút có `aria-expanded`); thẻ khách + thẻ bé (`PetAvatar`); `InvoiceLinesTable`, `AddServiceDialog` (chuyển ô tìm + nhóm lọc + danh sách từ `DraftEditor` cũ); `useSaveStatus`: sửa → `edit()`, lưu qua `run()`, thay `dirty` cũ; `SaveState` cạnh tiêu đề "Lập hóa đơn" (crumbs: Hóa đơn › Lập hóa đơn); vùng xem trước `data-invoice-preview` bọc `InvoicePreview`; "Phát hành hóa đơn" khóa khi chưa có dòng; xung đột phiên bản giữ hành vi cũ (hiện bản đã lưu của tab kia, `reset()` nhãn).
- [ ] **Step 4: Run + regression** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-a.spec.ts e2e/staff-b.spec.ts e2e/journeys/billing.spec.ts e2e/conflict.spec.ts e2e/giao-dien-chu.spec.ts e2e/a11y.spec.ts --project=desktop-1440 --project=phone-390 --project=phone-320`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: invoice editor with live preview, add-service picker and save label`.

### Task 8: Hóa đơn đã phát hành và bước chọn khách

**Files:**
- Modify: `src/features/staff/invoices/InvoicePage.tsx` (`Detail`), `InvoiceNewPage.tsx`, `Invoices.module.css`
- Test: `e2e/giao-dien-nhan-vien-a.spec.ts`

**Interfaces:**
- Consumes: `toSheet`, `InvoiceSheet`, `PetAvatar`.
- Produces: bản hóa đơn khách thấy luôn hiện ở cột phải (`[data-invoice-preview]`); nút "Chọn lại" ở thẻ khách của bước chọn (không có khi địa chỉ có `?khach=`).

- [ ] **Step 1: Write the failing tests:**

```ts
test('issued invoice: the customer view is always on the right, payment and print stay', async ({ page }) => {
  await open(page, '/nv/hoa-don/inv-27', { as: 'quanly_ha' });
  await expect(main(page).locator('[data-invoice-preview]')).toContainText('Thanh toán tại quầy');
  await expect(main(page).getByRole('button', { name: 'Xem như khách' })).toHaveCount(0);
  await expect(main(page).getByRole('button', { name: 'Ghi nhận thanh toán' })).toBeVisible();
  await expect(main(page).getByRole('link', { name: 'In hóa đơn' })).toBeVisible();
});
test('new invoice: "Chọn lại" changes the customer unless the customer came from the link', async ({ page }) => {
  await open(page, '/nv/hoa-don/moi', { as: 'quanly_ha' });
  await main(page).getByRole('searchbox', { name: /Tìm khách hàng/ }).fill('Lan');
  await main(page).getByRole('radio').first().check();
  await main(page).getByRole('button', { name: 'Chọn lại' }).click();
  await expect(main(page).getByRole('searchbox', { name: /Tìm khách hàng/ })).toBeVisible();
  await open(page, '/nv/hoa-don/moi?khach=cus-05', { as: 'bacsi_duc' });
  await expect(main(page).getByRole('button', { name: 'Chọn lại' })).toHaveCount(0);
});
```
(Nếu ô tìm của bước chọn khác tên accessible, dùng đúng tên hiện có của `Field label="Tìm khách hàng"`.)

- [ ] **Step 2: Run to verify RED** — Expected: FAIL.
- [ ] **Step 3: Implement** — `Detail`: hai cột như `DraftEditor` (trái dòng, tổng, giảm giá, đã thu, còn lại, các lần thanh toán, "Ghi nhận thanh toán"; phải `InvoiceSheet` của khách bọc `data-invoice-preview`, thay Panel "Khách sẽ thấy"); `InvoiceNewPage`: thẻ "Thông tin khách hàng" với nút "Chọn lại", giữ `createDraft` nguyên.
- [ ] **Step 4: Run + regression** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-a.spec.ts e2e/staff-b.spec.ts e2e/journeys/billing.spec.ts e2e/giao-dien-chu.spec.ts --project=desktop-1440 --project=phone-390 --project=phone-320`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: issued invoice shows the customer view; new invoice step restyled`.

### Task 9: Hoàn tất — e2e toàn khu, tài liệu, bản HTML

**Files:**
- Modify: `e2e/manifest.ts` (thêm `lich-hen-chi-tiet` `/nv/lich-hen?lich=…` nếu có id seed ổn định), `docs/thiet-ke/QUYET-DINH.md` (R37), `PROGRESS.md` (mục giao diện), `README.md` (dòng trạng thái), `CLAUDE.md` (không đổi trừ khi cần)
- Test: toàn bộ

- [ ] **Step 1:** Chạy `npm run typecheck && npm run lint && npm test` — Expected: sạch, mọi bài đơn vị pass.
- [ ] **Step 2:** Chạy bài kiểm tra cả khu ở 320 px: thêm vào `e2e/giao-dien-nhan-vien-a.spec.ts` bài `@narrow` duyệt `SCREENS` zone `staff` (không "Hoàn thành", không "quý khách", `fitsDevice`) — nếu Task 1 chưa phủ — rồi `npm run build && npx playwright test e2e/giao-dien-nhan-vien-a.spec.ts --project=phone-320`. Expected: PASS.
- [ ] **Step 3:** Ghi R37 (khu nhân viên 4A: lưới tuần, khung chi tiết, xem trước hóa đơn; không "Xác nhận" trên lịch hẹn; không kéo thả) vào `QUYET-DINH.md`; cập nhật `PROGRESS.md` (mục `claude/giao-dien`: xong 4A, tiếp 4B–4D, còn chờ 3 bảng mẫu) và dòng trạng thái trong `README.md`.
- [ ] **Step 4:** `npm run verify` — Expected: exit 0 (typecheck → lint → unit → build artifact → ngân sách → build → e2e). Nếu ngân sách JS vượt, tách lười (lazy) phần mới trước khi gộp.
- [ ] **Step 5:** `npm run build:single` rồi chép `dist-single/index.html` thành `dist-single/Le-Son-demo.html`; commit `docs: part 4A decisions, progress and status`.
