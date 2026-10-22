# Phần 4D — Khu nhân viên: Bảng giá và Doanh thu — Kế hoạch thực hiện

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm Bảng giá sửa được (thêm, sửa bằng hộp thoại, ngừng dùng/dùng lại) và làm lại Doanh thu theo phong cách 4A–4C, có thêm chọn khoảng ngày.

**Architecture:** Chỉ lớp giao diện trong `src/features/staff/pricelist/` và `src/features/staff/revenue/`; dữ liệu qua `staff.prices.*` và `staff.reports.revenue` (hợp đồng đã có, **không đổi**). Logic có điều kiện (phân tích số tiền, lọc, nhãn giá, khoảng ngày, tỷ lệ %) tách thành hàm thuần có test đơn vị; trang và hộp thoại chỉ ghép. Trạng thái kỳ của Doanh thu nằm trên đường dẫn (`?tu=…&den=…`).

**Tech Stack:** React 19, TypeScript, react-router (hash, `useSearchParams`), motion (`m`), CSS Modules + tokens, Vitest, Playwright. Không thêm thư viện.

**Spec:** `docs/superpowers/specs/2026-10-22-phan-4d-nhan-vien-bang-gia-doanh-thu-design.md`.

## Global Constraints

- Mọi chữ hiển thị bằng tiếng Việt; không "quý khách", không "lễ tân"; số, tiền, mã, ngày dùng class `.num`; quy chuẩn chữ và số (số lẻ dùng dấu phẩy).
- Quyền: `pricelist.edit` (chỉ Quản lý) mới thấy Thêm/Sửa/Ngừng dùng/Dùng lại; `reports.revenue` (chỉ Quản lý) mới thấy Doanh thu. Kiểm tra ở API **và** ẩn nút ở giao diện (`useSession().can`). Bác sĩ/Spa chỉ xem Bảng giá.
- Quy tắc dữ liệu giữ nguyên, không viết lại ở giao diện: giá mới chỉ cho hóa đơn sau; mục ngừng dùng không thêm được vào hóa đơn mới nhưng hóa đơn nháp đang có vẫn lưu được; LT01–LT03 không tắt được và luôn "Giá cố định"; nhóm không đổi được khi sửa; mã do hệ thống cấp; thuốc/vật tư luôn gộp "Thuốc và vật tư điều trị", Spa/Nội trú luôn từng dòng, chỉ nhóm Khám và điều trị chọn được.
- Ghi dữ liệu có phiên bản (`update`, `setActive`) gửi **phiên bản lúc mở hộp thoại/lúc bấm dòng**; `ConflictError` → toast lỗi `saveError(e)`, đóng hộp thoại (dữ liệu tự tải lại). Hộp thoại đang mở **không tự biến mất** khi dữ liệu nền đổi.
- `staff.reports.revenue` KHÔNG kiểm tra khoảng ngày: giao diện phải tự kiểm bằng `validateRange` (`@/data/rules/calendar`) với đúng các câu `RANGE_MSG`, và không gọi API khi có lỗi.
- Câu báo lỗi trường lấy từ API (`ValidationError`), không tự đặt lại.
- Thẻ bo `--r-card` (12 px), nút/ô `--r-control` (6 px); màu chỉ qua token; chuyển động một lần, 150–450 ms, tôn trọng `prefers-reduced-motion`; điện thoại 320 px không cuộn ngang; tương phản ≥ 4,5:1.
- Không đổi `src/data/**`. Cần đổi hợp đồng → dừng, ghi `PROGRESS.md` "Yêu cầu gửi nhánh kia".
- Giữ chữ mà bài cũ ở `e2e/staff-b.spec.ts` dựa vào: banner "Giá trong bản demo là giá minh họa, chưa phải giá thật của bệnh viện.", chữ "Khám lâm sàng", không có nút "Sửa" cho bác sĩ; `[data-kpi="outstanding"]` chứa 2.975.000 ₫ và dòng "Số liệu được tính từ dữ liệu mẫu." ở Doanh thu.
- Commit tiêu đề tiếng Anh `feat:`/`test:`/`docs:`, không ghi tên model. Viết test trước.

## Review Focus

1. Số tiền gõ vào: "1.500.000", "150 000", "150000đ", "0", "-5", "12,5", "1e6", chuỗi rỗng — không bao giờ ra `NaN`/số lẻ/âm; rỗng ở "Giá gợi ý" là hợp lệ (Task 1, 3).
2. Hai tab sửa/tắt cùng một dịch vụ: tab sau nhận "vừa được người khác cập nhật", không ghi đè, dữ liệu tự tải lại (Task 3, 4).
3. Khoảng ngày: từ > đến, hơn 366 ngày, năm 1999/2101, ngày không có thật (2026-02-30), ô trống: không gọi API, số liệu cũ giữ nguyên, lỗi đúng dưới ô (Task 5). `?tu`/`?den` hỏng trên đường dẫn: rơi về "Tháng này" thay vì lỗi trắng trang (Task 1, 5).
4. Tỷ lệ % khi tổng bằng 0 hoặc chỉ một nhóm có tiền: không `NaN`, cộng đúng 100 (Task 1, 6).
5. Ngừng dùng một dịch vụ đang nằm trong hóa đơn nháp: hóa đơn nháp vẫn lưu được; dịch vụ không còn trong bộ chọn "Thêm dịch vụ" (Task 7).

---

## File structure

`src/features/staff/pricelist/`: `PricesPage.tsx` (viết lại) · `PriceDialog.tsx` (mới) · `DeactivateDialog.tsx` (mới) · `priceForm.ts` (mới) · `priceView.ts` (mới) · `Prices.module.css` (mới) — hàm thuần có `*.test.ts` cạnh file.
`src/features/staff/revenue/`: `RevenuePage.tsx` (viết lại) · `PeriodPicker.tsx` (mới) · `RevenueChart.tsx` (mới) · `CategoryBars.tsx` (mới) · `OpenInvoices.tsx` (mới) · `revenueView.ts` (mới) · `Revenue.module.css` (mở rộng).
Test: `e2e/giao-dien-nhan-vien-d.spec.ts` (mới). Sửa nhỏ `e2e/staff-b.spec.ts` nếu chữ đổi (ghi sổ).

Dữ liệu mẫu cho test: 31 dịch vụ, **tất cả đang dùng**; KB09 "Thủ thuật theo chỉ định", TH06 "Thuốc theo đơn khác", VT05 "Vật tư khác" là nhập giá (giá gợi ý 200.000 / 100.000 / 50.000 ₫); LT01–LT03 là mục tiền ngày, LT04 "Chăm sóc tăng cường" thì tắt được; KB01 "Khám lâm sàng" 150.000 ₫ nằm trên hóa đơn đã phát hành `inv-27` (HD-1027, khách Nguyễn Thị Lan, dòng KB01 × 1 @ 150.000 và KB05 @ 80.000); khách `cus-05` dùng được cho `/nv/hoa-don/moi?khach=cus-05`. Tài khoản: `quanly_ha` (sửa được), `bacsi_mai`/`spa_ngocanh` (chỉ xem).

Chạy e2e cần `npm run build` trước; mỗi task e2e chạy `--project=desktop-1440 --project=phone-390 --project=phone-320`. Helper: `openStaff(page, route, as)`, `staffMain`, `addService(page, query, button)` (`e2e/helpers.ts`), `fitsDevice` (`e2e/width.ts`); toast: `page.getByRole('status').filter({ hasText })`. Lưu ý: từ 00:00 đến ~08:00 giờ Việt Nam vài bài e2e **phía khách** cũ đỏ vì dữ liệu mẫu theo giờ (không liên quan; xem `PROGRESS.md`).

---

### Task 1: Hàm thuần — số tiền, lọc bảng giá, khoảng ngày, tỷ lệ

**Files:**
- Create: `priceForm.ts`, `priceView.ts` (trong `pricelist/`), `revenueView.ts` (trong `revenue/`) và `*.test.ts` tương ứng.

**Interfaces:**
- Produces (dùng ở Task 2–6):
  - `priceForm.ts`: `parseVnd(raw: string): number | undefined` (số nguyên ≥ 1, chấp nhận dấu chấm/khoảng trắng ngăn cách nghìn và hậu tố "đ"/"₫"; còn lại → `undefined`); `type PriceFormValues = { category: PriceCategory; name: string; unit: string; mode: 'fixed' | 'open'; price: string; reference: string; group: CustomerGroup }`; `toPriceInput(v: PriceFormValues): PriceInput` (giá cố định → `price`; nhập giá → `reference_price` chỉ khi có; `customer_group` chỉ gửi với nhóm `exam`); `fixedGroupNote(category: PriceCategory): string | undefined` (thuốc/vật tư: "Khách thấy gộp trong “Thuốc và vật tư điều trị”."; spa/nội trú: "Khách thấy từng dòng."; khám: `undefined`); `priceSummary(v: PriceFormValues): string`; `isDayItemCode(code: string): boolean` (LT01–LT03); `priceLabel(item: Pick<StaffPriceItem, 'price_mode' | 'price' | 'reference_price'>): { main: string; hint?: string }`.
  - `priceView.ts`: `type StatusFilter = 'active' | 'inactive' | 'all'`; `filterPrices(items: StaffPriceItem[], f: { needle: string; category: PriceCategory | 'all'; status: StatusFilter }): StaffPriceItem[]` (tìm mã/tên không dấu); `statusCounts(items): { active: number; inactive: number; all: number }`; `categoryCounts(items, status): Partial<Record<PriceCategory, number>>`.
  - `revenueView.ts`: `type Period = 'today' | '7d' | 'month' | 'prev' | 'custom'`; `periodRange(p: Exclude<Period, 'custom'>, today: string): { from: string; to: string }`; `readRange(search: string, today: string): { period: Period; from: string; to: string }` (đọc `?tu`/`?den`; hợp lệ → `custom` hoặc trùng đúng một kỳ cố định thì trả kỳ đó; thiếu/hỏng/vô lý → `month`); `writeRange(from: string, to: string): string` (trả `"?tu=…&den=…"`); `shares(values: number[]): number[]` (phần trăm nguyên cộng đúng 100, tổng 0 → toàn 0); `axisEvery(days: number): number` (nhãn trục thưa: ≤ 10 ngày → 1, ≤ 31 → 5, còn lại → 7).

- [ ] **Step 1: Write the failing unit tests** (một file test cho mỗi module):
  - `parseVnd`: `'150000'`, `'150.000'`, `'150 000'`, `'1.500.000'`, `'150000đ'`, `' 150.000 ₫ '` → số nguyên đúng (150000, 150000, 150000, 1500000, 150000, 150000); `'1.500'` → 1500; trả `undefined` cho `''`, `'0'`, `'-5'`, `'12,5'`, `'12.5'`, `'150.00'` (dấu chấm chỉ là ngăn cách nghìn nên nhóm sau dấu chấm phải đủ 3 chữ số), `'1e6'`, `'abc'`; không bao giờ trả `NaN`.
  - `toPriceInput`: giá cố định bỏ `reference_price`; nhập giá không gửi `price`, `reference` rỗng → không có `reference_price`; `customer_group` chỉ có khi `category === 'exam'`; `name`/`unit` được cắt khoảng trắng.
  - `priceSummary`: cố định → `Cắt móng · 80.000 ₫ / lần`; nhập giá không gợi ý → `Cắt móng · nhập giá khi lập hóa đơn / lần`; nhập giá có gợi ý → thêm ` (gợi ý 50.000 ₫)`; `priceLabel`: cố định `{ main: '150.000 ₫' }`, nhập giá `{ main: 'Nhập khi lập hóa đơn', hint: 'gợi ý 200.000 ₫' }`, nhập giá không gợi ý không có `hint`; `isDayItemCode('LT01'|'LT03')` đúng, `'LT04'`/`'KB01'` sai; `fixedGroupNote` đúng ba trường hợp.
  - `filterPrices`/`statusCounts`/`categoryCounts`: tìm "kham" thấy "Khám lâm sàng" (không dấu, hoa thường), tìm theo mã "kb01"; lọc nhóm + trạng thái kết hợp; mặc định `active` ẩn mục ngừng dùng; đếm đúng.
  - `revenueView`: `periodRange('today','2026-10-22')` = ngày đó; `'7d'` = 6 ngày trước → hôm nay; `'month'` = ngày 1 → hôm nay; `'prev'` = cả tháng trước (ngày 1 → ngày cuối, kể cả tháng 3 → tháng 2 và tháng 1 → tháng 12 năm trước); `readRange('?tu=2026-10-01&den=2026-10-15', …)` → `custom`; `'?tu=2026-10-16&den=2026-10-22'` = đúng `7d` → trả `7d`; thiếu một đầu, `'?tu=abc&den=2026-10-01'`, `tu > den`, hơn 366 ngày, năm 1999 → `{ period: 'month', … }`; `writeRange` ra chuỗi đúng và `readRange(writeRange(a,b))` quay lại `custom`; `shares([50,30,20])` = `[50,30,20]`; `shares([1,1,1])` cộng 100 (`[34,33,33]`); `shares([0,0])` = `[0,0]`; `shares([100])` = `[100]`; `axisEvery(7)=1`, `axisEvery(30)=5`, `axisEvery(90)=7`.
- [ ] **Step 2: Run to verify RED** — `npx vitest run src/features/staff/pricelist src/features/staff/revenue`. Expected: FAIL (module chưa có).
- [ ] **Step 3: Implement** theo Interfaces. `parseVnd`: bỏ khoảng trắng và hậu tố tiền, chỉ nhận `^\d{1,3}(\.\d{3})*$` hoặc `^\d+$`, rồi `Number`, phải ≥ 1. Tiền qua `formatVnd` (`@/lib/money`); ngày qua `addDays`/`dayOf` (`@/lib/dates`); kiểm hợp lệ khoảng ngày bằng `validateRange` (`@/data/rules/calendar`). `shares`: phương pháp phần dư lớn nhất.
- [ ] **Step 4: Run to verify GREEN** — `npx vitest run src/features/staff/pricelist src/features/staff/revenue && npm run typecheck && npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: pure helpers for the price list and revenue screens`.

---

### Task 2: Bảng giá — bảng chung, tìm và lọc, chế độ chỉ xem

**Files:**
- Modify: `PricesPage.tsx` (viết lại); Create: `Prices.module.css`
- Test: `e2e/giao-dien-nhan-vien-d.spec.ts` (tạo)

**Interfaces:**
- Consumes: Task 1 `filterPrices`, `statusCounts`, `categoryCounts`, `priceLabel`, `isDayItemCode`; `staff.prices.list()`; `DataTable`, `ChipGroup`, `MiniTag`.
- Produces: `PricesPage` (giữ tên export `StaffPrices` qua `index.tsx`); dòng bảng `[data-row]`; ô thao tác dành cho Task 3–4 (chưa có nút).

- [ ] **Step 1: Write the failing e2e** (`test.describe('price list', …)`):
  - "a paged table filtered to the active items by default": `bacsi_mai` mở `/nv/bang-gia`: thấy banner giá minh họa, bảng (`getByRole('table')`), `[data-row]` ≤ 10, phân trang "Phân trang"; radio trạng thái "Đang dùng" được chọn; chip "Ngừng dùng (0)" hiện; không có nút "Sửa", "Thêm dịch vụ"; thấy "Khám lâm sàng" và `150.000 ₫`.
  - "search and category filters combine": ô "Tìm trong bảng giá" gõ "tam say" → chỉ các dịch vụ Spa "Tắm sấy…"; chọn nhóm "Nội trú" → 4 dòng (LT01–LT04); gõ "xyz" → "Không tìm thấy dịch vụ phù hợp." kèm nút "Xóa bộ lọc" bấm được.
  - "open-price items show their hint, day items say what they are for": dòng "Thủ thuật theo chỉ định" có "Nhập khi lập hóa đơn" và "gợi ý 200.000 ₫"; dòng "Nội trú mèo" có "Dùng để tính tiền nội trú".
  - "phones: the table turns into cards and fits @narrow": `fitsDevice`.
- [ ] **Step 2: Run to verify RED** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-d.spec.ts -g "price list" --project=desktop-1440 --project=phone-390`. Expected: FAIL.
- [ ] **Step 3: Implement** theo spec §2 (phần xem): `PageHeader` có đường dẫn, banner, ô tìm, hai `ChipGroup` (nhóm dịch vụ; trạng thái với số đếm), `DataTable` các cột Mã · Tên · Nhóm · Đơn vị · Giá · Trạng thái (cột "Thao tác" thêm ở Task 3–4, chỉ khi `can('pricelist.edit')`); mục ngừng dùng mờ nhẹ; chú thích khách thấy gộp cho mục `customer_group === 'treatment'`; trạng thái lọc giữ khi đổi; rỗng → `EmptyState` + nút "Xóa bộ lọc". Dùng `PRICE_CATEGORY_LABEL`, tone màu như hiện nay.
- [ ] **Step 4: Run to verify GREEN + regression** — như Step 2 cộng `e2e/staff-b.spec.ts -g "price list"` và `--project=phone-320`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: price list as a shared table with search and filters`.

---

### Task 3: Hộp thoại Thêm/Sửa dịch vụ

**Files:**
- Create: `PriceDialog.tsx`; Modify: `PricesPage.tsx` (nút và cột Sửa), `Prices.module.css`
- Test: `e2e/giao-dien-nhan-vien-d.spec.ts`

**Interfaces:**
- Consumes: Task 1 `PriceFormValues`, `toPriceInput`, `parseVnd`, `priceSummary`, `fixedGroupNote`, `isDayItemCode`; `staff.prices.create(input): Promise<string>`, `update(id, version, input)`, `list()`.
- Produces: `PriceDialog({ open, onClose, item?: StaffPriceItem })` — hộp thoại rộng, một biểu mẫu cho thêm và sửa; nút hàng `Sửa {tên}` (`aria-label`) và nút "Thêm dịch vụ" ở đầu trang (chỉ `pricelist.edit`); trong chế độ sửa có ô để Task 4 gắn nút Ngừng dùng/Dùng lại.

- [ ] **Step 1: Write the failing e2e** (`test.describe('add and edit a service', …)`):
  - "add a fixed-price service: it gets a code and shows in the table": `quanly_ha`, "Thêm dịch vụ": chọn Nhóm "Spa & Grooming", Tên "Tắm sấy thỏ", Đơn vị "lần", Giá "120.000"; thấy dòng tóm tắt "Tắm sấy thỏ · 120.000 ₫ / lần"; "Lưu dịch vụ" → toast /Đã thêm dịch vụ [A-Z]{2}\d+\./; tìm "tam say tho" thấy dòng mới với `120.000 ₫`.
  - "add an open-price service with a suggestion": chọn "Nhập khi lập hóa đơn" → ô đổi nhãn thành "Giá gợi ý (₫)"; điền 50.000 → bảng hiện "Nhập khi lập hóa đơn" và "gợi ý 50.000 ₫".
  - "field errors stay under the field and keep what was typed": để trống Tên, Giá "abc" → "Lưu dịch vụ" → lỗi dưới ô Tên và ô Giá (câu của API), các giá trị khác vẫn còn; sửa → lưu được.
  - "edit a price: the category is fixed, the note says old invoices stay": mở "Sửa Khám lâm sàng": Nhóm chỉ hiển thị kèm "Nhóm không đổi được"; thấy "Giá mới chỉ áp dụng cho hóa đơn lập sau. Hóa đơn cũ giữ nguyên."; đổi giá 160.000; toast "Đã lưu dịch vụ KB01."; bảng hiện `160.000 ₫`.
  - "group rules: medicine shows the fixed note, exam offers the choice": thêm mới chọn Thuốc → thấy "Khách thấy gộp trong “Thuốc và vật tư điều trị”." và không có ô chọn; chọn Khám → có radio "Từng dòng"/"Thuốc và vật tư điều trị".
  - "day items cannot become open-price": sửa "Nội trú mèo": radio "Nhập khi lập hóa đơn" bị tắt kèm "Mục tính tiền nội trú không đổi sang nhập giá."
  - "a stale form does not overwrite": tab A mở "Sửa Tái khám"; tab B sửa giá Tái khám và lưu; tab A lưu → /vừa được người khác cập nhật/, hộp thoại đóng, bảng tab A hiện giá của tab B.
  - "an open dialog survives background changes": tab A mở Thêm dịch vụ, gõ tên; tab B thêm một dịch vụ khác; tab A vẫn thấy hộp thoại và chữ đã gõ.
  - "doctors and Spa cannot add or edit" (đã có ở Task 2; kiểm lại `spa_ngocanh`).
- [ ] **Step 2: Run to verify RED** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-d.spec.ts -g "add and edit" --project=desktop-1440 --project=phone-390`. Expected: FAIL.
- [ ] **Step 3: Implement** theo spec §2 (hộp thoại): `PriceFormValues` ban đầu từ `item` (sửa) hoặc mặc định (`exam`, `fixed`, `itemized`); gõ ô giá bỏ ký tự lạ, hiển thị có dấu chấm nghìn khi rời ô; `ChipGroup` Cách tính giá (khóa nhập giá cho LT01–LT03); ô "Khách thấy trong" chỉ khi `category === 'exam'`, các nhóm khác hiện `fixedGroupNote`; `priceSummary` ở chân; gửi `create(toPriceInput(v))` hoặc `update(item.id, version, toPriceInput(v))` với `version` giữ bằng `useState` lúc mở; `ValidationError.fields` → lỗi dưới ô tương ứng (`name`, `unit`, `price`, `reference_price`, `price_mode`, `category`); `ConflictError` → toast `saveError`, đóng; hộp thoại chỉ render theo `open` (khóa bằng `key`), không phụ thuộc dữ liệu nền. Toast thêm dùng mã trả từ `list()` sau khi tạo (tìm theo id trả về).
- [ ] **Step 4: Run to verify GREEN** — như Step 2 cộng `--project=phone-320`, cộng `npm run typecheck && npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: add and edit a service in a dialog`.

---

### Task 4: Ngừng dùng và dùng lại

**Files:**
- Create: `DeactivateDialog.tsx`; Modify: `PricesPage.tsx`, `PriceDialog.tsx`, `Prices.module.css`
- Test: `e2e/giao-dien-nhan-vien-d.spec.ts`

**Interfaces:**
- Consumes: `staff.prices.setActive(id, version, active)`; Task 3 `PriceDialog`; Task 1 `isDayItemCode`.
- Produces: `DeactivateDialog({ open, onClose, item })`; nút hàng `Ngừng dùng {tên}` / `Dùng lại {tên}` (`aria-label`); cùng nút trong hộp thoại Sửa.

- [ ] **Step 1: Write the failing e2e** (`test.describe('switch a service off and on', …)`):
  - "ask first, then the service leaves the active list": `quanly_ha` bấm `Ngừng dùng Chăm sóc tăng cường` → hộp xác nhận chứa "Dịch vụ sẽ không thêm được vào hóa đơn mới" và "Hóa đơn nháp đang có dịch vụ này vẫn lưu được"; "Giữ lại" đóng mà không đổi; "Ngừng dùng" → toast "Đã ngừng dùng Chăm sóc tăng cường."; dòng biến khỏi "Đang dùng", chip "Ngừng dùng (1)"; chọn chip đó thấy dòng kèm nhãn "Ngừng dùng" và nút `Dùng lại Chăm sóc tăng cường`.
  - "switch back on needs no confirmation": bấm `Dùng lại …` → toast "Đã dùng lại Chăm sóc tăng cường." và quay về danh sách đang dùng.
  - "day items cannot be switched off": dòng LT01–LT03 có nút bị tắt kèm "Mục tính tiền nội trú, không tắt được." (`aria-describedby` hoặc nhãn đọc được).
  - "a stale row does not overwrite": tab A bấm Ngừng dùng một dịch vụ và mở xác nhận; tab B sửa giá dịch vụ đó; tab A xác nhận → /vừa được người khác cập nhật/, hộp thoại đóng.
  - "the edit dialog also has the switch": trong "Sửa …" có nút "Ngừng dùng dịch vụ này" cùng hộp xác nhận.
- [ ] **Step 2: Run to verify RED** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-d.spec.ts -g "switch a service" --project=desktop-1440 --project=phone-390`. Expected: FAIL.
- [ ] **Step 3: Implement** theo spec §2 (Ngừng dùng/Dùng lại): xác nhận với `Dialog` (nút "Giữ lại" · "Ngừng dùng"), `setActive` dùng `item.version` lúc mở xác nhận; dùng lại gọi thẳng; LT01–LT03 nút `disabled` kèm lý do hiển thị; toast `Đã ngừng dùng {tên}.` / `Đã dùng lại {tên}.`; xung đột như Task 3.
- [ ] **Step 4: Run to verify GREEN** — như Step 2 cộng `--project=phone-320`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: switch a service off and on with a confirmation`.

---

### Task 5: Doanh thu — chọn kỳ, "Chọn ngày", ba thẻ số, "Cách tính"

**Files:**
- Modify: `RevenuePage.tsx` (viết lại phần đầu trang); Create: `PeriodPicker.tsx`; Modify: `Revenue.module.css`
- Test: `e2e/giao-dien-nhan-vien-d.spec.ts`

**Interfaces:**
- Consumes: Task 1 `Period`, `periodRange`, `readRange`, `writeRange`; `validateRange`, `previousPeriod`, `RANGE_MSG` (`@/data/rules/calendar`); `staff.reports.revenue(range)`; `useSearchParams` (react-router).
- Produces: `PeriodPicker({ period, from, to, onPick, onApply, errors })` — `ChipGroup` Hôm nay · 7 ngày · Tháng này · Tháng trước · Chọn ngày; khi "Chọn ngày" hai ô `Từ ngày`/`Đến ngày` + nút "Xem"; `RevenuePage` đọc/ghi kỳ trên `?tu&den`.

- [ ] **Step 1: Write the failing e2e** (`test.describe('revenue period', …)`):
  - "fixed periods change the numbers": `quanly_ha` mở `/nv/doanh-thu`: radio "Tháng này" chọn sẵn; bấm "7 ngày" → dòng tiêu đề kỳ đổi; `[data-kpi="collected"]` hiện số; thẻ có "so với kỳ trước" hoặc "Kỳ trước chưa có số liệu".
  - "a custom range equal to 7 days shows the same figures": chọn "Chọn ngày" → thấy hai ô; điền Từ ngày = hôm nay − 6, Đến ngày = hôm nay (lấy hôm nay từ `new Date()` theo +07:00 trong test), "Xem" → `[data-kpi="collected"]` bằng số của "7 ngày"; đường dẫn có `?tu=` và `den=`.
  - "a bad range shows the exact message and keeps the numbers": từ > đến → "Ngày kết thúc cần sau hoặc bằng ngày bắt đầu." dưới ô Đến ngày; khoảng 2024-01-01 → 2026-10-22 → "Khoảng ngày tối đa 366 ngày."; từ 1999-12-31 → "Chỉ chọn ngày trong các năm 2000–2100."; ô trống → "Ngày cần đúng dạng năm-tháng-ngày, ví dụ 2026-10-19."; mỗi lần số `[data-kpi="collected"]` không đổi và không có cuộc gọi lỗi.
  - "the period survives a reload": áp khoảng hợp lệ rồi `page.reload()` → vẫn "Chọn ngày" với hai ngày đó; mở `/nv/doanh-thu?tu=abc&den=zzz` → rơi về "Tháng này", không trắng trang.
  - "how it is counted: the note opens and explains the two bases": nút/`<details>` "Cách tính" mở được và chứa "sau giảm giá" và "không theo kỳ".
  - "a period without payments says so": khoảng 2020-01-01 → 2020-01-07 → `[data-kpi="collected"]` chứa "0 ₫" và có "Chưa có khoản thu nào trong kỳ này."
  - Giữ bài cũ ở `staff-b` ("revenue page visible only for quanly_ha…") xanh.
- [ ] **Step 2: Run to verify RED** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-d.spec.ts -g "revenue period" --project=desktop-1440 --project=phone-390`. Expected: FAIL.
- [ ] **Step 3: Implement** theo spec §3 (kỳ, thẻ số, "Cách tính"): `RevenuePage` lấy `{ period, from, to }` từ `readRange(search, todayVN(system.now()))`; chip cố định `setSearchParams` (xóa `tu/den` cho kỳ cố định, đặt cho tùy chọn); áp khoảng: `validateRange({from,to})` có lỗi → đặt lỗi dưới ô tương ứng (`from`/`to`) và **không** đổi đường dẫn; hợp lệ → `writeRange`. Kỳ trước = `previousPeriod(from, to)`. Thẻ số dùng kiểu thẻ chung 4A–4C (giữ `data-kpi`). Trạng thái rỗng khi `collected === 0 && invoicesIssued === 0`. `useQuery` giữ dữ liệu cũ khi đang tải khoảng mới (không nháy trắng).
- [ ] **Step 4: Run to verify GREEN + regression** — như Step 2 cộng `e2e/staff-b.spec.ts -g "revenue"` và `--project=phone-320`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: revenue period picker with a custom range kept in the address`.

---

### Task 6: Doanh thu — biểu đồ ngày, phương thức, nhóm dịch vụ, hóa đơn còn nợ

**Files:**
- Create: `RevenueChart.tsx`, `CategoryBars.tsx`, `OpenInvoices.tsx`; Modify: `RevenuePage.tsx`, `Revenue.module.css`
- Test: `e2e/giao-dien-nhan-vien-d.spec.ts`

**Interfaces:**
- Consumes: Task 1 `shares`, `axisEvery`; `RevenueReport` (`daily`, `byMethod`, `byCategory`, `outstanding`, `outstandingCount`); `staff.invoices.list({ state })`; `DataTable`, `Panel`.
- Produces: `RevenueChart({ daily })` (cột + nút "Xem dạng bảng" → bảng phân trang 10 ngày); `CategoryBars({ byCategory })` (thanh ngang + `[data-share]` mỗi nhóm + nút "Xem nhóm dạng bảng"); `OpenInvoices()` (bảng chung, cũ nhất lên trước, nút Mở khi có `invoices.create`|`payments.record`).

- [ ] **Step 1: Write the failing e2e** (`test.describe('revenue breakdowns', …)`):
  - "the daily chart has a table twin": nút "Xem dạng bảng" → bảng có tiêu đề cột "Ngày" và "Tiền đã thu", tổng các dòng bằng "Tiền đã thu"; "Xem biểu đồ" quay lại; kỳ > 31 ngày (chọn khoảng 60 ngày) bảng phân trang "Phân trang".
  - "category shares add up to 100 and the bars follow": mọi `[data-share]` đọc ra số %, tổng = 100 (khi có tiền); "Xem nhóm dạng bảng" hiện bảng Nhóm · Số tiền · Tỷ lệ có dòng "Tổng", và tổng các nhóm bằng dòng "Tổng".
  - "methods list shows three rows with shares": Tiền mặt · Chuyển khoản · QR, mỗi dòng có %.
  - "outstanding invoices are a paged table, oldest first, with Open links": cột Hóa đơn · Khách hàng · Đã qua · Còn nợ; ngày `Đã qua` không tăng theo chiều đọc xuống; "Mở" đi tới `#/nv/hoa-don/…`; tổng cột Còn nợ khớp 2.975.000 ₫ (cộng các dòng trang; nếu có nhiều trang thì cộng `[data-kpi="outstanding"]` bằng 2.975.000 ₫).
  - "empty period shows the empty chart note instead of empty bars" (đã có ở Task 5; kiểm cả hai biểu đồ).
  - "phones: charts and tables fit 320 px @narrow": `fitsDevice`; "no sideways scroll when the range is 1 year".
- [ ] **Step 2: Run to verify RED** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-d.spec.ts -g "revenue breakdowns" --project=desktop-1440 --project=phone-390`. Expected: FAIL.
- [ ] **Step 3: Implement** theo spec §3 (biểu đồ, phương thức, nhóm, nợ): tách phần biểu đồ hiện có thành `RevenueChart` (một lần vào, giảm chuyển động → hiện ngay; nhãn trục thưa theo `axisEvery`, `title` mỗi cột), `CategoryBars` dùng `shares(...)` rồi hiển thị `%`, bảng thay thế; "Theo phương thức" thêm %; `OpenInvoices` gọi `staff.invoices.list` cho `unpaid` + `partial`, sắp theo `issued_at` tăng dần, cột "Đã qua" = số ngày (`daysBetween`), "Quá N ngày" khi > 10, `Mở` theo quyền. Mọi số tiền `.num`.
- [ ] **Step 4: Run to verify GREEN + regression** — như Step 2 cộng `e2e/staff-b.spec.ts e2e/giao-dien-chu.spec.ts --project=desktop-1440 --project=phone-390 --project=phone-320`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: revenue charts with table twins, shares and an open-invoice table`.

---

### Task 7: Ảnh hưởng lên hóa đơn, quyền, trợ năng và màn nhỏ

**Files:**
- Test: `e2e/giao-dien-nhan-vien-d.spec.ts`; sửa nhỏ `e2e/staff-b.spec.ts` nếu chữ đổi (ghi sổ)

**Interfaces:**
- Consumes: Task 2–6.
- Produces: không có (kiểm thử và sửa lỗi lộ ra).

- [ ] **Step 1: Write the failing e2e** (`test.describe('price changes reach the invoices', …)` và các bài chung):
  - "a new service can be put on a new invoice": `quanly_ha` thêm "Tắm sấy thỏ" 120.000 ₫ (Spa) rồi mở `/nv/hoa-don/moi?khach=cus-05`, `addService(page, 'tam say tho', /Thêm Tắm sấy thỏ/)` → có dòng, tổng gồm 120.000 ₫.
  - "an old invoice keeps the old price": đổi giá "Khám lâm sàng" lên 160.000 ₫ rồi mở `/nv/hoa-don/inv-27` (HD-1027): dòng Khám lâm sàng vẫn `150.000 ₫`; hóa đơn nháp mới chọn Khám lâm sàng ra `160.000 ₫`.
  - "an open-price service starts from its suggestion": thêm dịch vụ nhập giá có gợi ý 50.000 ₫ → trong hóa đơn nháp mới, dòng điền sẵn 50.000 và sửa được.
  - "a switched-off service leaves the picker but a draft that has it still saves": dùng nháp `inv-28` hoặc nháp tự tạo có "Cắt móng" (SP06); tắt SP06; bộ chọn "Thêm dịch vụ" tìm "cat mong" không còn nút thêm (hoặc hiện "Ngừng dùng"); hóa đơn nháp đã có dòng đó vẫn bấm "Lưu nháp" thành công.
  - "Spa and the doctor see the price list read-only and no revenue": `spa_ngocanh` mở Bảng giá không thấy nút; mục "Doanh thu" không có trong menu; `#/nv/doanh-thu` hiện "Mục này dành cho người có quyền phù hợp".
  - "axe finds nothing serious or critical on both pages and both dialogs": quét `#/nv/bang-gia`, hộp thoại Thêm dịch vụ, hộp thoại Ngừng dùng, `#/nv/doanh-thu` với "Chọn ngày" đang mở (mẫu ở `e2e/giao-dien-nhan-vien-c.spec.ts`).
  - "phones: both pages and dialogs fit the device width @narrow".
  - "keyboard: the category chips use arrow keys and Esc closes a dialog, returning focus to its button".
- [ ] **Step 2: Run to verify RED** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-d.spec.ts -g "price changes reach|read-only and no revenue|axe finds|fit the device|keyboard" --project=desktop-1440 --project=phone-390`. Expected: một số bài FAIL cho tới khi sửa lỗi lộ ra (bài xanh ngay thì ghi sổ "pin existing behaviour").
- [ ] **Step 3: Fix** các lỗi hành vi hoặc a11y lộ ra (mỗi lỗi: test tái hiện đã có → sửa nhỏ nhất); cập nhật chữ ở `e2e/staff-b.spec.ts` nếu cần.
- [ ] **Step 4: Run to verify GREEN** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-d.spec.ts e2e/staff-b.spec.ts e2e/a11y.spec.ts e2e/giao-dien-chu.spec.ts --project=desktop-1440 --project=phone-390 --project=phone-320`. Expected: PASS.
- [ ] **Step 5: Commit** — `test: price changes on invoices, permissions, axe and narrow screens`.

---

### Task 8: Hoàn tất

- [ ] **Step 1:** `npm run typecheck && npm run lint && npm test` — sạch, mọi bài đơn vị pass.
- [ ] **Step 2:** Ghi **R41** vào `docs/thiet-ke/QUYET-DINH.md` (Bảng giá: bảng chung, lọc, thêm/sửa bằng hộp thoại, ngừng dùng có xác nhận, LT01–LT03 khóa, giá mới chỉ cho hóa đơn sau; Doanh thu: kỳ cố định + "Chọn ngày" kiểm ở giao diện và lưu trên đường dẫn, hộp "Cách tính", tỷ lệ %, bảng thay thế, hóa đơn nợ dạng bảng; không đổi dữ liệu); cập nhật `PROGRESS.md` (mục giao diện: xong 4D, tiếp trang giới thiệu scrollytelling và phần 5; **thêm vào "Yêu cầu gửi nhánh kia"**: `staff.reports.revenue` chưa kiểm tra khoảng ngày — nên dùng `validateRange` như `operations`), dòng trạng thái `README.md`; cập nhật bảng kiểm thử nghiệp vụ nếu có ô liên quan (sửa giá/ngừng dùng, doanh thu).
- [ ] **Step 3:** `npm run verify` — exit 0, hoặc chỉ đỏ ở các bài **phía khách** phụ thuộc giờ (00:00–~08:00 giờ Việt Nam) đã ghi trong `PROGRESS.md`; mọi bài đỏ khác phải chạy riêng 3 lần và tìm nguyên nhân trước khi kết luận chập chờn.
- [ ] **Step 4:** `npm run build:single`, chép `dist-single/index.html` thành `dist-single/Le-Son-demo.html`; commit `docs: part 4D decisions, progress and status`. Rà soát độc lập toàn nhánh → MỘT đợt sửa → gộp vào nhánh tích hợp → gửi bản HTML **một lần**.
