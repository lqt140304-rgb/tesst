# Phần 5 · Giai đoạn 5 — Cài đặt C: cài đặt hệ thống (dữ liệu) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quản lý chỉnh được vài con số và công tắc chung của bản demo (`staff.settings.get` / `update`), và lớp dữ liệu **thật sự dùng** chúng: số ngày báo sắp hết hạn của Kho, phương thức thanh toán đang bật, ngưỡng "quá hạn" của yêu cầu đặt lịch. Các giá trị còn lại (thời lượng mặc định, giờ lưới lịch, ngưỡng kho mặc định) được lưu và cung cấp cho giao diện.

**Architecture:** Hàm thuần `rules/app-settings.ts` (mặc định, luật từng trường, gộp bản vá, mô tả giá trị cho nhật ký). Bảng `app_settings` một dòng `main` có `version`; đọc luôn gộp mặc định dưới giá trị đã lưu (thiếu dòng = mặc định, phiên bản 1). API mở rộng `staffSettingsApi` (đã có `hospital`). Ba chỗ dùng: `toRow` của Kho nhận số ngày, `payments.record` kiểm phương thức, thẻ yêu cầu thêm `overdue`.

**Tech Stack:** TypeScript 6, Vitest 5, mock store. Không thêm thư viện.

**Spec:** `docs/superpowers/specs/2026-10-21-phan-5-kho-bao-cao-cai-dat-design.md` (§3.0, §3.3.C, §6). Chủ dự án đã duyệt 21/10/2026 (các số mặc định theo §7 câu 2).

## Global Constraints

- Chỉ sửa `src/data/**`, `docs/`, `PROGRESS.md`. **Không** sửa `src/features`, `src/app`, `src/ui`, `src/styles`.
- Hợp đồng chỉ thêm (kể cả `StaffRequestCard.overdue`). Quyền mới `settings.manage` ("Quản lý cài đặt hệ thống"): **chỉ Quản lý có sẵn** (`quan_ly: CAPS`); Bác sĩ và Spa không đổi. Đọc cài đặt: mọi nhân viên đang dùng; khách và khách vãng lai bị `ForbiddenError`.
- Giá trị hay khóa lạ → `ValidationError` ở đúng trường, **không ghi gì**. `update(version, patch)` kiểm phiên bản (`ConflictError`). Mỗi trường **thật sự đổi** ghi một dòng nhật ký (không nhạy cảm): `<tên người> đổi "<tên cài đặt>" từ <A> sang <B>`. Bản vá không đổi gì: không ghi, không tăng phiên bản.
- Chỉ đưa vào cài đặt thứ lớp dữ liệu dùng hoặc cung cấp cho giao diện; các số mặc định là mặc định của bản demo, không phải số liệu của bệnh viện. `fixedRules` (chỉ xem): video tối đa 15 giây và 20 MB, tự xóa sau 60 ngày; thanh toán tại quầy.
- Mặc định (một nơi, `DEFAULT_SETTINGS`): `stock_expiry_days` 30 · `stock_default_min` 5 · `default_duration_kham` 30 · `default_duration_spa` 60 · `calendar_start` `07:00` · `calendar_end` `21:00` · `payment_methods` cả 3 · `request_overdue_hours` 24. (`calendar_end` là 21:00, không phải 20:00 như bảng spec, vì lưới lịch hiện có chạy 07:00–21:00 — `START_H`/`END_H` ở `gridMath.ts`; thời lượng 30 và 60 khớp `SERVICE_MINUTES`.)
- TDD: test thất bại trước. Commit nhỏ, tiêu đề tiếng Anh; **không ghi tên model vào commit/code/tài liệu**; thân commit chỉ kết thúc bằng dòng `Claude-Session: https://claude.ai/code/session_01WQRA4c5rpvrJd3fkJ3fRkU`.
- Bài học từ giai đoạn 4 (áp dụng ngay, không đợi rà soát): gom lỗi trong `Map` rồi `Object.fromEntries` (gán `errors['__proto__']` vào `{}` bị nuốt); duyệt mảng bằng `Array.from(...)` (mảng thưa); chép khóa đã biết thay vì trải cả bản vá (bỏ ký hiệu `Symbol`, `__proto__` riêng); gọi `db.reloadFromStorage()` trước khi quyết định "không có gì để làm" dựa trên bản đọc cũ của tab.
- Trước khi gộp: `npm run verify` trong `.worktrees/du-lieu` (~15 phút). Bài `giao-dien-nhan-vien-c.spec.ts:369` (tải video từ máy) của bên giao diện đang đỏ sẵn, không liên quan.

## Review Focus

1. **Bản vá lạ:** khóa lạ (kể cả `constructor`, `__proto__` riêng từ JSON), số dạng chuỗi (`'30'`), số lẻ, `NaN`, `Infinity`, `payment_methods` không phải mảng / mảng thưa / có phương thức lạ / rỗng / trùng → từ chối đúng khóa, không ghi gì (Task 1, 2).
2. **Phiên bản:** hai tab cùng gửi với một phiên bản → một thành công, một `ConflictError`; bản vá không đổi gì không tăng phiên bản; tab cũ thấy giá trị mới sau `reloadFromStorage` (Task 2).
3. **Cổng thanh toán:** không thể tắt hết phương thức; phương thức đang tắt chỉ bị từ chối cho khoản thu **mới** (khoản đã ghi giữ nguyên); bật lại thì thu được (Task 3).
4. **Quá hạn:** đúng mốc (đúng N giờ chưa quá hạn, hơn N giờ mới quá hạn), chỉ yêu cầu còn "cần xử lý", đổi số giờ có hiệu lực ngay, giờ máy đi lùi (tạo sau "bây giờ") không quá hạn (Task 3).
5. **Một số ngày hết hạn cho mọi chỗ:** danh sách, tóm tắt, chi tiết Kho và Báo cáo vận hành dùng cùng một số; biên 1 và 365; thiếu dòng cài đặt hoặc bảng rỗng vẫn chạy bằng mặc định (Task 1, 3).

---

## File Structure

| Tệp | Việc |
|---|---|
| `src/data/rules/capabilities.ts` (sửa), `capabilities.test.ts` (sửa) | quyền `settings.manage` (21 quyền) |
| `src/data/contracts/enums.ts` (sửa) | `APP_SETTING_KEYS`, nhãn tiếng Việt |
| `src/data/contracts/staff.ts` (sửa) | `AppSettingsValues`, `AppSettingsPatch`, `FixedRule`, `AppSettings`; `StaffSettingsApi.get/update`; `StaffRequestCard.overdue` |
| `src/data/mock/store/schema.ts` (sửa) | `AppSettingsRow`, bảng `app_settings` (+ `emptyTables`) |
| `src/data/rules/app-settings.ts` (mới) | mặc định, luật, gộp, mô tả, `isOverdue` |
| `src/data/mock/settings.ts` (mới) | `readSettings(t)` (gộp mặc định, thiếu dòng = mặc định) |
| `src/data/mock/seed/settings.ts` (mới), `seed/index.ts` (sửa) | một dòng mặc định |
| `src/data/mock/api/staff/profile.ts` (sửa) | `settings.get`, `settings.update` |
| `src/data/mock/api/staff/stock.ts`, `reports.ts`, `invoices.ts`, `requests.ts` (sửa) | dùng cài đặt |
| Test | `rules/app-settings.test.ts`, `store/db.test.ts`, `api/staff/settings.test.ts`, `stock.test.ts`, `reports.test.ts`, `invoices.test.ts`, `requests.test.ts` |

---

### Task 1: Quyền, kiểu, bảng, quy tắc thuần, dữ liệu mẫu

**Files:**
- Modify: `rules/capabilities.ts`, `rules/capabilities.test.ts`, `contracts/enums.ts`, `contracts/staff.ts`, `mock/store/schema.ts`, `mock/seed/index.ts`, `mock/store/db.test.ts` (đường dẫn dưới `src/data/`)
- Create: `rules/app-settings.ts`, `rules/app-settings.test.ts`, `mock/settings.ts`, `mock/seed/settings.ts`

**Interfaces:**
- Produces (`capabilities.ts`): `'settings.manage'` thêm vào `CAPS` (cuối danh sách) và `CAP_LABEL` = `'Quản lý cài đặt hệ thống'`. Test cũ "has 20 capabilities" thành 21.
- Produces (`enums.ts`): `APP_SETTING_KEYS = ['stock_expiry_days','stock_default_min','default_duration_kham','default_duration_spa','calendar_start','calendar_end','payment_methods','request_overdue_hours'] as const`, kiểu `AppSettingKey`, `APP_SETTING_LABEL: Record<AppSettingKey, string>`: `Số ngày báo sắp hết hạn` · `Ngưỡng sắp hết mặc định` · `Thời lượng khám mặc định` · `Thời lượng spa mặc định` · `Giờ bắt đầu của lưới lịch` · `Giờ kết thúc của lưới lịch` · `Phương thức thanh toán đang dùng` · `Số giờ chờ coi là quá hạn`.
- Produces (`staff.ts`): `AppSettingsValues = { stock_expiry_days: number; stock_default_min: number; default_duration_kham: number; default_duration_spa: number; calendar_start: string; calendar_end: string; payment_methods: PaymentMethod[]; request_overdue_hours: number }`; `AppSettingsPatch = Partial<AppSettingsValues>`; `FixedRule = { label: string; value: string }`; `AppSettings = { version: number; values: AppSettingsValues; fixedRules: FixedRule[] }`; `StaffSettingsApi` thêm `get(): Promise<AppSettings>` và `update(version: number, patch: AppSettingsPatch): Promise<AppSettings>`; `StaffRequestCard.overdue?: boolean`.
- Produces (`schema.ts`): `AppSettingsRow = { id: 'main'; version: number; values: AppSettingsValues }`; `Tables.app_settings: AppSettingsRow[]` (thêm vào `emptyTables`).
- Produces (`rules/app-settings.ts`):
```ts
export const DEFAULT_SETTINGS: AppSettingsValues;                       // Global Constraints
export const FIXED_RULES: FixedRule[];                                  // [{ label: 'Video nội trú', value: 'Tối đa 15 giây và 20 MB, tự xóa sau 60 ngày' }, { label: 'Thanh toán', value: 'Thanh toán tại quầy, không thanh toán trực tuyến' }]
export const SETTINGS_MSG: { unknown: 'Cài đặt này không có.'; shape: 'Cài đặt gửi lên chưa đúng.'; stock_expiry_days: 'Số ngày chỉ nhận số nguyên từ 1 đến 365.'; stock_default_min: 'Ngưỡng chỉ nhận số nguyên từ 0 đến 1000.'; duration: 'Thời lượng chỉ nhận từ 5 đến 240 phút, theo bước 5 phút.'; time: 'Giờ cần đúng dạng HH:MM, ví dụ 07:00.'; span: 'Lưới lịch cần dài ít nhất 4 giờ, giờ bắt đầu trước giờ kết thúc.'; payment_methods: 'Cần chọn ít nhất một phương thức thanh toán có sẵn.'; request_overdue_hours: 'Số giờ chỉ nhận số nguyên từ 1 đến 168.'; methodOff: 'Phương thức này đang tắt.' };
export function validateSettingsPatch(patch: unknown, current: AppSettingsValues): Record<string, string>; // khóa lỗi = tên cài đặt; không phải đối tượng → { settings: shape }; lệch giờ → trên calendar_end nếu bản vá có calendar_end, không thì calendar_start (kiểm trên giá trị đã gộp)
export function applySettingsPatch(current: AppSettingsValues, patch: AppSettingsPatch): AppSettingsValues; // chỉ khóa đã biết; payment_methods bỏ trùng và theo thứ tự PAYMENT_METHODS
export function changedSettings(before: AppSettingsValues, after: AppSettingsValues): AppSettingKey[]; // theo thứ tự APP_SETTING_KEYS; payment_methods so theo tập
export function describeSetting(key: AppSettingKey, v: AppSettingsValues): string; // '30 ngày' · '5' · '30 phút' · '07:00' · 'Tiền mặt, QR ngân hàng' · '24 giờ'
export function isOverdue(createdAtIso: string, now: Date, hours: number): boolean; // now − created > hours giờ (đúng bằng thì chưa)
```
- Produces (`mock/settings.ts`): `readSettings(t: Readonly<Doc['t']>): { version: number; values: AppSettingsValues }` — `{ ...DEFAULT_SETTINGS, ...row?.values }` (sao mảng `payment_methods`), `version: row?.version ?? 1`.

- [ ] **Step 1: Write the failing tests**

`app-settings.test.ts` (`D = DEFAULT_SETTINGS`):
```ts
it('defaults', () => expect(D).toEqual({ stock_expiry_days: 30, stock_default_min: 5, default_duration_kham: 30, default_duration_spa: 60, calendar_start: '07:00', calendar_end: '21:00', payment_methods: ['cash','transfer','qr'], request_overdue_hours: 24 }));
it('accepts every good value and the empty patch', () => {
  expect(validateSettingsPatch({}, D)).toEqual({});
  expect(validateSettingsPatch({ stock_expiry_days: 365, stock_default_min: 0, default_duration_kham: 240, default_duration_spa: 5, calendar_start: '00:00', calendar_end: '04:00', payment_methods: ['qr'], request_overdue_hours: 168 }, D)).toEqual({});
});
it('numbers: integers in range only', () => { /* for each numeric key: 0/366 (expiry), -1/1001 (min), 4/245/32 (duration: step 5), 0/169 (overdue), '30', 1.5, NaN, Infinity, null, true → exactly { [key]: its message } */ });
it('times: HH:MM only, and 4 hours apart', () => {
  expect(validateSettingsPatch({ calendar_start: '7:00' }, D)).toEqual({ calendar_start: SETTINGS_MSG.time });
  expect(validateSettingsPatch({ calendar_end: '24:00' }, D)).toEqual({ calendar_end: SETTINGS_MSG.time });
  expect(validateSettingsPatch({ calendar_start: '18:30' }, D)).toEqual({ calendar_start: SETTINGS_MSG.span });   // 18:30–21:00 < 4 h
  expect(validateSettingsPatch({ calendar_end: '10:00' }, D)).toEqual({ calendar_end: SETTINGS_MSG.span });      // 07:00–10:00 < 4 h
  expect(validateSettingsPatch({ calendar_start: '21:00', calendar_end: '08:00' }, D)).toEqual({ calendar_end: SETTINGS_MSG.span });
  expect(validateSettingsPatch({ calendar_start: '08:00', calendar_end: '12:00' }, D)).toEqual({});
});
it('payment methods: a non-empty set of known methods', () => { /* [] , 'cash', ['cash','bank'], new Array(2), [,'cash'], [5] → { payment_methods: msg }; ['qr','qr','cash'] valid */ });
it('unknown keys, an own __proto__ key and a non-object', () => {
  const errs = validateSettingsPatch(JSON.parse('{"__proto__": {"x": 1}, "constructor": 2, "colour": 3}'), D);
  expect(Object.keys(errs).sort()).toEqual(['__proto__', 'colour', 'constructor']);
  expect(Object.values(errs)).toEqual([SETTINGS_MSG.unknown, SETTINGS_MSG.unknown, SETTINGS_MSG.unknown]);
  for (const bad of [null, [], 'x', 5]) expect(validateSettingsPatch(bad, D)).toEqual({ settings: SETTINGS_MSG.shape });
});
it('applySettingsPatch keeps known keys only, dedupes and orders methods', () => {
  const sym = Symbol('x');
  const next = applySettingsPatch(D, { payment_methods: ['qr', 'cash', 'qr'], stock_expiry_days: 60, [sym]: 1, ...JSON.parse('{"__proto__": {"a": 1}}') } as never);
  expect(next).toEqual({ ...D, payment_methods: ['cash', 'qr'], stock_expiry_days: 60 });
  expect(Reflect.ownKeys(next)).toEqual(Reflect.ownKeys(D));
});
it('changedSettings and describeSetting', () => { /* same values → []; methods in another order → []; two changes come back in APP_SETTING_KEYS order; describeSetting for each of the 8 keys gives the strings above; payment_methods ['cash','qr'] → 'Tiền mặt, QR ngân hàng' */ });
it('isOverdue: strictly more than N hours, never for a time in the future', () => {
  const now = new Date('2026-10-22T12:00:00+07:00');
  expect(isOverdue('2026-10-21T12:00:00+07:00', now, 24)).toBe(false);   // exactly 24 h
  expect(isOverdue('2026-10-21T11:59:00+07:00', now, 24)).toBe(true);
  expect(isOverdue('2026-10-22T13:00:00+07:00', now, 1)).toBe(false);    // created "after" now
});
```
`capabilities.test.ts`: 21 quyền; `settings.manage` có `CAP_LABEL`; Quản lý có, preset Bác sĩ và Spa **không** có (so với danh sách cũ của họ — giữ test hiện có về hai vai này).
`db.test.ts`: (a) "a document saved before system settings existed gets the default settings row" — xóa `app_settings` khỏi tài liệu cũ, `seed` thật (`buildSeed`-kiểu như test Kho) → `readSettings(db.read().t)` bằng `{ version: 1, values: DEFAULT_SETTINGS }` và bảng có đúng 1 dòng; (b) "an empty settings table stays empty and still reads as the defaults" — bảng có mặt nhưng rỗng, xóa một bộ đếm khác để backfill chạy → bảng vẫn `[]`, `readSettings` ra mặc định.

- [ ] **Step 2: Run to verify fail** — `npx vitest run src/data/rules/app-settings.test.ts src/data/rules/capabilities.test.ts src/data/mock/store/db.test.ts` → FAIL (thiếu module, 20 ≠ 21, `app_settings` undefined).
- [ ] **Step 3: Implement** quyền, enums, kiểu hợp đồng, bảng + `emptyTables`, `rules/app-settings.ts` (theo chữ ký; `isOverdue` so mili-giây), `mock/settings.ts`, `seed/settings.ts` (`seedSettings(c)` đẩy một dòng `{ id: 'main', version: 1, values: { ...DEFAULT_SETTINGS, payment_methods: [...] } }`) gọi trong `buildSeed`.
- [ ] **Step 4: Run to verify pass** — `npm test && npm run typecheck && npx eslint src/data` → PASS (kiểm các test seed đếm bảng nếu có).
- [ ] **Step 5: Commit** — `feat: system settings permission, types, table and pure rules`.

---

### Task 2: `staff.settings.get` và `update`

**Files:**
- Modify: `src/data/mock/api/staff/profile.ts` (mở rộng `staffSettingsApi`)
- Create: `src/data/mock/api/staff/settings.test.ts`

**Interfaces:**
- Consumes: Task 1 (`validateSettingsPatch`, `applySettingsPatch`, `changedSettings`, `describeSetting`, `FIXED_RULES`, `readSettings`, `APP_SETTING_LABEL`), `anyStaff`, `staffActor`, `audit`, `checkVersion`.
- Produces: `staffSettingsApi(env)` trả thêm `get()` (mọi nhân viên; `{ version, values, fixedRules: FIXED_RULES }`) và `update(version, patch)` (quyền `settings.manage`; trả cùng dạng như `get()` sau khi ghi).

Cách làm `update`: `staffActor(env,'settings.manage')`; `await sleepWrite()`; `db.reloadFromStorage()` rồi `validateSettingsPatch(patch, current)` → `ValidationError(fields)`; nếu `changedSettings(current, applySettingsPatch(current, patch))` rỗng → trả giá trị hiện tại, **không** `transact`, không kiểm phiên bản; ngược lại trong `transact`: lấy dòng `main` (tạo `{ id:'main', version: 1, values: {...DEFAULT_SETTINGS} }` nếu thiếu), `checkVersion(row, version)`, **kiểm lại bản vá trên giá trị mới nhất của dòng** (cùng hàm), gán giá trị đã gộp, `row.version += 1`, và với mỗi khóa đổi một `audit(d, env, a, 'settings.update', 'app_settings', 'main', …)` theo mẫu ở Global Constraints (`describeSetting` giá trị cũ / mới). Mã lỗi giữ nguyên: `ForbiddenError` (không quyền / không phải nhân viên), `ConflictError` (phiên bản cũ).

- [ ] **Step 1: Write the failing tests** (`settings.test.ts`; `makeTestApi()`, `loginAs`, `fieldsOf` như `prefs.test.ts`; hai kho dùng chung như test "two tabs" ở `prefs.test.ts` cho ca nhiều tab)
```ts
it.each(['quanly_ha','bacsi_duc','bacsi_mai','spa_ngocanh'])('%s reads the defaults, the fixed rules and version 1', async (who) => { /* get() toEqual { version: 1, values: DEFAULT_SETTINGS, fixedRules: FIXED_RULES } */ });
it('customer, signed-out visitor: get and update are refused', async () => { /* ForbiddenError for both */ });
it('only settings.manage may change: manager yes, Bác sĩ and Spa no, a Bác sĩ with the extra capability yes', async () => { /* update(1, {stock_default_min: 8}) → Forbidden for bacsi_duc/spa; give bacsi_duc extra_capabilities ['settings.manage'] in the db → works */ });
it('update returns the new view, bumps the version once, and audits one line per changed setting', async () => {
  const r = await api.staff.settings.update(1, { stock_expiry_days: 60, payment_methods: ['qr', 'cash'], stock_default_min: 5 });
  expect(r).toMatchObject({ version: 2, values: { stock_expiry_days: 60, payment_methods: ['cash', 'qr'], stock_default_min: 5 } });
  const lines = db.read().t.audit_events.filter((e) => e.action === 'settings.update').map((e) => e.summary_vi);
  expect(lines).toEqual([
    'Nguyễn Thu Hà đổi "Số ngày báo sắp hết hạn" từ 30 ngày sang 60 ngày',
    'Nguyễn Thu Hà đổi "Phương thức thanh toán đang dùng" từ Tiền mặt, Chuyển khoản, QR ngân hàng sang Tiền mặt, QR ngân hàng',
  ]);   // stock_default_min unchanged → no line
});
it('a patch that changes nothing writes nothing, even with an old version', async () => { /* rev unchanged, version still 1, no audit; update(99, {stock_expiry_days: 30}) resolves */ });
it('an old version is a conflict and writes nothing', async () => { /* update(1, a) ok; update(1, b) → ConflictError; rev unchanged by the second */ });
it('two tabs with the same version: one wins, the other is told it is out of date', async () => { /* two Db on one KV; Promise.allSettled of two different-key updates with version 1 → one fulfilled, one rejected ConflictError; after reloadFromStorage the winner's value is there */ });
it('a refused patch writes nothing, good fields next to bad ones included', async () => { /* { stock_expiry_days: 60, stock_default_min: -1, colour: 1 } → exact fields; rev unchanged */ });
it('an own __proto__ key, a symbol and a sparse methods list are refused or ignored without writing', async () => { /* JSON '{"__proto__":{}}' → fields has '__proto__'; { payment_methods: new Array(2) } → { payment_methods: msg }; rev unchanged */ });
it('calendar hours are checked together with the stored value', async () => { /* update(1,{calendar_end:'12:00'}) ok; then update(2,{calendar_start:'09:00'}) → { calendar_start: SETTINGS_MSG.span }; update(2,{calendar_start:'06:00', calendar_end:'18:00'}) ok */ });
it('a missing or empty settings table reads as the defaults and the first update creates the row', async () => { /* db.transact clearing app_settings; get() → version 1 defaults; update(1,{stock_default_min: 9}) → version 2; table has 1 row */ });
it('the password-free, customer-free view: settings never appear in customer API results', async () => { /* JSON.stringify of customer.pets.list() etc. does not contain 'payment_methods' */ });
```
- [ ] **Step 2: Run to verify fail** — `npx vitest run src/data/mock/api/staff/settings.test.ts` → FAIL (`settings.get`/`update` không có).
- [ ] **Step 3: Implement** theo "Cách làm `update`" và chữ ký ở Interfaces.
- [ ] **Step 4: Run to verify pass** — `npm test && npm run typecheck && npx eslint src/data` → PASS. Kiểm độ "cắn": tạm bỏ `checkVersion` → test phiên bản/hai tab đỏ; tạm trả lại `errors` kiểu `{}` thay cho `Map` ở `validateSettingsPatch` → test `__proto__` đỏ; tạm bỏ `reloadFromStorage` → thử nghiệm bằng test hai tab nếu bắt được (nếu không thì ghi vào sổ là chưa có test cho dòng này). Trả lại từng chỗ.
- [ ] **Step 5: Commit** — `feat: staff.settings get and update (manager only)`.

---

### Task 3: Lớp dữ liệu dùng cài đặt

**Files:**
- Modify: `mock/api/staff/stock.ts`, `reports.ts`, `invoices.ts`, `requests.ts`; `rules/stock.ts` (bỏ hằng cứng)
- Test: `stock.test.ts`, `reports.test.ts`, `invoices.test.ts`, `requests.test.ts` (cùng thư mục `mock/api/staff/`), mỗi cái thêm một `describe('system settings')`

**Interfaces:**
- Consumes: Task 1–2 (`readSettings`, `isOverdue`, `SETTINGS_MSG.methodOff`, `api.staff.settings.update`).
- Produces: `toRow(i: StockItem, today: string, soonDays: number): StockRow` (tham số thứ ba **bắt buộc**; mọi chỗ gọi truyền `readSettings(t).values.stock_expiry_days`); `STOCK_EXPIRY_SOON_DAYS` bỏ nếu không còn nơi nào dùng, nếu test cũ còn dùng thì thay bằng `DEFAULT_SETTINGS.stock_expiry_days`; `StaffRequestCard.overdue` luôn là boolean; `payments.record` ném `ValidationError({ method: SETTINGS_MSG.methodOff })` cho phương thức tắt (kiểm trong `transact`, trước mọi kiểm khác về số tiền).

- [ ] **Step 1: Write the failing tests**
  - **Kho** (`stock.test.ts`): `expiringSoon` của `summary()` ở mặc định là `n0`; sau `settings.update(1, { stock_expiry_days: 365 })` lớn hơn `n0`, và sau `{ stock_expiry_days: 1 }` bằng 0 (món mẫu nhanh hết hạn nhất còn 20 ngày); trong cả ba trường hợp `list({ status: 'expiring' })`, `summary().expiringSoon`, `get(id).item.expiry` của một món có hạn 200 ngày, và `staff.reports.operations(...).stock.expiringSoon` cùng khớp nhau. Món đã quá hạn vẫn `expired` ở mọi giá trị. Bảng cài đặt bị xóa (dòng thiếu) → số như mặc định.
  - **Thanh toán** (`invoices.test.ts`, cùng hóa đơn đã phát hành như test ở dòng ~60): sau `update(1, { payment_methods: ['cash'] })`, `record(id, { amount: 1000, method: 'qr' })` → `fieldsOf` = `{ method: 'Phương thức này đang tắt.' }`, không thêm dòng `payments`, `rev` không đổi; `method: 'cash'` thu được (kể cả `cash_given`); khoản `transfer`/`qr` đã có từ trước vẫn hiện nguyên trong chi tiết hóa đơn; bật lại `['cash','qr']` thì `qr` thu được; thứ tự kiểm: phương thức tắt báo trước số tiền sai (`amount: 0, method: 'qr'` → `method`). Không thể tắt hết: đã có ở Task 2 (rỗng bị từ chối).
  - **Quá hạn** (`requests.test.ts`; "bây giờ" của test là 2026-10-19 09:00, các yêu cầu mẫu tạo cách 12–120 phút): ở mặc định mọi thẻ `overdue === false`; sau `update(1, { request_overdue_hours: 1 })` các yêu cầu còn "cần xử lý" tạo hơn 60 phút trước có `overdue: true` (tính độc lập từ `createdAt` và `status` trong test, không gõ cứng mã), phần còn lại `false`; yêu cầu `confirmed`/`cancelled`/`rejected` cũ hơn ngưỡng vẫn `false`; `setNow` lùi/tiến làm đổi kết quả đúng mốc (đúng 60 phút chưa quá hạn); `get(id)` (chi tiết) cũng mang `overdue`; đổi lại 24 thì hết quá hạn ngay.
- [ ] **Step 2: Run to verify fail** — bốn file trên → FAIL.
- [ ] **Step 3: Implement** theo Interfaces: `card(doc, r, now, hours)` gọi `isOverdue` khi `OPEN_REQUEST_STATUSES.includes(r.status)`; `readSettings(doc.t)` đọc một lần mỗi lần gọi `list`/`get`; `toRow` nhận số ngày; `payments.record` đọc `readSettings(d.t).values.payment_methods` trong `transact`.
- [ ] **Step 4: Run to verify pass** — `npm test && npm run typecheck && npx eslint src/data` → PASS. Kiểm độ "cắn": tạm cho `toRow` bỏ qua tham số (dùng 30 cứng) → test Kho đỏ; tạm bỏ kiểm phương thức → test thanh toán đỏ; tạm đổi `>` thành `>=` trong `isOverdue` → test mốc đỏ. Trả lại.
- [ ] **Step 5: Commit** — `feat: expiry days, payment methods and request overdue follow the system settings`.

---

### Task 4: Tài liệu, kiểm tra toàn bộ, rà soát độc lập, gộp

- [ ] **Step 1: Cập nhật tài liệu.** `PROGRESS.md`: "Đã xong" thêm **Phần 5 · giai đoạn 5 — Cài đặt C** (`staff.settings.get/update`; quyền `settings.manage` chỉ Quản lý; 8 cài đặt, mặc định và luật; chỗ dùng: Kho/Báo cáo (số ngày sắp hết hạn), `payments.record` (phương thức đang bật; khoản đã ghi giữ nguyên), `overdue` ở thẻ yêu cầu; các giá trị chỉ cung cấp cho giao diện: ngưỡng kho mặc định, thời lượng mặc định, giờ lưới lịch; `fixedRules`; mỗi trường đổi một dòng nhật ký; bản vá không đổi không ghi; một dòng `main` có `version`); sửa "Đang làm"/"Việc tiếp theo" sang giai đoạn 6 (Hỗ trợ nhân viên); "Thay đổi hợp đồng" (quyền, `APP_SETTING_KEYS`/`APP_SETTING_LABEL`, `AppSettingsValues`, `AppSettingsPatch`, `FixedRule`, `AppSettings`, `StaffSettingsApi.get/update`, `StaffRequestCard.overdue`, bảng `app_settings`, hành vi `payments.record`, `toRow` chỉ nội bộ); "Yêu cầu gửi nhánh kia": màn Cài đặt hệ thống (mọi nhân viên xem, `can('settings.manage')` mới sửa; gửi `version`, `ConflictError` → tải lại; hiện `fixedRules` chỉ đọc), giao diện nên đọc `settings.get()` để: điền sẵn thời lượng (thay `SERVICE_MINUTES` cho khám/spa), giờ lưới lịch (`START_H`/`END_H`; lịch ngoài khoảng vẫn phải hiện — `windowOf` đã nới), ngưỡng kho khi thêm món, chỉ liệt kê phương thức đang bật ở hộp thu tiền, dấu "quá hạn" cho `overdue`. **Không** tạo số R mới ở `QUYET-DINH.md` (bên giao diện đang dùng R41); quyết định (`calendar_end` 21:00 thay 20:00 khớp lưới hiện có; đọc: mọi nhân viên, sửa: `settings.manage`) ghi trong `PROGRESS.md`.
- [ ] **Step 2: Chạy toàn bộ** — `npm run verify` (nền). Expected: exit 0 trừ bài tải video của bên giao diện (đã biết đỏ, chạy riêng để xác nhận cùng bài).
- [ ] **Step 3: Rà soát độc lập** bằng agent mới (diff so với nhánh tích hợp, spec, kế hoạch, Review Focus); sửa mọi lỗi quan trọng test-first; lỗi nhỏ ghi sổ.
- [ ] **Step 4: Commit, đẩy, gộp** như các giai đoạn trước (`git push -u origin claude/du-lieu`; ở thư mục gốc `git fetch origin && git merge --ff-only origin/claude/focused-pascal-rfxnnp`, `git merge --no-ff claude/du-lieu`, `git push origin claude/focused-pascal-rfxnnp`; nếu nhánh tích hợp đã đi tiếp thì gộp nó vào `claude/du-lieu` trước và chạy lại test đơn vị và kiểm tra kiểu). Sau khi sửa theo rà soát, build lại và chạy lại các e2e về Kho, doanh thu, hóa đơn, yêu cầu, quyền trước khi gộp.

---

## Self-Review

- **Độ phủ spec §3.3.C:** `get`/`update` + `version` + nhật ký từng trường (T2) · 8 trường và luật (T1) · quyền `settings.manage` (T1) · `payment_methods` chặn `payments.record` (T3) · `request_overdue_hours` → `overdue` (T3) · `stock_expiry_days` → Kho/Báo cáo (T3) · `fixedRules` (T1, T2) · dòng mặc định ở dữ liệu mẫu + di chuyển tài liệu cũ (T1) · các trường chỉ cung cấp cho giao diện (T1, ghi cho nhánh kia ở T4).
- **Khác spec (kế hoạch chốt):** `calendar_end` mặc định `21:00` (khớp lưới hiện có, spec ghi 20:00 và dặn kiểm khi lập kế hoạch); bản vá không đổi gì thì không ghi và không kiểm phiên bản; `overdue` luôn là boolean; lệch giờ báo ở `calendar_end` (hoặc `calendar_start` khi chỉ gửi giờ bắt đầu); `payment_methods` lưu theo thứ tự cố định, bỏ trùng.
- **Nhất quán kiểu:** `AppSettingsValues` (T1) dùng ở `AppSettingsRow`, `validateSettingsPatch(current)`, `readSettings` (T1), `update` (T2) và `toRow`/`record`/`card` (T3); `SETTINGS_MSG.methodOff` định nghĩa ở T1, dùng ở T3.
