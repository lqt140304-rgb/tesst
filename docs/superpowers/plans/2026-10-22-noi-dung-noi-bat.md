# Nội dung nổi bật trên trang giới thiệu (dữ liệu) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quản lý và Bác sĩ đăng, sửa, bật/tắt, xóa sản phẩm nổi bật và ca bệnh nổi bật (kèm ảnh tải từ máy); khách vãng lai đọc được các mục đang bật mà không thấy giá, xác nhận đồng ý, người đăng.

**Architecture:** Hàm thuần `rules/content.ts` (giới hạn, kiểm tra nhập, dò số điện thoại và họ tên khách). Hai bảng mới `featured_products`, `featured_cases` (không có mã `XX-0000`). API `mock/api/staff/content.ts` theo khuôn `support.ts`/`stock.ts` (quyền mới `content.publish`, so phiên bản chặt, nhật ký); `PublicApi.featured` chỉ đọc; ảnh đi qua `BlobStore` và `MediaApi.local` như video nhưng mở cho khách khi mục đang bật.

**Tech Stack:** TypeScript 6, Vitest 5, mock store. Không thêm thư viện.

**Spec:** `docs/superpowers/specs/2026-10-22-noi-dung-noi-bat-design.md` (chủ dự án duyệt 22/10/2026).

## Global Constraints

- Chỉ sửa `src/data/**`, `docs/`, `PROGRESS.md`, và `e2e/du-lieu-*.spec.ts` nếu cần. **Không** sửa `src/features`, `src/app`, `src/ui`, `src/styles`.
- Hợp đồng chỉ thêm. Quyền `content.publish` nhãn `Đăng nội dung trang giới thiệu`: Quản lý (có sẵn qua `CAPS`) và Bác sĩ; **Spa không**; cấp lẻ được. Chủ thể luôn lấy từ phiên. Khách, khách vãng lai → `ForbiddenError` ở mọi hàm `staff.content`; `featured.products()/cases()` công khai cho mọi người.
- Giới hạn: sản phẩm tên 1–60, ghi chú 0–120, giá nguyên 0–100.000.000 (đồng); ca bệnh tiêu đề 1–80, câu chuyện 1–600, tên bé 1–30; loại ∈ `food`·`litter`·`accessory`; loài ∈ `dog`·`cat`·`other`; tối đa `FEATURED_MAX = 30` mục mỗi loại (kể cả mục tắt); ảnh `image/*` ≤ `FEATURED_IMAGE_MAX_BYTES = 5 * 1024 * 1024`. Chữ được cắt khoảng trắng đầu cuối trước khi đếm. Khóa lạ (kể cả `__proto__` từ JSON), kiểu sai → `ValidationError` ở đúng ô, **không ghi gì**.
- `FEATURED_SHOW_PRICE = false`: giá được lưu, nhân viên có quyền thấy, **API công khai không trả** (kể cả khi có giá).
- Công khai không bao giờ có: giá (khi tắt), xác nhận đồng ý (`consent_*`), tên người đăng, thời gian, `version`, `visible`. Trả thêm `sample: boolean` để giao diện ghi nhãn "Nội dung mẫu".
- Nhật ký thao tác ghi loại việc và tên mục sản phẩm / tiêu đề ca, **không ghi câu chuyện, ghi chú, giá**.
- Mọi chữ hiển thị tiếng Việt, gọi người dùng là "bạn"; không "quý khách", không "lễ tân". Dữ liệu mẫu: tên có hậu tố " (mẫu)", không thương hiệu thật, không số liệu bịa, không thuốc/liều.
- TDD: test thất bại trước. Commit nhỏ, tiêu đề tiếng Anh; **không ghi tên model vào commit/code/tài liệu** (kể cả dòng `Co-Authored-By` có tên model); thân commit chỉ kết thúc bằng dòng `Claude-Session: https://claude.ai/code/session_01WQRA4c5rpvrJd3fkJ3fRkU`.
- Bài học các giai đoạn trước (áp dụng ngay): gom lỗi trong `Map` rồi `Object.fromEntries`; chép khóa đã biết thay vì trải cả đối tượng gửi lên; so phiên bản **chặt** (`version` phải là số nguyên bằng số đã đọc, không dùng `checkVersion` vì nó cho `undefined` lọt); `db.reloadFromStorage()` trước quyết định "không có gì để làm"; mọi bộ đọc coi dòng đã lưu là không đáng tin (loại/loài lạ → mặc định rõ ràng, không sập).
- Trước khi gộp: `npm run verify` trong `.worktrees/du-lieu` (~20 phút, chạy nền).

## Review Focus

1. **Hình dạng và giới hạn chữ:** không phải chuỗi, chỉ khoảng trắng, đúng/quá giới hạn (60/61, 80/81, 120/121, 600/601, 30/31), loại/loài lạ, khóa lạ kể cả `__proto__`, mảng/đối tượng thay chuỗi, giá âm/thập phân/`NaN`/chuỗi → từ chối đúng ô, không ghi gì (Task 2, 3).
2. **Nội dung nhạy cảm lọt:** tên thuốc hoặc liều trong bất kỳ ô chữ, họ tên khách khác hoa thường/dấu ("nguyen thi lan"), số điện thoại viết kiểu `097 355 51 05`, `0973.555.105`, `+84 973 555 105`, `(097)3555105`; ngược lại "mua 10 kg", năm "2026", giá trong ô giá **không** bị chặn oan (Task 2, 3).
3. **Xác nhận đồng ý:** thiếu, `false`, chuỗi `"true"`, `1` → từ chối cả khi tạo lẫn khi sửa; sửa không bao giờ xóa dấu xác nhận; ghi ai tick và lúc nào (Task 3).
4. **Rò rỉ công khai:** mục tắt không bao giờ ra công khai; ảnh của mục tắt/lạ không phát cho khách vãng lai hay khách (nhân viên có quyền đăng thì xem được); đối tượng công khai không có khóa cấm; giá không lộ kể cả khi bật `FEATURED_SHOW_PRICE` bị đổi ngược (test khóa hằng) (Task 4, 5).
5. **Giới hạn, phiên bản, ảnh hỏng:** mục thứ 31 bị từ chối kể cả khi 30 mục cũ đang tắt; hai người sửa cùng phiên bản → một `ConflictError`; `version` không nguyên bị từ chối; xóa rồi sửa → `NotFoundError`; ảnh lỗi (không phải ảnh, > 5 MB, trình duyệt không lưu được, ghi bản ghi hỏng) không để lại tệp mồ côi; thay ảnh xóa tệp cũ (Task 4).

---

## File Structure

| Tệp (dưới `src/data/`) | Việc |
|---|---|
| `rules/capabilities.ts` (+ test) | quyền `content.publish` (27 quyền) |
| `contracts/enums.ts` | `FEATURED_CATEGORIES` + nhãn |
| `contracts/staff.ts`, `contracts/public.ts` | kiểu, `StaffContentApi`, `PublicApi.featured` |
| `mock/store/schema.ts`, `store/db.test.ts` | `FeaturedProduct`, `FeaturedCase`, hai bảng |
| `mock/seed/content.ts`, `seed/index.ts`, `seed/seed.test.ts` | 4 sản phẩm + 2 ca mẫu |
| `rules/content.ts` (+ test) | giới hạn, kiểm tra nhập, dò nhạy cảm, kiểm tra tệp ảnh |
| `mock/api/staff/content.ts` (+ test), `api/index.ts` | `staff.content` |
| `mock/api/public.ts` (+ test), `src/data/public.ts` | `featured` công khai, facade |
| `mock/api/media.ts`, `store/blobs.ts` (+ `media.test.ts`) | ảnh nổi bật cho khách, dọn tệp mồ côi |

---

### Task 1: Nền chung — quyền, kiểu, bảng, dữ liệu mẫu

**Files:** như bảng trên; tạo `mock/seed/content.ts`.

**Interfaces:**
- Produces: `'content.publish'` thêm **cuối** `CAPS`, `CAP_LABEL['content.publish']` = `'Đăng nội dung trang giới thiệu'`; `PRESETS.bac_si` thêm quyền này (Spa không).
- Produces (`enums.ts`): `FEATURED_CATEGORIES = ['food','litter','accessory'] as const`, `FeaturedCategory`, `FEATURED_CATEGORY_LABEL` = `Thức ăn` · `Cát vệ sinh` · `Phụ kiện`.
- Produces (`schema.ts`):
```ts
export type FeaturedProduct = { id: string; name: string; category: FeaturedCategory; note?: string; price_vnd?: number; image_key?: string; visible: boolean; sample: boolean; created_at: string; created_by_name: string; updated_at: string; updated_by_name: string; version: number };
export type FeaturedCase = { id: string; title: string; story: string; pet_name: string; species: Species; image_key?: string; visible: boolean; sample: boolean; consent_by_name: string; consent_at: string; created_at: string; created_by_name: string; updated_at: string; updated_by_name: string; version: number };
```
  `Tables.featured_products: FeaturedProduct[]`, `Tables.featured_cases: FeaturedCase[]`, cả hai trong `emptyTables`.
- Produces (`seed/content.ts`): `seedContent(c: SeedCtx)` đẩy 4 sản phẩm (`food` ×2, `litter`, `accessory`; tên như "Thức ăn hạt cho chó trưởng thành (mẫu)", "Cát vệ sinh cho mèo (mẫu)", "Dây dắt chó cỡ vừa (mẫu)", "Ổ nằm cho mèo (mẫu)"; một cái có `note`, một có `price_vnd` để thử lọc giá; một mục `visible:false`) và 2 ca (loài chó và mèo, tên bé hiển thị như "Bông" / "Mướp", câu chuyện 2–3 câu chung chung không thuốc không số; cả hai `visible:true`), `sample:true`, `created_by_name` = "Nguyễn Thu Hà", `consent_*` đủ, `version:1`, thời điểm bằng `c.ago(...)`; gọi trong `buildSeed`.

- [ ] **Step 1: Write the failing tests** — `capabilities.test.ts`: 27 quyền; `content.publish` có ở Quản lý và Bác sĩ, không ở Spa; `effectiveCaps` của Spa + `extra_capabilities:['content.publish']` có quyền. `db.test.ts`: tài liệu cũ thiếu `featured_products` và `featured_cases` được lấp từ seed của test (test seed thêm 1 sản phẩm + 1 ca); bảng có mà rỗng giữ rỗng. `seed.test.ts` ("featured content seed"): đúng 4 sản phẩm và 2 ca, mọi mục `sample === true`, mọi tên/tiêu đề kết thúc " (mẫu)", id duy nhất, `category`/`species` hợp lệ, có đúng 1 sản phẩm tắt, mọi ca có `consent_by_name` và `consent_at` không rỗng, không chữ nào chứa tên thuốc trong `price_items` loại `medicine` (so không phân biệt hoa thường).
- [ ] **Step 2: Run to verify fail** — `npx vitest run src/data/rules/capabilities.test.ts src/data/mock/store/db.test.ts src/data/mock/seed/seed.test.ts` → FAIL.
- [ ] **Step 3: Implement** quyền + preset, enums, kiểu và bảng (`emptyTables`), `seedContent` + `buildSeed`; sửa mọi test đếm quyền/bảng khác bị ảnh hưởng.
- [ ] **Step 4: Run to verify pass** — `npm test && npm run typecheck && npx eslint src/data` → PASS.
- [ ] **Step 5: Commit** — `feat: content.publish permission, featured tables and sample content`.

---

### Task 2: Quy tắc thuần `rules/content.ts`

**Files:** Create `rules/content.ts`, `rules/content.test.ts`; Modify `contracts/staff.ts` (hai kiểu nhập).

**Interfaces:**
- Consumes: `FEATURED_CATEGORIES`, `SPECIES` (enums).
- Produces:
```ts
export const FEATURED_MAX = 30;
export const FEATURED_IMAGE_MAX_BYTES: number;      // 5 * 1024 * 1024
export const FEATURED_SHOW_PRICE: boolean;          // false
export const isImageKey: (key: string) => boolean;  // key.startsWith('local:img-')
export const CONTENT_MSG: { shape; unknown; name; category; note; price; title; story; petName; species; consent; limit; notImage; tooBig; storage; phone; customerName; medicine } // câu tiếng Việt, mỗi ô một câu
export function validateProductInput(input: unknown): Record<string, string>;
export function validateCaseInput(input: unknown): Record<string, string>;
export function sensitiveHits(text: string, customerNames: readonly string[]): { phone: boolean; names: string[] };
export function imageFileProblem(file: { type: string; size: number }): string | null;
```
  Task 2 thêm vào `contracts/staff.ts` hai kiểu nhập (Task 3 dùng lại):
```ts
export type FeaturedProductInput = { name: string; category: FeaturedCategory; note?: string; priceVnd?: number };
export type FeaturedCaseInput = { title: string; story: string; petName: string; species: Species; consent: boolean };
```

- [ ] **Step 1: Write the failing tests** — `validateProductInput`: hợp lệ trả `{}`; từng ô ở biên (`name` 60/61, `note` 120/121 và `note: undefined` ok, `priceVnd` 0 / 100000000 ok, -1 / 1.5 / `NaN` / `'5'` / 100000001 lỗi); khóa lạ (`{...ok, extra: 1}` và JSON `{"__proto__":1}` qua `JSON.parse`) báo đúng khóa; không phải đối tượng / mảng / `null` → `{ product: CONTENT_MSG.shape }`. `validateCaseInput` tương tự (80/81, 600/601, 30/31, loài lạ, `consent` phải đúng `true`: `false`, `'true'`, `1`, thiếu → lỗi ở `consent`). `sensitiveHits`: `'Gọi 097 355 51 05'`, `'0973.555.105'`, `'+84 973 555 105'`, `'(097)3555105'` → `phone:true`; `'mua 10 kg năm 2026'`, `'12345678'` (8 số) → `phone:false`; tên `['Nguyễn Thị Lan']` khớp `'chị nguyen thi lan dắt bé'` và `'NGUYỄN THỊ LAN'` → `names:['Nguyễn Thị Lan']`, không khớp `'Lan'`; tên ngắn hơn 5 ký tự bị bỏ qua. `imageFileProblem`: `image/png` 5 MB đúng → null, 5 MB + 1 → `tooBig`, `video/mp4` / `''` → `notImage`; `isImageKey('local:img-x')` đúng, `'local:abc'`, `'meo-tam-the'` sai.
- [ ] **Step 2: Run to verify fail** — `npx vitest run src/data/rules/content.test.ts` → FAIL.
- [ ] **Step 3: Implement** theo khuôn `rules/support.ts` (`Map`, `KNOWN`, `text(v,min,max)`); `sensitiveHits`: bỏ `[\s.\-()]` rồi tìm `\+?\d{9,}`; tên so sau khi gấp dấu và hoa thường bằng một hàm `fold` nhỏ viết ngay trong file này (NFD, bỏ dấu kết hợp, `đ`→`d`; `rules/` không nhập từ `mock/api`).
- [ ] **Step 4: Run to verify pass** — `npx vitest run src/data/rules/content.test.ts && npm run typecheck && npx eslint src/data` → PASS.
- [ ] **Step 5: Commit** — `feat: featured content rules (limits, sensitive text, image file)`.

---

### Task 3: `staff.content` — sản phẩm và ca bệnh (chữ)

**Files:**
- Create: `mock/api/staff/content.ts`, `mock/api/staff/content.test.ts`
- Modify: `contracts/staff.ts`, `mock/api/index.ts` (thêm `content: staffContentApi(env)` vào `staff`)

**Interfaces:**
- Consumes: Task 1, 2; `staffActor`, `audit`, `find` (`api/staff/common`), `lintCustomerText` (`api/staff/inpatient`), `newId`, `sleepRead/sleepWrite`, `toIsoVN`.
- Produces (`contracts/staff.ts`; hai kiểu `Featured*Input` đã có từ Task 2):
```ts
export type StaffFeaturedProductRow = { id: string; name: string; category: FeaturedCategory; note?: string; priceVnd?: number; imageKey?: string; visible: boolean; sample: boolean; updatedAt: string; updatedByName: string; version: number };
export type StaffFeaturedCaseRow = { id: string; title: string; story: string; petName: string; species: Species; imageKey?: string; visible: boolean; sample: boolean; consentByName: string; consentAt: string; updatedAt: string; updatedByName: string; version: number };
export interface StaffContentList<Row, Input> {
  /** `content.publish`. Newest first. */
  list(): Promise<Row[]>;
  /** New items start visible. Returns the id. Over `FEATURED_MAX` items (hidden ones count) → ValidationError. */
  create(input: Input): Promise<string>;
  update(id: string, version: number, input: Input): Promise<void>;
  setVisible(id: string, version: number, visible: boolean): Promise<void>;
  remove(id: string, version: number): Promise<void>;
  /** Task 4. `null` removes the picture. */
  setImage(id: string, version: number, file: Blob | null): Promise<void>;
}
export interface StaffContentApi { products: StaffContentList<StaffFeaturedProductRow, FeaturedProductInput>; cases: StaffContentList<StaffFeaturedCaseRow, FeaturedCaseInput> }
```
- Produces: `export function lintPublicText(text: string, doc: Readonly<Doc>): string[]` trong `content.ts` (dùng chung với Task 5 nếu cần): gộp `lintCustomerText` + `sensitiveHits(text, doc.t.customers.map((c) => c.full_name))` thành danh sách đoạn bị bắt.

- [ ] **Step 1: Write the failing tests** — `content.test.ts` (dùng `createMockApi` như `support.test.ts`, đăng nhập `quanly_ha`, `bacsi_duc`, `spa_ngocanh`): **quyền** (Quản lý, Bác sĩ qua được; Spa, khách, khách vãng lai → `ForbiddenError` ở `list` và `create`; Spa + quyền cấp lẻ qua được); **tạo sản phẩm** (có trong `list` đầu tiên, `visible:true`, `sample:false`, `version:1`, `updatedByName` = tên người tạo, nhật ký có hành động `content.product.create` mà `summary_vi` chứa tên sản phẩm và không chứa ghi chú/giá); **tạo ca** (cần `consent:true`; thiếu → `ValidationError` có khóa `consent`, bảng không đổi; `consentByName/consentAt` đúng); **sửa** (đúng phiên bản → `version`+1, `updatedAt` mới; phiên bản cũ → `ConflictError`; `version: 1.5` / `'1'` / `undefined` → bị từ chối, không ghi; sửa ca với `consent:false` bị từ chối và giữ nguyên dấu cũ; id lạ → `NotFoundError`); **nhạy cảm** (mỗi ô chữ chứa tên một thuốc có thật trong `price_items` loại `medicine`, một liều "5 mg", họ tên một khách mẫu viết thường không dấu, số `097 355 51 05` → `ValidationError` ở đúng ô, không ghi gì; "mua 10 kg năm 2026" qua được; ô giá không bị dò chữ); **giới hạn** (seed + tạo thêm tới đủ 30 sản phẩm → mục 31 lỗi `limit`, kể cả khi 30 mục đang tắt; xóa một mục thì tạo lại được); **bật/tắt** và **xóa** (phiên bản chặt, nhật ký `content.product.visible` / `content.product.remove`; xóa xong sửa → `NotFoundError`); hai lần `setVisible` cùng phiên bản → đúng một thành công; `list` trả hàng đã lưu hỏng một cách an toàn (loại lạ → `food`, loài lạ → `other`, chữ thiếu → rỗng) — ghi thẳng vào `db` bằng `transact` để dựng.
- [ ] **Step 2: Run to verify fail** — `npx vitest run src/data/mock/api/staff/content.test.ts` → FAIL.
- [ ] **Step 3: Implement** `staffContentApi(env): StaffContentApi` theo khuôn `staffSupportApi`: chép đúng các khóa đã biết, kiểm tra bằng `validate*Input` rồi lint từng ô chữ bằng `lintPublicText` (ô nào dính → lỗi ở ô đó với câu `CONTENT_MSG.medicine`/`phone`/`customerName`), kiểm tra giới hạn và so phiên bản **trong** `db.transact`; một hàm dựng danh sách dùng chung cho hai loại (generic theo bảng) để khỏi lặp `setVisible`/`remove`; `list` trả mới nhất trước theo `created_at`.
- [ ] **Step 4: Run to verify pass** — `npx vitest run src/data/mock/api/staff/content.test.ts && npm test && npm run typecheck && npx eslint src/data` → PASS.
- [ ] **Step 5: Commit** — `feat: staff.content products and cases (create, edit, show/hide, remove)`.

---

### Task 4: Ảnh — tải lên, phát cho khách, dọn tệp mồ côi

**Files:**
- Modify: `mock/api/staff/content.ts` (`setImage`), `mock/api/media.ts`, `mock/store/blobs.ts` (không tạo ảnh khung đầu cho tệp không phải video: `if (video.type.startsWith('video/'))` mới gọi `firstFrameJpeg`), `contracts/api.ts` (chỉ cập nhật chú thích của `LocalMedia`/`MediaApi.local`: khóa `local:img-…` trả ảnh trong trường `video`)
- Test: `mock/api/staff/content.test.ts` (thêm), `mock/api/media.test.ts` (thêm)

**Interfaces:**
- Consumes: Task 2 (`imageFileProblem`, `isImageKey`, `CONTENT_MSG`), `env.media: BlobStore`.
- Produces: `setImage` ở cả `products` và `cases`: khóa mới `local:img-${newId()}`; thứ tự **tệp trước, bản ghi sau**, bản ghi hỏng thì xóa tệp mới; thành công thì xóa tệp cũ (nếu có); `file === null` xóa ảnh. `MediaApi.local(key)` với `isImageKey(key)`: ai cũng đọc được nếu có mục `visible` mang `image_key === key`; nhân viên có `content.publish` đọc được ảnh của mọi mục; còn lại `NotFoundError` (khách vãng bị `ForbiddenError` như cũ cho khóa không phải ảnh). `cleanOrphanBlobs` giữ khóa ảnh của mọi mục nổi bật (cả mục tắt).

- [ ] **Step 1: Write the failing tests** — **tải ảnh**: PNG 1 KB qua; `image_key` bắt đầu `local:img-`, `env.media.get(key)` có tệp; ghi lại thì tệp cũ biến mất; `setImage(…, null)` xóa khóa và tệp; tệp `video/mp4`, `''`, 5 MB + 1 → `ValidationError({file})` và `media.keys()` không đổi; `memoryBlobStore({available:false})` → lỗi `CONTENT_MSG.storage`, không ghi; bản ghi lỗi (phiên bản cũ → `ConflictError`) **xóa tệp mới đã đưa vào**; Spa/khách → `ForbiddenError`. **Phát ảnh** (`media.test.ts`): mục bật → khách vãng lai, khách và nhân viên Spa đều lấy được; mục tắt → khách vãng lai/khách/Spa nhận `NotFoundError`, Bác sĩ lấy được; khóa ảnh chưa gắn mục nào → `NotFoundError` cho khách, `null` cho Bác sĩ. **Dọn mồ côi**: `cleanOrphanBlobs` giữ ảnh của mục tắt, xóa `local:img-` không gắn mục nào, vẫn xóa/giữ video như cũ. Gọi `isLocalKey` của ảnh vẫn đúng (cùng tiền tố `local:`).
- [ ] **Step 2: Run to verify fail** — `npx vitest run src/data/mock/api/media.test.ts src/data/mock/api/staff/content.test.ts` → FAIL.
- [ ] **Step 3: Implement** `setImage` trong lõi dùng chung của Task 3, nhánh ảnh trong `mediaApi.local` (đặt trước nhánh theo vai trò), `cleanOrphanBlobs`, và điều kiện `video/` ở `browserBlobStore.put` (không có test tự động vì cần IndexedDB thật; ghi rõ trong ledger).
- [ ] **Step 4: Run to verify pass** — `npm test && npm run typecheck && npx eslint src/data` → PASS.
- [ ] **Step 5: Commit** — `feat: featured content pictures (upload, public playback, orphan clean-up)`.

---

### Task 5: Công khai `featured` và rò rỉ

**Files:**
- Modify: `contracts/public.ts`, `mock/api/public.ts`, `src/data/public.ts`
- Test: `mock/api/public.test.ts` (thêm), `mock/api/customer/leak.test.ts` (thêm một khối)

**Interfaces:**
- Consumes: Task 1; `FEATURED_SHOW_PRICE`.
- Produces:
```ts
export type PublicFeaturedProduct = { id: string; name: string; category: FeaturedCategory; note?: string; imageKey?: string; sample: boolean };
export type PublicFeaturedCase = { id: string; title: string; story: string; petName: string; species: Species; imageKey?: string; sample: boolean };
// PublicApi: featured: { products(): Promise<PublicFeaturedProduct[]>; cases(): Promise<PublicFeaturedCase[]> }
// src/data/public.ts: export const featured = api.public.featured;
```
  Chỉ mục `visible`, mới nhất trước, đọc được khi chưa đăng nhập; `imageKey` chỉ có khi mục có ảnh; loại/loài lạ trong dòng hỏng đọc thành `food`/`other`.

- [ ] **Step 1: Write the failing tests** — `public.test.ts`: chưa đăng nhập đọc được; mục tắt không có; sau `setVisible(…, true)` thì có, sau `false` thì mất; thứ tự mới nhất trước; `Object.keys` của từng phần tử **đúng bằng** danh sách cho phép (không `price`, `priceVnd`, `visible`, `version`, `consent*`, `*ByName`, `updatedAt`); sản phẩm có giá vẫn không lộ giá, và test khóa `FEATURED_SHOW_PRICE === false`; mục mẫu có `sample:true`, mục nhân viên đăng `sample:false`; `JSON.stringify` toàn bộ kết quả không chứa tên nhân viên nào trong `staff_users` và không chứa chuỗi "consent". `leak.test.ts`: đăng nhập khách (`lan_nguyen`) vẫn chỉ thấy phần công khai và gọi `staff.content.*` → `ForbiddenError`; nhân viên Spa đọc `featured` được nhưng `staff.content.cases.list()` bị từ chối.
- [ ] **Step 2: Run to verify fail** — `npx vitest run src/data/mock/api/public.test.ts src/data/mock/api/customer/leak.test.ts` → FAIL.
- [ ] **Step 3: Implement** `featured` trong `publicApi` (một hàm chiếu chung đọc bảng, lọc `visible`, sắp mới nhất, chép đúng các khóa cho phép), kiểu trong `contracts/public.ts`, facade `featured`.
- [ ] **Step 4: Run to verify pass** — `npm test && npm run typecheck && npx eslint src/data` → PASS.
- [ ] **Step 5: Commit** — `feat: public featured products and cases (visible only, no price or consent)`.

---

### Task 6: Tài liệu, verify, rà soát, gộp

**Files:** `PROGRESS.md` (chỉ mục nhánh dữ liệu), `README.md` nếu có bảng quyền/hợp đồng, `CLAUDE.md` chỉ nếu cần dòng quyền mới.

- [ ] **Step 1:** Cập nhật `PROGRESS.md`: việc đã làm; **Thay đổi hợp đồng** (các kiểu ở Task 1, 3, 5, quyền `content.publish`, `MediaApi.local` trả ảnh cho khóa `local:img-`); **Yêu cầu gửi nhánh kia**: (a) màn "Nội dung trang giới thiệu" cho Quản lý/Bác sĩ — tạo/sửa/bật tắt/xóa, tải ảnh, ô tick đồng ý, hiện lỗi theo ô (thuốc, họ tên khách, số điện thoại); (b) hai mục trên trang giới thiệu đọc `featured.products()/cases()`, ghi nhãn "Nội dung mẫu" khi `sample`, khung "Ảnh minh họa" khi thiếu `imageKey`, ảnh lấy qua `media.local(imageKey)` (trường `video` là tệp ảnh); (c) chưa hiện giá; (d) nút ẩn theo `can('content.publish')`.
- [ ] **Step 2:** `npm run verify` trong nền (vòng chờ), đọc kết quả thật; sửa nếu đỏ (build lại trước e2e nếu chạy riêng; kiểm ngân sách JS).
- [ ] **Step 3:** Rà soát độc lập (Agent opus, đưa mã và mục Review Focus, không đưa kết luận); sửa lỗi thật **test trước**; chạy lại bài liên quan.
- [ ] **Step 4:** Gộp: `git fetch origin && git merge origin/claude/focused-pascal-rfxnnp` ở nhánh dữ liệu (giữ cả hai phía nếu `PROGRESS.md` xung đột), kiểm `npm run typecheck && npm test`, rồi ở thư mục gốc `git merge --ff-only origin/claude/focused-pascal-rfxnnp && git merge --no-ff claude/du-lieu`, push cả hai nhánh.
- [ ] **Step 5: Commit** — `docs: featured content progress, contract changes and requests`.
