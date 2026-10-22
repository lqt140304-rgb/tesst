# Phần 5A — Khu nhân viên: Kho — Kế hoạch thực hiện

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm mục **Kho** cho nhân viên: danh sách có ô tóm tắt và bộ lọc, trang chi tiết có lịch sử nhập xuất, và các hộp thoại Thêm/Sửa món, Nhập thêm, Xuất ra, Kiểm kê, Ngừng dùng/Dùng lại.

**Architecture:** Chỉ lớp giao diện trong `src/features/staff/stock/`; dữ liệu qua `staff.stock.*` (hợp đồng đã có, **không đổi**), kiểm tra nhập và câu báo lỗi dùng lại `@/data/rules/stock` (như `priceForm.ts` dùng `@/data/rules/*`). Logic có điều kiện tách thành hai tệp hàm thuần có test (`stockForm.ts`, `stockView.ts`); trang và hộp thoại chỉ ghép lại. Mẫu lấy từ 4D (Bảng giá): một biểu mẫu = một hộp thoại, mở với `version`, `ConflictError` → toast + đóng.

**Tech Stack:** React 19, TypeScript, react-router (hash, `useSearchParams`), CSS Modules + tokens, Vitest, Playwright. Không thêm thư viện.

**Spec:** `docs/superpowers/specs/2026-10-22-phan-5a-nhan-vien-kho-design.md`.

## Global Constraints

- Mọi chữ hiển thị bằng tiếng Việt; không "quý khách", không "lễ tân"; số, mã, ngày dùng class `.num`; số lẻ dùng dấu phẩy (`formatQty`).
- Quyền: `stock.view` thấy mục Kho/danh sách/chi tiết; nút ghi chỉ hiện khi `can('stock.manage') && can('stock.view')`. Kiểm ở API **và** ẩn nút (`useSession().can`). Kho không bao giờ hiện cho khách.
- Quy tắc dữ liệu giữ nguyên, không viết lại ở giao diện: số tồn chỉ đổi bằng Nhập/Xuất/Kiểm kê; không đổi loại khi sửa; tên không trùng trong cùng loại; món ngừng dùng không nhập/xuất/kiểm kê; số lượng nguyên 0 – 1.000.000.
- Ghi dữ liệu gửi **`version` lúc mở hộp thoại**; `ConflictError` → toast `saveError(e)`, đóng hộp thoại (dữ liệu tự tải lại). Lỗi trường lấy từ `ValidationError.fields`; kiểm tra phía giao diện dùng đúng `validate*` + `STOCK_MSG` của `@/data/rules/stock`.
- Câu cố định (copy nguyên): "Kho chỉ còn N <đơn vị>." · "Số đếm trùng số tồn, chưa có gì để điều chỉnh." · "Món đã ngừng dùng. Bật lại trước khi nhập hoặc xuất." · "Không đổi được loại của món này." · "Muốn đổi số tồn, dùng Nhập thêm, Xuất ra hoặc Kiểm kê." · "Hiện tối đa 100 lần gần nhất."
- Thẻ bo `--r-card` (12 px), nút/ô `--r-control` (6 px); màu chỉ qua token; chuyển động một lần, 150–450 ms, tôn trọng `prefers-reduced-motion`; 320 px không cuộn ngang; tương phản ≥ 4,5:1; nhãn tình trạng luôn có chữ (không chỉ màu).
- Không đổi `src/data/**`. Cần đổi hợp đồng → dừng, ghi `PROGRESS.md` "Yêu cầu gửi nhánh kia".
- Commit tiêu đề tiếng Anh `feat:`/`test:`/`docs:`, không ghi tên model. Viết test trước.

## Seed facts (đã tính từ `src/data/mock/seed/stock.ts`, hôm nay = ngày chạy)

14 món, 13 đang dùng. Đang dùng: **Hết hàng** 1 (Thuốc nhỏ mắt (mẫu), 0 lọ) · **Sắp hết** 3 (Dịch truyền Ringer lactat 5/10, Bơm kim tiêm 5 ml 70/100, Băng cuộn 10/15) · **Sắp hết hạn** 1 (Thuốc tẩy giun (mẫu), hạn +20 ngày) · **Đã hết hạn** 1 (Dung dịch sát khuẩn, hạn −10 ngày, còn 5 chai). Thuốc đang dùng 6, vật tư 7. Món ngừng dùng: Vitamin tổng hợp (mẫu) (3 hộp, mức 3). `summary()` = `{ total: 13, low: 3, out: 1, expiringSoon: 1, expired: 1 }`. Bộ lọc `expiring` của API gồm cả sắp hết lẫn đã hết hạn (= 2 món). Nước muối sinh lý 0,9 %: 25 chai, mức 10.

## Review Focus

1. Số gõ vào ô số lượng: "1.000", " 25 ", "2,5", "abc", "-3", "1e3", "", "0", "1.000.001" — không bao giờ ra `NaN`/số lẻ/âm trong dữ liệu gửi đi; chữ không đọc được hiện đúng câu `STOCK_MSG` (Task 1, 6).
2. Hai tab cùng sửa/nhập một món: tab sau nhận "vừa được người khác cập nhật", hộp thoại đóng, không ghi đè (Task 5, 6).
3. Xuất đúng bằng số tồn → "Hết hàng"; xuất quá → "Kho chỉ còn N …"; nhập làm tổng vượt 1.000.000 → báo lỗi, không ghi (Task 6).
4. Mức báo hết = 0: không bao giờ "Sắp hết" nhưng vẫn "Hết hàng" khi tồn 0; hạn dùng đúng hôm nay / ngày biên của "sắp hết hạn" / hôm qua cho câu giải thích đúng (Task 2).
5. Địa chỉ hỏng (`?tt=abc&loai=x`), mở `#/nv/kho/id-khong-co`, món ngừng dùng mở trực tiếp bằng địa chỉ: không vỡ trang, có lối về danh sách, ba nút nhập/xuất/kiểm kê khóa (Task 2, 4, 6).

---

## File structure

`src/features/staff/stock/`: `stockForm.ts` · `stockView.ts` · `StockPage.tsx` · `StockSummaryTiles.tsx` · `StockLevelTag.tsx` · `StockItemPage.tsx` · `MoveHistory.tsx` · `StockItemDialog.tsx` · `StockReceiveDialog.tsx` · `StockIssueDialog.tsx` · `StockAdjustDialog.tsx` · `StockActiveDialog.tsx` · `Stock.module.css` — hàm thuần có `*.test.ts` cạnh file.
Sửa: `src/features/staff/shell/StaffShell.tsx` (NAV), `src/features/staff/index.tsx`, `src/app/router.tsx`, `src/app/routes.ts`, `src/features/staff/ui.tsx` + `Staff.module.css` (tone `rose` cho `MiniTag`), `scripts/duotone-icons.mjs` + `src/ui/icons/names.ts` + `duotone.generated.ts` (icon `package`), `e2e/manifest.ts`.
Test: `e2e/giao-dien-nhan-vien-e.spec.ts` (mới).

---

### Task 1: `stockForm.ts` — đọc số gõ vào và dựng dữ liệu gửi đi

**Files:**
- Create: `src/features/staff/stock/stockForm.ts`
- Test: `src/features/staff/stock/stockForm.test.ts`

**Interfaces:**
- Consumes: `StockInput, StockReceiveInput, StockIssueInput, StockAdjustInput` (`@/data/staff`); `validateStockInput, validateReceive, validateIssue, validateAdjust` (`@/data/rules/stock`); `StockKind, StockIssueReason` (`@/data/contracts/enums`).
- Produces:
  - `parseQty(text: string): number | undefined` — số nguyên không âm; chấp nhận khoảng trắng hai đầu và dấu chấm ngăn nghìn đúng nhóm ba ("1.000", "1.000.000"); trả `undefined` cho rỗng, "2,5", "2.5", "-3", "1e3", "abc", "1.00".
  - `type ItemFormValues = { name: string; kind: StockKind; unit: string; qty: string; minQty: string; expiresOn: string }`
  - `type ReceiveFormValues = { qty: string; supplier: string; note: string; expiresOn: string }`
  - `type IssueFormValues = { qty: string; reason: StockIssueReason; note: string }`
  - `type AdjustFormValues = { counted: string; note: string }`
  - `toStockInput(v: ItemFormValues, mode: 'create' | 'update', active?: boolean): StockInput` — `qty` chỉ khi `create`; số không đọc được → `Number.NaN` (để `validate*` báo đúng câu); `expires_on` là `''` khi ô trống; `name/unit` đã `trim`; `active` chỉ đưa vào khi được truyền.
  - `toReceiveInput(v)`, `toIssueInput(v)`, `toAdjustInput(v)` — cùng quy tắc; `supplier/note/expires_on` trống → bỏ khỏi đối tượng (`undefined`).
  - `itemErrors(v, mode)`, `receiveErrors(v, onHand: { qty: number })`, `issueErrors(v, onHand: { qty: number; unit: string })`, `adjustErrors(v, onHand: { qty: number })` → `Record<string, string>` (rỗng = hợp lệ), gọi `validate*` trên đầu vào đã dựng; khóa lỗi của kiểm kê giữ nguyên `counted_qty` như API để `Field` gắn đúng.
  - `suggestedMin(setting: number | undefined): string` — chuỗi cho ô "Mức báo hết": `String(setting)` nếu là số nguyên ≥ 0, ngược lại `'5'`.

- [ ] **Step 1: Viết test (đỏ)** — `describe('parseQty')`: "25" → 25; " 25 " → 25; "1.000" → 1000; "1.000.000" → 1000000; "0" → 0; `''`, "2,5", "2.5", "-3", "1e3", "abc", "1.00", "1.0000" → `undefined`. `describe('toStockInput')`: create gửi `qty`, update **không có khóa `qty`**; "abc" ở `minQty` → `min_qty` là `NaN` và `itemErrors(...).min_qty === STOCK_MSG.minQty`; `expiresOn: ''` → `expires_on: ''`; tên " Gạc " → "Gạc"; `active` truyền `false` → `active: false`, không truyền → không có khóa. `describe('receiveErrors')`: "1.000.001" trên tồn 5 → `qty === STOCK_MSG.tooMany`... (1.000.001 không đọc được vì quá lớn? `parseQty` vẫn trả số; `validateReceive` báo `moveQty` do >1.000.000 — assert đúng `STOCK_MSG.moveQty`); "0" → `moveQty`; ghi chú 201 ký tự → `noteLong`. `describe('issueErrors')`: "30" trên tồn 25 chai → `Kho chỉ còn 25 chai.`; đúng 25 → `{}`. `describe('adjustErrors')`: đếm = tồn → `countedSame`; "abc" → `counted`; "0" khi tồn 5 → `{}`. `describe('suggestedMin')`: 5 → "5"; 0 → "0"; `undefined`/-1/2.5 → "5".
- [ ] **Step 2: Chạy, thấy đỏ** — `npx vitest run src/features/staff/stock/stockForm.test.ts` — Expected: FAIL (module chưa có).
- [ ] **Step 3: Cài `stockForm.ts`** theo Interfaces ở trên; `parseQty` dùng hai biểu thức chính quy (`^\d+$` và `^\d{1,3}(\.\d{3})+$`).
- [ ] **Step 4: Chạy, thấy xanh** — cùng lệnh — Expected: PASS.
- [ ] **Step 5: Commit** — `git add src/features/staff/stock && git commit -m "feat: stock form helpers (quantity parsing and validation)"`.

---

### Task 2: `stockView.ts` — bộ lọc trên địa chỉ, nhãn, câu giải thích

**Files:**
- Create: `src/features/staff/stock/stockView.ts`
- Test: `src/features/staff/stock/stockView.test.ts`

**Interfaces:**
- Consumes: `StockRow, StockMoveRow, StockListFilter, StockSummary` (`@/data/staff`); `StockKind, StockLevel, ExpiryState, StockStatusFilter` (`@/data/contracts/enums`); `daysBetween, formatDateVi` (`@/lib/dates`); `formatQty` (`@/lib/units`); `Cap` (`@/data/rules/capabilities`).
- Produces:
  - `type StockFilters = { q: string; kind: StockKind | 'all'; status: StockStatusFilter; showInactive: boolean }`; `DEFAULT_FILTERS`.
  - `readFilters(p: URLSearchParams): StockFilters` — tham số `q`, `loai` (`thuoc|vat-tu`), `tt` (`sap-het|het|han`), `ngung` (`1`); giá trị lạ bị bỏ qua (rơi về mặc định).
  - `writeFilters(f: StockFilters): URLSearchParams` — bỏ tham số bằng mặc định (địa chỉ gốc sạch).
  - `toListFilter(f: StockFilters): StockListFilter` — `q` đã `trim` (rỗng → bỏ), `kind` bỏ khi `'all'`, `status` bỏ khi `'all'`, `includeInactive` khi `showInactive`.
  - `type TileKey = 'low' | 'out' | 'soon' | 'expired'`; `TILE_STATUS: Record<TileKey, StockStatusFilter>` (`low→low, out→out, soon→expiring, expired→expiring`); `tilePressed(f: StockFilters, key: TileKey): boolean`; `tileCount(sum: StockSummary, key: TileKey): number`; `tileLabel(sum, key): string` → "Sắp hết: 3 món" (nhãn đọc cho `aria-label`).
  - `levelLabel(l: StockLevel): string` ("Ổn" / "Sắp hết" / "Hết hàng"); `levelTone(l): 'teal' | 'orange' | 'rose'`; `expiryLabel(e: ExpiryState): string | undefined` ("Sắp hết hạn" / "Đã hết hạn" / `undefined`).
  - `statusSentence(item: StockRow, today: string): string | undefined` — thứ tự ưu tiên: hết hàng → "Đã hết hàng."; sắp hết → "Còn 3 hộp, thấp hơn mức báo hết 5." (dùng `qty <= minQty` như quy tắc: câu là "Còn {qty} {unit}, bằng hoặc thấp hơn mức báo hết {minQty}." khi `qty === minQty`); rồi hạn dùng: đã hết hạn → "Hết hạn từ 12/10/2026." (`formatDateVi`); sắp hết hạn → "Còn 20 ngày nữa hết hạn." / hạn đúng hôm nay → "Hết hạn hôm nay."; ổn và không hạn → `undefined`. Khi vừa thiếu hàng vừa hết hạn, trả **hai câu nối bằng một khoảng trắng**.
  - `moveDelta(m: StockMoveRow): { text: string; tone: 'in' | 'out' }` — "+30" / "−8" (dấu trừ U+2212), `tone` theo dấu `delta`.
  - `receivePreview(onHand: number, qty: number | undefined, unit: string): string | undefined` → "Tồn sau khi nhập: 55 chai" (`undefined` khi qty không hợp lệ); `issuePreview(...)` → "Tồn sau khi xuất: 17 chai" (`undefined` khi qty không hợp lệ hoặc lớn hơn tồn); `adjustDiff(onHand: number, counted: number | undefined, unit: string): { text: string; tone: 'same' | 'up' | 'down' } | undefined` — "Lệch −2 chai so với sổ." / "Lệch +3 chai so với sổ." / "Khớp sổ."
  - `stockCaps(can: (c: Cap | Cap[]) => boolean): { view: boolean; manage: boolean }` — `manage` chỉ khi có cả `stock.manage` và `stock.view`.

- [ ] **Step 1: Viết test (đỏ)** — mỗi hàm một `describe` với các giá trị trên: `readFilters(new URLSearchParams('tt=abc&loai=x&ngung=2'))` bằng `DEFAULT_FILTERS`; `writeFilters` của bộ lọc mặc định có `toString() === ''`; vòng đi về `write → read` giữ nguyên cho `{ q: 'gạc', kind: 'vat_tu', status: 'low', showInactive: true }`; `toListFilter` bỏ `q` toàn khoảng trắng; `tilePressed` đúng cho cả `soon` và `expired` khi `status === 'expiring'`; `levelTone('out') === 'rose'`; `statusSentence` bốn ca biên: mức báo hết 0 và tồn 3 → `undefined` (không "sắp hết"), tồn 0 mức 0 → "Đã hết hàng.", hạn = hôm nay → "Hết hạn hôm nay.", hạn = hôm qua → "Hết hạn từ …", hạn = hôm nay + 30 với `soon` → "Còn 30 ngày nữa hết hạn."; `moveDelta` dùng U+2212; `issuePreview(25, 30, 'chai') === undefined`; `adjustDiff(20, 18, 'chai').text === 'Lệch −2 chai so với sổ.'`, `adjustDiff(20, 20, 'chai').tone === 'same'`; `stockCaps` với chỉ `stock.view` → `{ view: true, manage: false }`, chỉ `stock.manage` → `{ view: false, manage: false }`.
- [ ] **Step 2: Chạy, thấy đỏ** — `npx vitest run src/features/staff/stock/stockView.test.ts` — Expected: FAIL.
- [ ] **Step 3: Cài `stockView.ts`** theo Interfaces.
- [ ] **Step 4: Chạy, thấy xanh; chạy cả hai test của thư mục** — `npx vitest run src/features/staff/stock` — Expected: PASS.
- [ ] **Step 5: Commit** — `feat: stock view helpers (filters in the address, labels, sentences)`.

---

### Task 3: Mục Kho ở thanh bên và màn danh sách

**Files:**
- Create: `src/features/staff/stock/StockPage.tsx`, `StockSummaryTiles.tsx`, `StockLevelTag.tsx`, `Stock.module.css`
- Modify: `scripts/duotone-icons.mjs` (thêm `'package': 'Package'`), `src/ui/icons/names.ts` (thêm `'package'` vào `LUCIDE_ICONS`), chạy `npm run icons` (cập nhật `duotone.generated.ts`); `src/features/staff/ui.tsx` (`MiniTag` thêm tone `'rose'`) và `Staff.module.css` (`.tag_rose { background: var(--rose-100); color: var(--rose-700); }`); `src/app/routes.ts` (`nv.stock: '/nv/kho'`, bí danh `'nv-kho'`); `src/app/router.tsx` (route `kho` → `StaffStock`, `cap: 'stock.view'`, `pageKey: 'nv.stock'`, title "Kho"); `src/features/staff/index.tsx` (`export { StockPage as StaffStock }`); `StaffShell.tsx` `NAV` (`{ key: 'stock', to: paths.nv.stock, label: 'Kho', icon: 'package', cap: 'stock.view' }` đặt sau Hóa đơn, trước Bảng giá); `e2e/manifest.ts` (`{ zone: 'staff', slug: 'kho', route: '/nv/kho', as: 'quanly_ha' }`).
- Test: `e2e/giao-dien-nhan-vien-e.spec.ts` (mới)

**Interfaces:**
- Consumes: `staff.stock.summary()`, `staff.stock.list(f)` (`@/data/staff`); Task 2 (`readFilters, writeFilters, toListFilter, TileKey, tilePressed, tileCount, tileLabel, levelLabel, levelTone, expiryLabel, stockCaps`); `DataTable, ChipGroup, EmptyState, Banner, Button, CountUp, Icon` (`@/ui`); `PageHeader, LoadingBlocks, PageProblem, MiniTag` (`../ui`).
- Produces: `StockPage()`; `StockSummaryTiles({ summary, filters, onPick }: { summary: StockSummary; filters: StockFilters; onPick: (key: TileKey) => void })` — bốn `button` `aria-pressed`, `aria-label` = `tileLabel`, `data-kpi="stock-low|stock-out|stock-soon|stock-expired"`, số chạy bằng `CountUp`, 0 thì nhạt; `StockLevelTag({ item }: { item: StockRow })` — nhãn tình trạng + nhãn hạn dùng + nhãn "Ngừng dùng" (xám) khi `!item.active`; nút **Thêm món** chỉ làm ở Task 5 (ở đây chưa hiện).

- [ ] **Step 1: Viết e2e (đỏ)** trong `e2e/giao-dien-nhan-vien-e.spec.ts` (dùng `openStaff`, `staffMain as main`, `fitsDevice` như `giao-dien-nhan-vien-d.spec.ts`; ba cỡ màn hình): `describe('stock list')`:
  - *Quản lý thấy kho mẫu*: `/nv/kho` as `quanly_ha` → tiêu đề "Kho"; bốn nút có tên "Sắp hết: 3 món", "Hết hàng: 1 món", "Sắp hết hạn: 1 món", "Đã hết hạn: 1 món" (sau `settled` đối với `CountUp`); hàng đầu tiên chứa "Thuốc nhỏ mắt (mẫu)" và "Hết hàng"; phân trang "Phân trang" có (13 món / 10 mỗi trang); không có chữ "Vitamin tổng hợp".
  - *Bấm ô lọc*: bấm "Sắp hết: 3 món" → đúng 3 hàng, nút `aria-pressed="true"`; bấm lại → bỏ lọc; bấm "Sắp hết hạn: 1 món" → 2 hàng (cả "Thuốc tẩy giun (mẫu)" và "Dung dịch sát khuẩn") và ô "Đã hết hạn" cũng `aria-pressed="true"`; chip lọc **Sắp hoặc đã hết hạn** được chọn.
  - *Tìm và lọc*: gõ "nuoc muoi" (không dấu) → một hàng "Nước muối sinh lý 0,9 %" có "25 chai" và "Ổn"; xóa, chọn **Thuốc** → 6 hàng; **Vật tư** → 7; bật "Hiện cả món đã ngừng dùng" + tìm "Vitamin" → một hàng có nhãn "Ngừng dùng"; tìm "xyz" → "Chưa có món nào khớp." và nút **Bỏ lọc** đưa về mặc định.
  - *Giữ bộ lọc trên địa chỉ*: bấm "Hết hàng: 1 món", làm mới trang (`page.reload()`) → vẫn một hàng và nút vẫn `aria-pressed`; mở `#/nv/kho?tt=abc&loai=x` → hiện đủ danh sách mặc định, không lỗi.
  - *Phân quyền*: `bacsi_mai` và `spa_ngocanh` không thấy liên kết "Kho" trong `nav "Khu nhân viên"`; vào thẳng `/nv/kho` thấy tiêu đề "Mục này dành cho người có quyền phù hợp"; `quanly_ha` thấy liên kết "Kho" **sau** "Hóa đơn" và **trước** "Bảng giá".
  - *Điện thoại* `@narrow`: bảng thành thẻ, `fitsDevice(page)`; bốn ô tóm tắt không tràn.
- [ ] **Step 2: Build và chạy, thấy đỏ** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-e.spec.ts --project=desktop-1440` — Expected: FAIL (chưa có route Kho).
- [ ] **Step 3: Cài đặt** theo "Files": thêm icon rồi chạy `npm run icons` (kiểm tra `Icon.test.ts`/`icons.test.ts` vẫn xanh); tone `rose`; đường dẫn, route lazy, `NAV`, manifest; `StockPage` dùng `useSearchParams` → `readFilters`, `useQuery(() => staff.stock.list(toListFilter(f)), [JSON.stringify(f)])` và `useQuery(() => staff.stock.summary(), [])`; bấm ô tóm tắt: bấm khi đang bật đúng bộ lọc đó → về `'all'`, ngược lại đặt `status = TILE_STATUS[key]`; thay đổi bộ lọc dùng `setSearchParams(writeFilters(next), { replace: true })`; bảng `DataTable` với cột **Mã** (class `num`), **Tên** (`primary`, bấm mở `paths.nv.stock/:id` qua `onOpen` — liên kết chi tiết hoàn thiện ở Task 4), **Loại** (`hideOnPhone`), **Tồn** (`formatQty(qty) + ' ' + unit`, `num`), **Mức báo hết** (`—` khi 0, `hideOnPhone`), **Hạn dùng** (`formatDateVi` hoặc `—`, `hideOnPhone`), **Tình trạng** (`StockLevelTag`); `key` của `DataTable` đổi theo bộ lọc để về trang 1; trạng thái rỗng và tải/lỗi như spec §3; banner "Dữ liệu kho trong bản demo là dữ liệu mẫu."
- [ ] **Step 4: Chạy, thấy xanh** — build lại rồi `npx playwright test e2e/giao-dien-nhan-vien-e.spec.ts` (cả ba cỡ) — Expected: PASS; `npm run typecheck && npm run lint && npm test` xanh.
- [ ] **Step 5: Commit** — `feat: staff stock list with summary tiles and filters`.

---

### Task 4: Trang chi tiết một món và lịch sử nhập xuất

**Files:**
- Create: `src/features/staff/stock/StockItemPage.tsx`, `MoveHistory.tsx`
- Modify: `src/app/routes.ts` (`nv.stockItem: (id: string) => \`/nv/kho/${id}\``), `src/app/router.tsx` (route `kho/:id` → `StaffStockItem`, `cap: 'stock.view'`, `pageKey: 'nv.stock-item'`, title "Chi tiết kho"), `src/features/staff/index.tsx`, `Stock.module.css`, `e2e/manifest.ts` (`{ slug: 'kho-chi-tiet', route: '/nv/kho/stock-1', as: 'quanly_ha' }`)
- Test: `e2e/giao-dien-nhan-vien-e.spec.ts`

**Interfaces:**
- Consumes: `staff.stock.get(id): Promise<StockDetail>` (`NotFoundError` khi lạ); Task 2 (`statusSentence, moveDelta, stockCaps`); `StockLevelTag` (Task 3); `PageHeader` với `parent={{ label: 'Kho', to: paths.nv.stock }}`.
- Produces: `StockItemPage()`; `MoveHistory({ moves }: { moves: StockMoveRow[] })`; vùng nút hành động `<div data-stock-actions>` (rỗng ở task này, các task sau thêm nút) hiện khi `stockCaps(can).manage`.

- [ ] **Step 1: Viết e2e (đỏ)**: `describe('stock item')`:
  - *Chi tiết món* `/nv/kho/stock-1` as `quanly_ha`: tên "Nước muối sinh lý 0,9 %", mã "KHO-0001", "25" và "chai", nhãn **Ổn**; bảng lịch sử có tiêu đề cột Ngày giờ · Loại · Thay đổi · Tồn sau · Lý do · Ghi chú · Người làm; dòng đầu (mới nhất) có "−8" và "Dùng tại phòng khám", dòng cuối có "+60" và "Nhập hàng" và "Nhà cung cấp mẫu"; "Thay đổi" luôn có dấu (+/−).
  - *Câu giải thích*: `/nv/kho/stock-5` (Thuốc nhỏ mắt) có "Đã hết hàng."; `/nv/kho/stock-4` (Dung dịch sát khuẩn) có "Hết hạn từ " (ngày Việt); `/nv/kho/stock-3` có "ngày nữa hết hạn".
  - *Từ danh sách*: bấm hàng "Nước muối…" ở danh sách → vào chi tiết; breadcrumb "Kho" quay lại và giữ bộ lọc đang có.
  - *Món lạ*: `/nv/kho/khong-co` hiện "Không tìm thấy món này" và liên kết **Về danh sách Kho**.
  - *Chỉ xem*: không có nút ghi nào (vùng `data-stock-actions` không có `button`) cho `quanly_ha` ở task này — kiểm lại ở Task 5/6; ghi chú trong test rằng trường hợp "chỉ có `stock.view`" kiểm ở `stockCaps` (Task 2) và e2e của 5C.
  - *Điện thoại* `@narrow`: lịch sử thành thẻ, `fitsDevice`.
- [ ] **Step 2: Build và chạy, thấy đỏ** — `npm run build && npx playwright test e2e/giao-dien-nhan-vien-e.spec.ts -g "stock item" --project=desktop-1440` — Expected: FAIL.
- [ ] **Step 3: Cài đặt** theo "Files": `useQuery(() => staff.stock.get(id), [id])`; lỗi `NotFoundError` → khối "Không tìm thấy món này" (kiểm `error instanceof NotFoundError`, các lỗi khác → `PageProblem`); thẻ thông tin (tồn số lớn + đơn vị, mức báo hết, hạn dùng, loại, đơn vị) và dòng `statusSentence(item, todayVN(new Date()))`; `MoveHistory` dùng `DataTable` (10/trang) với cột theo spec §4, "Loại" dùng `STOCK_MOVE_KIND_LABEL`, "Lý do" dùng `STOCK_REASON_LABEL`, "Ghi chú" = nhà cung cấp và/hoặc ghi chú; dòng cuối "Hiện tối đa 100 lần gần nhất." khi đủ 100.
- [ ] **Step 4: Chạy, thấy xanh** — build lại, `npx playwright test e2e/giao-dien-nhan-vien-e.spec.ts` (cả ba cỡ); `npm run typecheck && npm run lint && npm test`.
- [ ] **Step 5: Commit** — `feat: stock item page with movement history`.

---

### Task 5: Hộp thoại Thêm / Sửa món

**Files:**
- Create: `src/features/staff/stock/StockItemDialog.tsx`
- Modify: `StockPage.tsx` (nút **Thêm món**), `StockItemPage.tsx` (nút **Sửa thông tin**), `Stock.module.css`
- Test: `e2e/giao-dien-nhan-vien-e.spec.ts`

**Interfaces:**
- Consumes: `staff.stock.create(input): Promise<string>`, `staff.stock.update(id, version, input): Promise<void>`, `staff.settings.get()` (chỉ để đọc `stock_default_min`; lỗi/không quyền → bỏ qua); Task 1 (`ItemFormValues, toStockInput, itemErrors, suggestedMin`); `Dialog, Field, Input, ChipGroup, Button, useToast`; `FormError, saveError`.
- Produces: `StockItemDialog({ open, onClose, item, onSaved }: { open: boolean; onClose: () => void; item?: StockRow; onSaved?: (id: string) => void })` — một biểu mẫu cho cả thêm và sửa; sửa thì **loại khóa**, **không có ô số lượng**, và giữ `active` hiện tại (truyền `item.active` vào `toStockInput`); mở với `version = item?.version` (`useState` một lần); `StockPage` truyền `onSaved = (id) => navigate(paths.nv.stockItem(id))` khi thêm.

- [ ] **Step 1: Viết e2e (đỏ)**: `describe('stock add and edit')`:
  - *Thêm món hợp lệ*: **Thêm món** → hộp thoại "Thêm món": ô "Mức báo hết" có sẵn `5`; điền Tên "Kim lấy máu (mẫu)", chọn Vật tư, Đơn vị "cái", Số lượng ban đầu "40", Mức báo hết "10", Hạn dùng bỏ trống → **Lưu món** → toast "Đã thêm món KHO-0015." (mã kế tiếp), chuyển sang trang chi tiết món mới có "40" "cái" và nhãn **Ổn**.
  - *Lỗi từng ô*: để trống tên/đơn vị → "Vui lòng nhập tên món." và "Vui lòng nhập đơn vị, ví dụ: viên, ống, hộp." dưới đúng ô; Số lượng "2,5" → "Số tồn cần là số nguyên từ 0 đến 1.000.000."; Hạn dùng "31/03/2027" → "Hạn dùng cần đúng dạng năm-tháng-ngày, ví dụ 2027-03-31."; tên trùng ("Găng tay y tế", Vật tư) → "Món này đã có trong kho."
  - *Sửa món*: ở chi tiết "Băng cuộn" → **Sửa thông tin**: chip Loại bị khóa kèm "Không đổi được loại của món này.", không có ô số lượng, có dòng "Muốn đổi số tồn, dùng Nhập thêm, Xuất ra hoặc Kiểm kê."; đổi Mức báo hết thành "5" → lưu → toast, nhãn tình trạng đổi từ **Sắp hết** sang **Ổn** (tồn 10 > 5); đặt Mức báo hết "0" → vẫn **Ổn**, không bao giờ "Sắp hết".
  - *Xung đột phiên bản*: mở hộp thoại Sửa ở tab A; ở tab B sửa cùng món rồi lưu; ở tab A lưu → toast chứa "vừa được người khác cập nhật", hộp thoại đóng, dữ liệu tab B hiện, tab A không ghi đè.
  - *Phân quyền*: `quanly_ha` thấy **Thêm món**; không có tài khoản nào khác thấy mục Kho (đã kiểm ở Task 3).
  - *Bàn phím*: mở **Thêm món** bằng Enter, `Escape` đóng và tiêu điểm về nút **Thêm món**.
- [ ] **Step 2: Build và chạy, thấy đỏ** — `npx playwright test e2e/giao-dien-nhan-vien-e.spec.ts -g "stock add and edit" --project=desktop-1440` — Expected: FAIL.
- [ ] **Step 3: Cài đặt** `StockItemDialog` (chip Loại bằng `ChipGroup`, `Field` + `Input inputMode="numeric"` cho số, `Input` thường cho hạn dùng với gợi ý "Ví dụ: 2027-03-31. Bỏ trống nếu không có hạn."); `save()` theo mẫu `PriceDialog.save` (busy, `ValidationError` → `errors`, `ConflictError` → toast + `onClose()`); kiểm tra nhanh phía giao diện bằng `itemErrors` trước khi gọi API (lỗi trùng tên đến từ API); `key` của hộp thoại theo `item?.id ?? 'new'` ở nơi gọi như `PricesPage`.
- [ ] **Step 4: Chạy, thấy xanh** — build lại, chạy cả file ở ba cỡ; `npm run typecheck && npm run lint && npm test`.
- [ ] **Step 5: Commit** — `feat: add and edit stock items`.

---

### Task 6: Nhập thêm, Xuất ra, Kiểm kê

**Files:**
- Create: `StockReceiveDialog.tsx`, `StockIssueDialog.tsx`, `StockAdjustDialog.tsx`
- Modify: `StockItemPage.tsx` (ba nút trong `data-stock-actions`, khóa khi `!item.active` kèm dòng "Món đã ngừng dùng. Bật lại trước khi nhập hoặc xuất."), `Stock.module.css`
- Test: `e2e/giao-dien-nhan-vien-e.spec.ts`

**Interfaces:**
- Consumes: `staff.stock.receive(id, version, input)`, `.issue(...)`, `.adjust(...)`; Task 1 (`ReceiveFormValues, IssueFormValues, AdjustFormValues, toReceiveInput, toIssueInput, toAdjustInput, receiveErrors, issueErrors, adjustErrors, parseQty`); Task 2 (`receivePreview, issuePreview, adjustDiff`); `STOCK_ISSUE_REASONS`, `STOCK_REASON_LABEL`.
- Produces: `StockReceiveDialog / StockIssueDialog / StockAdjustDialog({ open, onClose, item }: { open: boolean; onClose: () => void; item: StockRow })` — mỗi hộp thoại mở với `version = item.version` (một lần), toast thành công kiểu "Đã nhập thêm 30 chai vào Nước muối sinh lý 0,9 %." / "Đã xuất 8 chai …" / "Đã kiểm kê … tồn nay là 18 chai."; dòng xem trước theo Task 2; xuất quá tồn: lỗi hiện dưới ô số lượng nhưng nút Lưu vẫn bấm được (API cũng trả lỗi đó).

- [ ] **Step 1: Viết e2e (đỏ)**: `describe('stock movements')` trên "Nước muối sinh lý 0,9 %" (25 chai, `stock-1`) — mỗi test thêm dữ liệu riêng nên chạy độc lập:
  - *Nhập thêm*: nhập "30", nhà cung cấp "Công ty mẫu", ghi chú → dòng "Tồn sau khi nhập: 55 chai" hiện khi gõ; Lưu → toast; chi tiết hiện 55; dòng lịch sử đầu: Nhập · +30 · 55 · Nhập hàng · "Công ty mẫu"; hạn dùng lô mới "2030-01-01" không đổi hạn gần hơn đã có (món vẫn giữ hạn cũ).
  - *Số sai*: "abc" → "Số lượng cần là số nguyên từ 1 đến 1.000.000."; "0" → cùng câu; nhập "999.999" khi tồn 25 → "Số tồn sau khi nhập vượt 1.000.000."; không ghi gì.
  - *Xuất ra*: quá tồn ("30") → "Kho chỉ còn 25 chai." dưới ô, không đổi tồn; "8" + lý do Hư hỏng → tồn 17, dòng Xuất · −8 · 17 · Hư hỏng; xuất đúng bằng số tồn ("17") → nhãn **Hết hàng** và câu "Đã hết hàng."
  - *Kiểm kê*: hiện "Tồn trên sổ: 25 chai"; gõ "23" → "Lệch −2 chai so với sổ."; gõ "25" rồi Lưu → "Số đếm trùng số tồn, chưa có gì để điều chỉnh."; "23" + Lưu → tồn 23, dòng Kiểm kê · −2 · 23 · Kiểm kê; "0" hợp lệ.
  - *Xung đột*: tab A mở Nhập thêm, tab B xuất một ít và lưu, tab A lưu → toast "vừa được người khác cập nhật", hộp thoại đóng, tồn tab B hiện đúng, không ghi đè.
  - *Món đã ngừng dùng* mở bằng địa chỉ (bật "Hiện cả món đã ngừng dùng" rồi mở "Vitamin tổng hợp (mẫu)", id `stock-7`): ba nút khóa (`disabled`) và dòng "Món đã ngừng dùng. Bật lại trước khi nhập hoặc xuất."
  - *Trợ năng*: `axe` không lỗi khi một hộp thoại đang mở; điện thoại `@narrow`: hộp thoại toàn màn hình, không cuộn ngang.
- [ ] **Step 2: Build và chạy, thấy đỏ** — `npx playwright test e2e/giao-dien-nhan-vien-e.spec.ts -g "stock movements" --project=desktop-1440` — Expected: FAIL.
- [ ] **Step 3: Cài đặt** ba hộp thoại theo mẫu `StockItemDialog` (chung phần `save`/Conflict; không trích hàm dùng chung nếu chỉ lặp vài dòng); lý do xuất bằng `ChipGroup` mặc định `dung_tai_phong`; kiểm kê hiện "Tồn trên sổ" và câu báo trước "Lưu xong, số tồn sẽ thành số bạn đếm và một dòng Kiểm kê được ghi vào lịch sử."; nút khóa dùng `disabled` thật và `aria-describedby` trỏ dòng giải thích.
- [ ] **Step 4: Chạy, thấy xanh** — build lại, chạy cả file ở ba cỡ; `npm run typecheck && npm run lint && npm test`.
- [ ] **Step 5: Commit** — `feat: receive, issue and stock-take dialogs`.

---

### Task 7: Ngừng dùng / Dùng lại, hoàn thiện và tài liệu

**Files:**
- Create: `StockActiveDialog.tsx`
- Modify: `StockItemPage.tsx` (nút **Ngừng dùng** / **Dùng lại**), `Stock.module.css`; `docs/thiet-ke/QUYET-DINH.md` (R42), `PROGRESS.md` (mục `claude/giao-dien`), `README.md` (hàng trạng thái 5A), `docs/tham-khao/bang-kiem-thu-nghiep-vu-2026-10-21.md` (hàng Kho)
- Test: `e2e/giao-dien-nhan-vien-e.spec.ts`

**Interfaces:**
- Consumes: `staff.stock.update(id, version, input)` với đầu vào dựng bằng `toStockInput` từ chính các giá trị của món + `active` đảo; `Dialog, Button, useToast`.
- Produces: `StockActiveDialog({ open, onClose, item }: { open: boolean; onClose: () => void; item: StockRow })` — xác nhận một bước, câu nói trước hậu quả đúng spec §5.5; `Dùng lại` không hỏi lại (làm ngay như `reactivate` của Bảng giá), `Ngừng dùng` hỏi.

- [ ] **Step 1: Viết e2e (đỏ)**: `describe('stock on and off')`: ngừng dùng "Khẩu trang y tế" → hộp thoại nói "Món sẽ ẩn khỏi danh sách mặc định và không nhập hay xuất được. Lịch sử và số tồn được giữ." → xác nhận → toast; trang chi tiết hiện nhãn **Ngừng dùng**, ba nút khóa; ở danh sách mặc định món biến mất và ô tóm tắt không đếm nó; bật "Hiện cả món đã ngừng dùng" thì thấy lại; **Dùng lại** → làm ngay, nhập thêm được; ngừng dùng một món đang **Sắp hết** làm ô "Sắp hết" giảm 1 (rồi dùng lại để trả về); xung đột phiên bản như Task 5. Thêm `describe('stock accessibility')`: `axe` không lỗi trên danh sách, chi tiết và một hộp thoại mở; bàn phím: Tab tới ô tóm tắt, Space bật lọc; `@narrow` 320 px: danh sách và chi tiết không cuộn ngang.
- [ ] **Step 2: Build và chạy, thấy đỏ** — `npx playwright test e2e/giao-dien-nhan-vien-e.spec.ts -g "stock on and off" --project=desktop-1440` — Expected: FAIL.
- [ ] **Step 3: Cài đặt** `StockActiveDialog` và nút; viết tài liệu: R42 trong `QUYET-DINH.md` (Kho: ai thấy gì, ô tóm tắt, bộ lọc hết hạn gộp, Thêm/Sửa không đổi loại và số tồn, Nhập/Xuất/Kiểm kê, ngừng dùng thay xóa, không biểu đồ/in); `PROGRESS.md` (xong 5A, việc tiếp theo 5B, cadence gửi HTML sau mỗi phần nhỏ); `README.md` hàng trạng thái; hàng Kho trong bảng kiểm thử nghiệp vụ.
- [ ] **Step 4: Chạy toàn bộ** — `npm run verify` — Expected: exit 0 (ghi lại số test; nếu các test phía khách lỗi vì giờ Việt Nam từ 00:00 – 08:00, đó là lỗi cũ đã biết: chạy lại ban ngày hoặc ghi rõ trong báo cáo).
- [ ] **Step 5: Commit** — `feat: switch stock items off and on; docs for part 5A`.

---

## Self-review

- **Phủ spec:** §1 quyền → Task 2 (`stockCaps`), 3, 5–7; §2 lối vào/địa chỉ/bộ lọc trên địa chỉ → Task 2–3; §3 danh sách → Task 3; §4 chi tiết → Task 4; §5 hộp thoại 1–5 → Task 5, 6, 7; §6 cấu trúc → File structure; §7 trợ năng → Task 6–7 (axe, bàn phím, 320 px, `aria-pressed`); §8 kiểm thử → từng task; manifest → Task 3–4; §9 chờ chủ dự án → ghi ở Task 7 `PROGRESS.md`.
- **Chênh với spec (ghi sổ khi chạy):** spec §8 ghi "14 món, thấy 14 trừ món ngừng dùng" — thực tế 13 đang dùng, 14 khi bật "Hiện cả món đã ngừng dùng" (đã sửa ở Seed facts). Ca "chỉ có quyền xem" không thử được bằng giao diện (màn cấp quyền thuộc 5C) → kiểm ở `stockCaps`.
- **Nhất quán tên:** `StockFilters`/`TileKey`/`stockCaps`/`toStockInput`/`itemErrors` định nghĩa ở Task 1–2 và dùng đúng tên ở Task 3–7.
