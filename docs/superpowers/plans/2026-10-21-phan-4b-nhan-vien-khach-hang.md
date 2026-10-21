# Phần 4B — Khu nhân viên: Khách hàng — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Danh sách khách hàng bằng bảng chung; hồ sơ khách hai cột có sửa khách, sửa/thêm thú cưng đủ trường và tab Lịch sử tương tác.

**Architecture:** Không đổi hợp đồng dữ liệu (đã có `update`, `updatePet`, `findByPhone`, `interactions`, `pets` trong hàng danh sách). Tách `CustomerPage.tsx` thành các tệp nhỏ (`PetCard`, `PetForm`, `CustomerForm`, `InteractionList`), phần chọn biểu tượng/đường dẫn của lịch sử là hàm thuần có test.

**Tech Stack:** React 19, TypeScript, CSS Modules, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-21-phan-4b-nhan-vien-khach-hang-design.md`.

## Global Constraints

- Mọi chữ tiếng Việt; không "quý khách", không "lễ tân"; ghi chú nội bộ có nhãn "khách không thấy".
- Quyền ở API và ẩn nút ở giao diện: `customers.edit` cho Thêm khách / Chỉnh sửa / Thêm thú cưng; Spa không có quyền này. Không tự thêm dòng nội trú/hóa đơn ngoài những gì `interactions` trả.
- Số điện thoại trùng chỉ cảnh báo, không chặn. Sửa luôn gửi `version` lúc mở hộp thoại; `ConflictError` → báo và tải lại, không ghi đè.
- `updatePet`: cảnh báo an toàn luôn gửi theo ô tích hiện tại (bỏ hết = xóa).
- Số, mã, điện thoại, tiền dùng `.num` nhưng không đặt lên dòng dài; nút/ô nhập 6 px, thẻ 12 px (token có sẵn); 320 px không cuộn ngang; tương phản ≥ 4,5:1; bàn phím dùng được.
- Giao diện chỉ gọi `@/data/staff`; không đổi `src/data/**`; không thêm thư viện.
- Commit tiêu đề tiếng Anh; thân commit kết thúc bằng `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` và `Claude-Session: https://claude.ai/code/session_013xgtFbNtYrgX8b1A7NpkL4`. Không ghi tên model vào code/tài liệu.
- Chạy e2e: `npm run build && npx playwright test <file> -g "<tên>" --project=desktop-1440 --project=phone-390` (thêm `--project=phone-320` cho bài `@narrow`). Unit: `npx vitest run <file>`. e2e dùng helper `openStaff`, `staffMain` trong `e2e/helpers.ts`.

## Review Focus

1. Khách chưa có thú cưng / chưa có lịch sử / không địa chỉ: các khối hiện trạng thái rỗng, không vỡ (T3, T5).
2. Hai khách dùng chung số điện thoại: cảnh báo hiện khách kia, vẫn lưu được; khi sửa chính khách này thì không tự báo trùng với mình (T4).
3. Bé không có năm sinh/cân nặng/màu lông: dòng mô tả bỏ phần thiếu, không in "undefined" hay "null" (T3).
4. Cân nặng nhập sai (0, 200, 1,23): hiện đúng câu lỗi tại ô, hộp thoại giữ giá trị đã nhập (T3).
5. Dòng lịch sử có kiểu hoặc `refId` lạ: hiện chữ, không liên kết, không lỗi (T1, T5).

---

### Task 1: Biểu tượng và đường dẫn của lịch sử tương tác (thuần)

**Files:**
- Create: `src/features/staff/customers/interactions.ts`, `interactions.test.ts`

**Interfaces:**
- Consumes: `StaffInteraction`, `StaffInteractionKind` từ `@/data/staff`; `paths` từ `@/app/routes`; `Cap` từ `@/data/rules/capabilities`; `IconName` từ `@/ui`.
- Produces:
  - `export const INTERACTION_ICON: Record<StaffInteractionKind, IconName>`.
  - `export function interactionLink(i: Pick<StaffInteraction, 'kind' | 'refId'>, can: (cap: Cap | Cap[]) => boolean): string | undefined` — `request` → `paths.nv.request(refId)` (cần `requests.handle`); `stay` → `paths.nv.stay(refId)` (cần `inpatient.view`); `invoice` và `payment` → `paths.nv.invoice(refId)` (cần `['invoices.create','payments.record']`); các loại khác và `refId` rỗng → `undefined`.

- [ ] **Step 1: Write the failing test** (`interactions.test.ts`):

```ts
const all = () => true;
it('links requests, stays and invoices/payments when allowed', () => {
  expect(interactionLink({ kind: 'request', refId: 'req-YC-0234' }, all)).toBe(paths.nv.request('req-YC-0234'));
  expect(interactionLink({ kind: 'stay', refId: 's1' }, all)).toBe(paths.nv.stay('s1'));
  expect(interactionLink({ kind: 'invoice', refId: 'inv-27' }, all)).toBe(paths.nv.invoice('inv-27'));
  expect(interactionLink({ kind: 'payment', refId: 'inv-27' }, all)).toBe(paths.nv.invoice('inv-27'));
});
it('has no link for the other kinds, a missing id, or a missing right', () => {
  for (const kind of ['customer', 'appointment', 'link'] as const) expect(interactionLink({ kind, refId: 'x' }, all)).toBeUndefined();
  expect(interactionLink({ kind: 'invoice', refId: undefined }, all)).toBeUndefined();
  expect(interactionLink({ kind: 'invoice', refId: 'inv-27' }, () => false)).toBeUndefined();
});
it('gives every kind an icon and survives an unknown kind', () => {
  for (const kind of ['customer', 'request', 'appointment', 'stay', 'invoice', 'payment', 'link'] as const) expect(INTERACTION_ICON[kind]).toBeTruthy();
  expect(interactionLink({ kind: 'weird' as never, refId: 'x' }, all)).toBeUndefined();
});
```

- [ ] **Step 2: Run to verify RED** — `npx vitest run src/features/staff/customers/interactions.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `interactions.ts` per the signatures (icons from the existing set: customer `user`/`users-round`, request `inbox`, appointment `calendar-days`, stay `house-paw`, invoice `receipt`, payment `banknote`, link `link-2` — pick names that exist in `src/ui/icons/names.ts`).
- [ ] **Step 4: Run to verify GREEN** — same command. Expected: PASS; also `npm run typecheck`.
- [ ] **Step 5: Commit** — `feat: interaction icons and links for the customer record`.

### Task 2: Danh sách khách hàng bằng bảng chung

**Files:**
- Modify: `src/features/staff/customers/CustomersPage.tsx`
- Create: `e2e/giao-dien-nhan-vien-b.spec.ts`

**Interfaces:**
- Consumes: `DataTable`/`Column` (`@/ui`), `PetAvatar`, `StaffCustomerRow.pets`.
- Produces: hàng danh sách `[data-row]`; ô tìm giữ tên "Tìm khách hàng"; `NewCustomerDialog` giữ nguyên chữ ký (dùng ở nơi khác).

- [ ] **Step 1: Write the failing tests** (`giao-dien-nhan-vien-b.spec.ts`, mở đầu: `import { open, openStaff, staffMain as main } from './helpers'`):

```ts
test('customer list: a paged table with pet photos; a row opens the record; accent-free search', async ({ page }) => {
  await openStaff(page, '/nv/khach-hang', 'quanly_ha');
  await expect(main(page).getByRole('table')).toBeVisible();
  expect(await main(page).locator('[data-row]').count()).toBeLessThanOrEqual(10);
  await expect(main(page).getByRole('navigation', { name: 'Phân trang' })).toBeVisible();
  await main(page).getByRole('searchbox', { name: 'Tìm khách hàng' }).fill('nguyen thi lan');
  await expect(main(page).locator('[data-row]')).toHaveCount(1);
  await expect(main(page).locator('[data-row]').first().locator('img, svg').first()).toBeVisible(); // a pet avatar
  await main(page).locator('[data-row]').first().click();
  await expect(page).toHaveURL(/#\/nv\/khach-hang\/[^/]+$/);
});
test('filters: owing, inpatient, linked', async ({ page }) => {
  await openStaff(page, '/nv/khach-hang', 'quanly_ha');
  await main(page).getByRole('radio', { name: 'Còn nợ' }).click();
  expect(await main(page).locator('[data-row]').count()).toBeGreaterThan(0);
  await expect(main(page).locator('[data-row]').filter({ hasNotText: 'đ' })).toHaveCount(0); // every row shows an amount
});
test('phones: the table turns into cards and fits @narrow', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
  await openStaff(page, '/nv/khach-hang', 'quanly_ha');
  await expect(main(page).locator('[data-row]').first()).toBeVisible();
  await fitsDevice(page); // import from './width'
});
```

- [ ] **Step 2: Run to verify RED** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-b.spec.ts --project=desktop-1440 --project=phone-390`. Expected: FAIL (no `[data-row]`, no pager).
- [ ] **Step 3: Implement** — `CustomersPage` uses `DataTable` with columns Khách hàng (avatars of up to 3 pets via `PetAvatar` size 40 in an overlapping row + "+N", name as link, code, "Nội trú" tag), Số điện thoại, Thú cưng, Tài khoản web, Lịch hẹn gần nhất, Còn nợ (`.num`, accent when > 0); `onOpen` navigates to `paths.nv.customer(id)`; keep search, filter chips, empty/error states and the add dialog.
- [ ] **Step 4: Run to verify GREEN + regression** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-b.spec.ts e2e/staff-a.spec.ts e2e/giao-dien-chu.spec.ts e2e/a11y.spec.ts --project=desktop-1440 --project=phone-390 --project=phone-320`. Expected: PASS (adjust small old selectors and log them).
- [ ] **Step 5: Commit** — `feat: staff customer list uses the shared paged table`.

### Task 3: Thẻ thú cưng, biểu mẫu thêm/sửa bé

**Files:**
- Create: `src/features/staff/customers/PetCard.tsx`, `PetForm.tsx`, `Customers.module.css`
- Modify: `src/features/staff/customers/CustomerPage.tsx` (tab Thú cưng dùng `PetCard`; bỏ `PetDialog` cũ)
- Test: `e2e/giao-dien-nhan-vien-b.spec.ts`

**Interfaces:**
- Consumes: `staff.customers.createPet`, `updatePet(petId, version, PetInput)`, `StaffPet`, `formatKg` (`@/lib/units`), `PetAvatar`, `ValidationError`, `ConflictError`, `saveError`.
- Produces: `PetCard({ pet, canEdit, onEdit })`; `PetForm({ open, onClose, customerId, pet? })` — `pet` có thì sửa (`updatePet` với `pet.version`), không thì thêm; trường: Tên, Loài, Giống, Giới tính, Năm sinh, Cân nặng (kg), Màu lông, Triệt sản (Chưa rõ / Đã / Chưa), Ghi chú nội bộ, cảnh báo bằng ô tích (hằng `ALERTS` hiện có) kèm dòng "Bỏ hết dấu tích sẽ xóa các lưu ý của bé." Nút lưu "Lưu thú cưng"; hàm thuần `petLine(p: StaffPet, year: number): string` (đặt trong `PetCard.tsx`, export, có test đơn vị) ghép "loài · giống · giới · N tuổi · X kg · màu · đã triệt sản" và bỏ phần thiếu.

- [ ] **Step 1: Write the failing tests:** đơn vị `PetCard.test.ts`: `petLine` bỏ phần thiếu, "dưới 1 tuổi", không bao giờ chứa "undefined"/"null". e2e (`bacsi_mai`/`quanly_ha`, khách "Nguyễn Thị Lan"):

```ts
test('edit a pet: weight errors show at the field and keep what was typed; a valid save shows on the card', async ({ page }) => {
  await openStaff(page, '/nv/khach-hang', 'quanly_ha');
  await main(page).locator('[data-row]', { hasText: 'Nguyễn Thị Lan' }).click();
  const card = main(page).locator('[data-pet-card]', { hasText: 'Miu' });
  await card.getByRole('button', { name: /Chỉnh sửa Miu/ }).click();
  const dlg = page.getByRole('dialog');
  await dlg.getByLabel('Cân nặng (kg)').fill('200');
  await dlg.getByRole('button', { name: 'Lưu thú cưng' }).click();
  await expect(dlg.getByText(/0,1/)).toBeVisible();
  await expect(dlg.getByLabel('Cân nặng (kg)')).toHaveValue('200');
  await dlg.getByLabel('Cân nặng (kg)').fill('4,2');
  await dlg.getByLabel('Màu lông').fill('Trắng');
  await dlg.getByRole('button', { name: 'Lưu thú cưng' }).click();
  await expect(card).toContainText('4,2');
  await expect(card).toContainText('Trắng');
});
test('alerts: untouched stay, unticked are cleared', async ({ page }) => { /* mở bé có cảnh báo (bé seed có alerts), sửa chỉ tên → cảnh báo còn; sửa và bỏ hết tích → thẻ hết cảnh báo */ });
test('add a pet with the full form', async ({ page }) => { /* "Thêm thú cưng": tên + loài + cân nặng 3,5 + màu → thẻ mới có "3,5" */ });
test('a customer with no pets shows an empty state', async ({ page }) => { /* khách không có bé (tạo mới qua "Thêm khách hàng") → "Hồ sơ chưa có thú cưng." */ });
test('Spa sees pets but no edit or add buttons', async ({ page }) => { /* spa_ngocanh: không có "Chỉnh sửa Miu", không "Thêm thú cưng" */ });
```
(Người làm chọn bé seed có cảnh báo bằng cách đọc `src/data/mock/seed/accounts.ts`; các bài chú thích `/* … */` phải được viết đầy đủ, không bỏ.)

- [ ] **Step 2: Run to verify RED** — `npx vitest run src/features/staff/customers` và `npm run build && npx playwright test e2e/giao-dien-nhan-vien-b.spec.ts -g "pet|alerts|Spa" --project=desktop-1440`. Expected: FAIL.
- [ ] **Step 3: Implement** `PetCard` (`data-pet-card`, `PetAvatar` 56, nút `aria-label="Chỉnh sửa <tên>"`), `PetForm` (một biểu mẫu cho thêm và sửa; lỗi trường từ `ValidationError`; `ConflictError` → báo và `refetch`; giữ giá trị đã nhập khi lỗi), cập nhật tab Thú cưng; trạng thái rỗng "Hồ sơ chưa có thú cưng."
- [ ] **Step 4: Run to verify GREEN + regression** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-b.spec.ts e2e/staff-a.spec.ts e2e/giao-dien-chu.spec.ts --project=desktop-1440 --project=phone-390 --project=phone-320`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: pet cards and one form to add or edit a pet`.

### Task 4: Sửa khách, thẻ thông tin, bố cục hai cột

**Files:**
- Create: `src/features/staff/customers/CustomerForm.tsx`, `PhoneNote.tsx`
- Modify: `CustomerPage.tsx`, `CustomersPage.tsx` (`NewCustomerDialog` dùng `PhoneNote`), `Customers.module.css`
- Test: `e2e/giao-dien-nhan-vien-b.spec.ts`

**Interfaces:**
- Consumes: `staff.customers.update(id, version, CustomerInput)`, `findByPhone(phone, excludeId?)`, `normalizeVnPhone`.
- Produces: `PhoneNote({ phone, excludeId?, onNavigate? })` — cảnh báo "Đã có hồ sơ dùng số này: …" (liên kết hồ sơ khác, bỏ qua chính khách); `CustomerForm({ open, onClose, customer: StaffCustomerDetail })`; thẻ `[data-customer-info]` ở cột trái từ 1100 px (trên các tab dưới 1100 px), có nút "Chỉnh sửa" (`customers.edit`).

- [ ] **Step 1: Write the failing tests (e2e):**

```ts
test('the record shows an info card and edits it; a shared phone warns but saves', async ({ page }) => {
  await openStaff(page, '/nv/khach-hang', 'quanly_ha');
  await main(page).locator('[data-row]', { hasText: 'Nguyễn Thị Lan' }).click();
  const info = main(page).locator('[data-customer-info]');
  await expect(info).toContainText('Nguyễn Thị Lan');
  await info.getByRole('button', { name: 'Chỉnh sửa' }).click();
  const dlg = page.getByRole('dialog');
  await dlg.getByLabel('Địa chỉ').fill('12 Phố Mới, Hà Nội');
  await dlg.getByRole('button', { name: 'Lưu hồ sơ' }).click();
  await expect(info).toContainText('12 Phố Mới');
});
test('editing with a stale version says so and shows the newer data', async ({ page, context }) => { /* hai tab cùng khách: tab B lưu địa chỉ B; tab A (hộp thoại mở từ trước) lưu địa chỉ A → "vừa được người khác cập nhật", thẻ hiện địa chỉ B */ });
test('a phone used by another customer warns and still saves; the customer\'s own number does not warn', async ({ page }) => { /* mở sửa: số hiện tại không có cảnh báo; đổi sang số của khách khác → "Đã có hồ sơ dùng số này"; Lưu vẫn thành công */ });
test('a bad phone shows the field error', async ({ page }) => { /* fill 'abc' → lỗi tại ô số điện thoại, hộp thoại giữ giá trị */ });
test('Spa has no edit button on the card', async ({ page }) => { /* spa_ngocanh: [data-customer-info] không có "Chỉnh sửa" */ });
test('phones: the record fits 320 px with the info card above the tabs @narrow', async ({ page }) => { /* fitsDevice; thẻ thông tin nằm trên các tab */ });
```

- [ ] **Step 2: Run to verify RED** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-b.spec.ts -g "record|stale|phone|Spa has no edit" --project=desktop-1440 --project=phone-390`. Expected: FAIL.
- [ ] **Step 3: Implement** — `CustomerPage` bố cục hai cột (`@media (min-width: 1100px)`), thẻ thông tin theo spec §3, `CustomerForm` (phiên bản lúc mở; `ValidationError` tại ô; `ConflictError` báo và `refetch`; toast "Đã lưu hồ sơ."), `PhoneNote` dùng chung với `NewCustomerDialog`.
- [ ] **Step 4: Run to verify GREEN + regression** — như Task 3 cộng `e2e/conflict.spec.ts`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: customer info card, edit form and two-column record`.

### Task 5: Tab Lịch sử tương tác

**Files:**
- Create: `src/features/staff/customers/InteractionList.tsx`
- Modify: `CustomerPage.tsx` (thêm tab), `Customers.module.css`
- Test: `e2e/giao-dien-nhan-vien-b.spec.ts`

**Interfaces:**
- Consumes: Task 1 (`INTERACTION_ICON`, `interactionLink`), `c.interactions`, `useSession().can`.
- Produces: tab `history` ("Lịch sử tương tác") trong `Tab`; `InteractionList({ items })` — mỗi dòng `[data-interaction]`: biểu tượng, `label`, thời điểm (`whenShort`), người thực hiện; liên kết khi `interactionLink` có; rỗng → "Chưa có hoạt động nào."

- [ ] **Step 1: Write the failing tests (e2e):**

```ts
test('the history tab lists contacts newest first with their icons and links', async ({ page }) => {
  await openStaff(page, '/nv/khach-hang', 'quanly_ha');
  await main(page).locator('[data-row]', { hasText: 'Nguyễn Thị Lan' }).click();
  await main(page).getByRole('tab', { name: /Lịch sử tương tác/ }).click();
  const rows = main(page).locator('[data-interaction]');
  expect(await rows.count()).toBeGreaterThan(1);
  expect(await rows.count()).toBeLessThanOrEqual(50);
  const times = await rows.evaluateAll((els) => els.map((e) => Date.parse((e.querySelector('time') as HTMLTimeElement).dateTime)));
  expect(times).toEqual([...times].sort((a, b) => b - a));
  await expect(rows.filter({ hasText: /HD-\d+/ }).first().getByRole('link')).toBeVisible();
});
test('Spa sees no invoice or payment rows in the history', async ({ page }) => { /* spa_ngocanh, cùng khách: không có dòng chứa "HD-" hoặc "Thu "; vẫn có "Tạo hồ sơ" */ });
test('a customer with a single event shows it; no event at all shows the empty text', async ({ page }) => { /* khách mới tạo qua "Thêm khách hàng" có đúng 1 dòng "Tạo hồ sơ …" */ });
```
(`InteractionList` render `<time dateTime={at}>`.)

- [ ] **Step 2: Run to verify RED** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-b.spec.ts -g "history" --project=desktop-1440 --project=phone-390`. Expected: FAIL.
- [ ] **Step 3: Implement** tab + `InteractionList`.
- [ ] **Step 4: Run to verify GREEN + regression** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-b.spec.ts e2e/staff-a.spec.ts e2e/a11y.spec.ts --project=desktop-1440 --project=phone-390 --project=phone-320`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: customer interaction history tab`.

### Task 6: Hoàn tất

- [ ] **Step 1:** `npm run typecheck && npm run lint && npm test` — sạch, mọi bài đơn vị pass.
- [ ] **Step 2:** Ghi R38 vào `docs/thiet-ke/QUYET-DINH.md` (khách hàng: bảng chung, hồ sơ hai cột, sửa khách/bé, cảnh báo luôn gửi theo ô tích, lịch sử tương tác theo quyền), cập nhật `PROGRESS.md` (mục giao diện: xong 4B, tiếp 4C/4D) và dòng trạng thái `README.md`; cập nhật `docs/tham-khao/bang-kiem-thu-nghiep-vu-2026-10-21.md` cho các ô liên quan (đồng thời khách/bé, hồ sơ thú cưng).
- [ ] **Step 3:** `npm run verify` — exit 0.
- [ ] **Step 4:** `npm run build:single`, chép `dist-single/index.html` thành `dist-single/Le-Son-demo.html`; commit `docs: part 4B decisions, progress and status`.
