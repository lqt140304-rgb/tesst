# Phần 5 · Giai đoạn 4 — Cài đặt B: tùy chọn cá nhân (dữ liệu) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mỗi nhân viên lưu và đọc bộ tùy chọn riêng (`staff.prefs`: `get`, `save`, `reset`): cỡ chữ, độ dày bảng, giảm chuyển động, trang vào, kiểu xem lịch, số dòng mỗi trang, khoảng ngày báo cáo, nhắc việc, danh sách việc làm lần đầu. Lớp dữ liệu chỉ lưu và kiểm tra; giao diện áp dụng sau.

**Architecture:** Hàm thuần `rules/staff-prefs.ts` (mặc định theo quyền, gộp, kiểm tra bản vá). Bảng `staff_prefs` (một dòng mỗi nhân viên, chỉ lưu những gì người đó đã đặt; phần còn lại lấy mặc định lúc đọc). API `mock/api/staff/prefs.ts` theo khuôn `profile.ts` (`anyStaff`, `db.transact`).

**Tech Stack:** TypeScript 6, Vitest 5, mock store. Không thêm thư viện.

**Spec:** `docs/superpowers/specs/2026-10-21-phan-5-kho-bao-cao-cai-dat-design.md` (§3.0, §3.3.B). Chủ dự án đã duyệt 21/10/2026.

## Global Constraints

- Chỉ sửa `src/data/**`, `docs/`, `PROGRESS.md`. **Không** sửa `src/features`, `src/app`, `src/ui`, `src/styles`.
- Hợp đồng chỉ thêm. Mọi nhân viên đang dùng có tùy chọn riêng, không cần quyền riêng; khách và khách vãng lai bị `ForbiddenError`. Chủ thể luôn lấy từ phiên.
- Giá trị lạ hay khóa lạ → `ValidationError` ở đúng trường, **không ghi gì** (tất cả hoặc không gì). Chỉ lưu những khóa người dùng đã đặt.
- "Trang vào" và "nhắc việc" bám quyền: bật một loại nhắc hoặc chọn một trang vào mà mình không có quyền → bị từ chối; nếu quyền mất về sau thì lúc đọc trang vào về `home` và nhắc đó thành `false` (không xóa giá trị đã lưu).
- Không ghi nhật ký thao tác cho tùy chọn cá nhân (tiện ích riêng, không nhạy cảm).
- TDD: test thất bại trước. Commit nhỏ, tiêu đề tiếng Anh; **không ghi tên model vào commit/code/tài liệu**; thân commit chỉ kết thúc bằng dòng `Claude-Session: https://claude.ai/code/session_01WQRA4c5rpvrJd3fkJ3fRkU`.
- Trước khi gộp: `npm run verify` trong `.worktrees/du-lieu` (~15 phút). Bài `giao-dien-nhan-vien-c.spec.ts:369` (tải video từ máy) của bên giao diện đang đỏ sẵn, không liên quan.

## Review Focus

1. **Bản vá lạ:** khóa lạ (kể cả `constructor`, `__proto__`), giá trị sai kiểu (`'lg'` cho số dòng, `20` cho cỡ chữ, `null`, mảng), `nudges` không phải đối tượng → từ chối đúng khóa, không ghi gì (Task 1, 2).
2. **Quyền:** trang vào và nhắc việc ngoài quyền bị từ chối; mất quyền về sau → đọc ra `home` / `false` (Task 1, 2).
3. **Cô lập giữa người dùng và giữa tab:** người A đặt không đổi người B; hai lần lưu cùng lúc các khóa khác nhau không ghi đè nhau (Task 2).
4. **`reset`** xóa hết về mặc định theo quyền hiện tại; **bản vá rỗng** không ghi gì (Task 2).
5. **Danh sách việc đã làm:** trùng chỉ giữ một, khóa sai dạng bị từ chối, tối đa 50 mục (Task 1, 2).

---

## File Structure

| Tệp | Việc |
|---|---|
| `src/data/contracts/enums.ts` (sửa) | hằng và nhãn của các tùy chọn |
| `src/data/contracts/staff.ts` (sửa) | `StaffPrefs`, `StaffPrefsPatch`, `StaffPrefsApi` |
| `src/data/mock/store/schema.ts` (sửa) | `StaffPrefsRow`, bảng `staff_prefs` |
| `src/data/rules/staff-prefs.ts` (mới) | quy tắc thuần |
| `src/data/mock/api/staff/prefs.ts` (mới); `api/index.ts` (sửa) | API |
| Test | `rules/staff-prefs.test.ts`, `store/db.test.ts`, `api/staff/prefs.test.ts` |

---

### Task 1: Hằng, kiểu, bảng và quy tắc thuần

**Files:**
- Modify: `src/data/contracts/enums.ts`, `src/data/contracts/staff.ts`, `src/data/mock/store/schema.ts`, `src/data/mock/store/db.test.ts`
- Create: `src/data/rules/staff-prefs.ts`, `staff-prefs.test.ts`

**Interfaces:**
- Consumes: `effectiveCaps`, `Cap` (`rules/capabilities`).
- Produces (`enums.ts`, mỗi hằng kèm bảng nhãn tiếng Việt):
```ts
export const TEXT_SIZES = ['md', 'lg'] as const;                  // 'Vừa', 'Lớn'
export const DENSITIES = ['comfortable', 'compact'] as const;     // 'Thoáng', 'Gọn'
export const MOTION_PREFS = ['system', 'reduced'] as const;       // 'Theo máy', 'Luôn giảm'
export const LANDING_PAGES = ['home', 'appointments', 'inpatient', 'invoices'] as const; // 'Trang chủ', 'Lịch hẹn', 'Nội trú', 'Hóa đơn'
export const CALENDAR_VIEWS = ['week', 'day'] as const;           // 'Tuần', 'Ngày'
export const PAGE_SIZES = [10, 20, 50] as const;
export const REPORT_RANGES = ['7d', '30d', 'month'] as const;     // '7 ngày qua', '30 ngày qua', 'Tháng này'
export const NUDGE_KEYS = ['requests', 'reschedules', 'stock', 'drafts'] as const; // 'Yêu cầu đặt lịch chờ xử lý', 'Khách xin đổi lịch', 'Kho sắp hết', 'Hóa đơn nháp lâu chưa phát hành'
// + kiểu TextSize, Density, MotionPref, LandingPage, CalendarView, PageSize, ReportRange, NudgeKey và nhãn *_LABEL
```
- Produces (`staff.ts`):
```ts
export type StaffPrefs = { text_size: TextSize; density: Density; motion: MotionPref; landing: LandingPage; appointments_view: CalendarView; page_size: PageSize; report_range: ReportRange; nudges: Record<NudgeKey, boolean>; onboarding_done: string[]; onboarding_hidden: boolean };
export type StaffPrefsPatch = Partial<Omit<StaffPrefs, 'nudges'>> & { nudges?: Partial<Record<NudgeKey, boolean>> };
export interface StaffPrefsApi { get(): Promise<StaffPrefs>; save(patch: StaffPrefsPatch): Promise<StaffPrefs>; reset(): Promise<StaffPrefs> }
```
- Produces (`schema.ts`): `StaffPrefsRow = { staff_id: string; values: StaffPrefsPatch }`; `Tables.staff_prefs: StaffPrefsRow[]` (thêm vào `emptyTables`).
- Produces (`rules/staff-prefs.ts`):
```ts
export const LANDING_NEEDS: Record<LandingPage, readonly Cap[]>;   // home: [] (ai cũng được); appointments: ['appointments.view']; inpatient: ['inpatient.view']; invoices: ['invoices.create','payments.record'] (một trong)
export const NUDGE_NEEDS: Record<NudgeKey, readonly Cap[]>;        // requests: ['requests.handle']; reschedules: ['requests.handle']; stock: ['stock.view']; drafts: ['invoices.create']
export const PREFS_MSG: { unknown: 'Tùy chọn này không có.'; shape: 'Tùy chọn gửi lên chưa đúng.'; text_size: 'Cỡ chữ chỉ chọn Vừa hoặc Lớn.'; density: 'Độ dày bảng chỉ chọn Thoáng hoặc Gọn.'; motion: 'Chuyển động chỉ chọn Theo máy hoặc Luôn giảm.'; landing: 'Trang vào sau đăng nhập chưa đúng.'; landingNoAccess: 'Bạn chưa có quyền vào trang này.'; appointments_view: 'Kiểu xem lịch chỉ chọn Tuần hoặc Ngày.'; page_size: 'Số dòng mỗi trang chỉ chọn 10, 20 hoặc 50.'; report_range: 'Khoảng ngày mặc định chỉ chọn 7 ngày qua, 30 ngày qua hoặc Tháng này.'; nudge: 'Nhắc việc chỉ nhận bật hoặc tắt.'; nudgeNoAccess: 'Bạn chưa có quyền nhận loại nhắc này.'; onboarding_done: 'Danh sách việc đã làm chưa đúng.'; onboarding_hidden: 'Ẩn danh sách chỉ nhận có hoặc không.' };
export function canLand(caps: ReadonlySet<Cap>, page: LandingPage): boolean;
export function canNudge(caps: ReadonlySet<Cap>, key: NudgeKey): boolean;
export function defaultPrefs(caps: ReadonlySet<Cap>): StaffPrefs;                    // md, comfortable, system, home, week, 20, 7d, mọi nhắc = canNudge, [], false
export function resolvePrefs(stored: StaffPrefsPatch | undefined, caps: ReadonlySet<Cap>): StaffPrefs;
export function validatePrefsPatch(patch: unknown, caps: ReadonlySet<Cap>): Record<string, string>; // khóa: tên tùy chọn, hoặc `nudges.<khóa>`; không phải đối tượng → { prefs: shape }
export function mergePatch(stored: StaffPrefsPatch, patch: StaffPrefsPatch): StaffPrefsPatch; // chỉ đè các khóa có trong patch; nudges đè từng khóa; onboarding_done bỏ trùng
```
`resolvePrefs`: mặc định + giá trị đã lưu; `landing` đã lưu mà không còn quyền → `'home'`; nhắc không còn quyền → `false`. `validatePrefsPatch` dùng `Object.hasOwn` (không `in`), từ chối khóa lạ ở `PREFS_MSG.unknown`; `page_size` chỉ nhận số `10|20|50`; `onboarding_done`: mảng ≤ 50 chuỗi, mỗi chuỗi khớp `/^[a-z0-9_.-]{1,40}$/`.

- [ ] **Step 1: Write the failing tests**

`staff-prefs.test.ts` (vai Bác sĩ có `appointments.view`, `inpatient.view`, `invoices.create`, và quyền lẻ `requests.handle` ở dữ liệu mẫu; Spa không có hóa đơn):
```ts
const mgr = effectiveCaps({ preset_ids: ['quan_ly'], extra_capabilities: [] });
const doctor = effectiveCaps({ preset_ids: ['bac_si'], extra_capabilities: [] });
const spa = effectiveCaps({ preset_ids: ['spa'], extra_capabilities: [] });
describe('defaults follow the role', () => {
  it('the same visible defaults for everyone; nudges only for what the role can do', () => {
    expect(defaultPrefs(mgr)).toEqual({ text_size: 'md', density: 'comfortable', motion: 'system', landing: 'home', appointments_view: 'week', page_size: 20, report_range: '7d', nudges: { requests: true, reschedules: true, stock: true, drafts: true }, onboarding_done: [], onboarding_hidden: false });
    expect(defaultPrefs(doctor).nudges).toEqual({ requests: false, reschedules: false, stock: false, drafts: true });
    expect(defaultPrefs(spa).nudges).toEqual({ requests: false, reschedules: false, stock: false, drafts: false });
  });
});
describe('resolvePrefs', () => {
  it('stored values win over defaults; the rest stay default', () => {
    expect(resolvePrefs({ text_size: 'lg', page_size: 50, nudges: { drafts: false } }, doctor)).toMatchObject({ text_size: 'lg', page_size: 50, density: 'comfortable', nudges: { drafts: false } });
  });
  it('a landing page or a nudge the person has since lost the right to falls back, without being erased', () => {
    const stored = { landing: 'invoices' as const, nudges: { stock: true } };
    expect(resolvePrefs(stored, mgr)).toMatchObject({ landing: 'invoices', nudges: { stock: true } });
    expect(resolvePrefs(stored, spa)).toMatchObject({ landing: 'home', nudges: { stock: false } });
  });
});
describe('validatePrefsPatch', () => {
  it('accepts every good value and an empty patch', () => {
    expect(validatePrefsPatch({}, mgr)).toEqual({});
    expect(validatePrefsPatch({ text_size: 'lg', density: 'compact', motion: 'reduced', landing: 'inpatient', appointments_view: 'day', page_size: 50, report_range: 'month', nudges: { stock: false }, onboarding_done: ['xem-lich', 'lap_hoa_don'], onboarding_hidden: true }, mgr)).toEqual({});
  });
  it('wrong values are refused on their own field', () => {
    expect(validatePrefsPatch({ text_size: 'xl', density: 3, motion: null, appointments_view: 'month', report_range: '1y' }, mgr)).toEqual({ text_size: PREFS_MSG.text_size, density: PREFS_MSG.density, motion: PREFS_MSG.motion, appointments_view: PREFS_MSG.appointments_view, report_range: PREFS_MSG.report_range });
    expect(validatePrefsPatch({ page_size: '20' }, mgr)).toEqual({ page_size: PREFS_MSG.page_size });
    expect(validatePrefsPatch({ page_size: 25 }, mgr)).toEqual({ page_size: PREFS_MSG.page_size });
    expect(validatePrefsPatch({ landing: 'revenue' }, mgr)).toEqual({ landing: PREFS_MSG.landing });
  });
  it('unknown keys, including inherited names, and a patch that is not an object', () => {
    expect(validatePrefsPatch({ colour: 'red' }, mgr)).toEqual({ colour: PREFS_MSG.unknown });
    expect(validatePrefsPatch(JSON.parse('{"__proto__": 1, "constructor": 2}'), mgr)).toEqual({ __proto__: PREFS_MSG.unknown, constructor: PREFS_MSG.unknown });
    for (const bad of [null, [], 'lg', 5]) expect(validatePrefsPatch(bad, mgr)).toEqual({ prefs: PREFS_MSG.shape });
  });
  it('nudges: only booleans, only known keys, and turning one on needs the right', () => {
    expect(validatePrefsPatch({ nudges: 'on' }, mgr)).toEqual({ nudges: PREFS_MSG.shape });
    expect(validatePrefsPatch({ nudges: { stock: 'yes', colour: true } }, mgr)).toEqual({ 'nudges.stock': PREFS_MSG.nudge, 'nudges.colour': PREFS_MSG.unknown });
    expect(validatePrefsPatch({ nudges: { stock: true } }, spa)).toEqual({ 'nudges.stock': PREFS_MSG.nudgeNoAccess });
    expect(validatePrefsPatch({ nudges: { stock: false } }, spa)).toEqual({});
  });
  it('a landing page needs the right to it', () => {
    expect(validatePrefsPatch({ landing: 'invoices' }, spa)).toEqual({ landing: PREFS_MSG.landingNoAccess });
    expect(validatePrefsPatch({ landing: 'home' }, spa)).toEqual({});
    expect(validatePrefsPatch({ landing: 'invoices' }, doctor)).toEqual({});
  });
  it('the done-list: strings of a safe shape, at most 50', () => {
    expect(validatePrefsPatch({ onboarding_done: ['Có Dấu'] }, mgr)).toEqual({ onboarding_done: PREFS_MSG.onboarding_done });
    expect(validatePrefsPatch({ onboarding_done: [5] }, mgr)).toEqual({ onboarding_done: PREFS_MSG.onboarding_done });
    expect(validatePrefsPatch({ onboarding_done: Array.from({ length: 51 }, (_, i) => `k${i}`) }, mgr)).toEqual({ onboarding_done: PREFS_MSG.onboarding_done });
    expect(validatePrefsPatch({ onboarding_done: Array.from({ length: 50 }, (_, i) => `k${i}`) }, mgr)).toEqual({});
    expect(validatePrefsPatch({ onboarding_hidden: 'yes' }, mgr)).toEqual({ onboarding_hidden: PREFS_MSG.onboarding_hidden });
  });
});
describe('mergePatch', () => {
  it('overwrites only what the patch names, nudge by nudge, and drops repeats from the done-list', () => {
    expect(mergePatch({ text_size: 'lg', nudges: { stock: true, drafts: true } }, { density: 'compact', nudges: { stock: false }, onboarding_done: ['a', 'b', 'a'] }))
      .toEqual({ text_size: 'lg', density: 'compact', nudges: { stock: false, drafts: true }, onboarding_done: ['a', 'b'] });
  });
});
```
(`import { effectiveCaps } from './capabilities'`.) `db.test.ts`: một test "a stored document from before staff preferences existed gets an empty table" (xóa khóa `staff_prefs` khỏi tài liệu cũ, `tinySeed` thêm `staff_prefs: []` qua `emptyTables()`; kiểm `db.read().t.staff_prefs` là `[]`).

- [ ] **Step 2: Run to verify fail** — `npx vitest run src/data/rules/staff-prefs.test.ts src/data/mock/store/db.test.ts` → FAIL (thiếu module; `staff_prefs` undefined).
- [ ] **Step 3: Implement** enums, kiểu hợp đồng, bảng (kiểu + `emptyTables`), `rules/staff-prefs.ts`.
- [ ] **Step 4: Run to verify pass** — `npm test && npm run typecheck && npx eslint src/data` → PASS.
- [ ] **Step 5: Commit** — `feat: staff preference types, table and pure rules`.

---

### Task 2: `staff.prefs`

**Files:**
- Create: `src/data/mock/api/staff/prefs.ts`, `prefs.test.ts`
- Modify: `src/data/mock/api/index.ts` (thêm `prefs: staffPrefsApi(env)` vào `staff`)

**Interfaces:**
- Consumes: Task 1; `anyStaff` (`./common`), `sleepRead`, `sleepWrite`.
- Produces: `export function staffPrefsApi(env: Env): StaffPrefsApi`.

Cách làm: `get` = `resolvePrefs(row?.values, caps)`. `save(patch)`: `validatePrefsPatch(patch, caps)` → `ValidationError(errors)`; nếu patch rỗng (không khóa) trả `get()` mà **không** gọi `transact`; trong `transact` đọc lại dòng mới nhất của người đó (tạo `{ staff_id, values: {} }` nếu chưa có) rồi `mergePatch` — nhờ vậy hai tab lưu khóa khác nhau không ghi đè nhau; trả `resolvePrefs` của giá trị mới. `reset`: xóa dòng của người đó (nếu có) và trả mặc định theo quyền hiện tại; không dòng thì không ghi gì.

- [ ] **Step 1: Write the failing tests** (`prefs.test.ts`; `makeTestApi()`, `loginAs`, `createMockApi` dùng chung `db` cho nhiều phiên như ở `team.test.ts`)
```ts
it.each([['quanly_ha', { requests: true, reschedules: true, stock: true, drafts: true }], ['bacsi_duc', { requests: true, reschedules: true, stock: false, drafts: true }], ['bacsi_mai', { requests: false, reschedules: false, stock: false, drafts: true }], ['spa_ngocanh', { requests: false, reschedules: false, stock: false, drafts: false }]])('%s starts with the defaults for their role', async (who, nudges) => {
  const { api } = makeTestApi();
  await loginAs(api, who);
  expect(await api.staff.prefs.get()).toMatchObject({ text_size: 'md', density: 'comfortable', motion: 'system', landing: 'home', appointments_view: 'week', page_size: 20, report_range: '7d', nudges, onboarding_done: [], onboarding_hidden: false });
});
it('save keeps only what was named, returns the merged result and survives a new session', async () => {
  const t = makeTestApi();
  await loginAs(t.api, 'bacsi_duc');
  const saved = await t.api.staff.prefs.save({ text_size: 'lg', nudges: { drafts: false }, onboarding_done: ['xem-lich', 'xem-lich'] });
  expect(saved).toMatchObject({ text_size: 'lg', density: 'comfortable', nudges: { requests: true, drafts: false }, onboarding_done: ['xem-lich'] });
  expect(t.db.read().t.staff_prefs).toEqual([{ staff_id: 'stf-duc', values: { text_size: 'lg', nudges: { drafts: false }, onboarding_done: ['xem-lich'] } }]);
  await t.api.auth.logout();
  await loginAs(t.api, 'bacsi_duc');
  expect((await t.api.staff.prefs.get()).text_size).toBe('lg');
});
it('two saves of different options in turn both stay', async () => {
  const { api } = makeTestApi();
  await loginAs(api, 'quanly_ha');
  await api.staff.prefs.save({ page_size: 50 });
  await api.staff.prefs.save({ report_range: 'month' });
  expect(await api.staff.prefs.get()).toMatchObject({ page_size: 50, report_range: 'month' });
});
it('two saves at once of different options both land', async () => {
  const { api } = makeTestApi();
  await loginAs(api, 'quanly_ha');
  await Promise.all([api.staff.prefs.save({ density: 'compact' }), api.staff.prefs.save({ motion: 'reduced' })]);
  expect(await api.staff.prefs.get()).toMatchObject({ density: 'compact', motion: 'reduced' });
});
it('a refused save writes nothing, even the good fields next to the bad one', async () => {
  const { api, db } = makeTestApi();
  await loginAs(api, 'spa_ngocanh');
  const rev = db.read().rev;
  expect(await fieldsOf(api.staff.prefs.save({ text_size: 'lg', landing: 'invoices', nudges: { stock: true }, colour: 'red' } as never))).toEqual({ landing: PREFS_MSG.landingNoAccess, 'nudges.stock': PREFS_MSG.nudgeNoAccess, colour: PREFS_MSG.unknown });
  expect(db.read().rev).toBe(rev);
  expect((await api.staff.prefs.get()).text_size).toBe('md');
});
it('an empty patch writes nothing', async () => {
  const { api, db } = makeTestApi();
  await loginAs(api, 'quanly_ha');
  const rev = db.read().rev;
  await api.staff.prefs.save({});
  expect(db.read().rev).toBe(rev);
});
it('people do not see each other\'s options', async () => {
  const t = makeTestApi();
  const second = createMockApi({ db: t.db, sessionKV: createKV(memoryStorage()), rememberKV: createKV(memoryStorage()), clock: () => new Date(TEST_NOW) });
  await loginAs(t.api, 'quanly_ha');
  await loginAs(second, 'bacsi_mai');
  await t.api.staff.prefs.save({ text_size: 'lg' });
  expect((await second.staff.prefs.get()).text_size).toBe('md');
});
it('reset goes back to the defaults of the current role and removes the row; resetting twice is harmless', async () => {
  const { api, db } = makeTestApi();
  await loginAs(api, 'bacsi_duc');
  await api.staff.prefs.save({ text_size: 'lg' });
  expect((await api.staff.prefs.reset()).text_size).toBe('md');
  expect(db.read().t.staff_prefs).toEqual([]);
  const rev = db.read().rev;
  await api.staff.prefs.reset();
  expect(db.read().rev).toBe(rev);
});
it('losing a right later: the landing page reads home and the nudge reads off, the saved value stays', async () => {
  const t = makeTestApi();
  await loginAs(t.api, 'bacsi_duc');
  await t.api.staff.prefs.save({ landing: 'invoices', nudges: { requests: true } });
  t.db.transact('t', (d) => { const u = d.t.staff_users.find((x) => x.username === 'bacsi_duc')!; u.preset_ids = ['spa']; u.extra_capabilities = []; });
  expect(await t.api.staff.prefs.get()).toMatchObject({ landing: 'home', nudges: { requests: false } });
  expect(t.db.read().t.staff_prefs[0]!.values).toMatchObject({ landing: 'invoices', nudges: { requests: true } });
});
it('a customer, a signed-out visitor and a switched-off staff member are refused', async () => {
  const t = makeTestApi();
  await expect(t.api.staff.prefs.get()).rejects.toThrow(ForbiddenError);
  await loginAs(t.api, 'lan_nguyen');
  for (const call of [() => t.api.staff.prefs.get(), () => t.api.staff.prefs.save({ text_size: 'lg' }), () => t.api.staff.prefs.reset()]) await expect(call()).rejects.toThrow(ForbiddenError);
  await loginAs(t.api, 'bacsi_duc');
  t.db.transact('t', (d) => { d.t.staff_users.find((u) => u.username === 'bacsi_duc')!.active = false; });
  await expect(t.api.staff.prefs.get()).rejects.toThrow(ForbiddenError);
});
```
(Nhập như `team.test.ts`; `PREFS_MSG` từ `rules/staff-prefs`; `fieldsOf` như các test trước.)
- [ ] **Step 2: Run to verify fail** — `npx vitest run src/data/mock/api/staff/prefs.test.ts` → FAIL (`api.staff.prefs` không có).
- [ ] **Step 3: Implement** theo "Cách làm".
- [ ] **Step 4: Run to verify pass** — `npm test && npm run typecheck && npx eslint src/data` → PASS. Kiểm độ "cắn": tạm bỏ kiểm quyền `landing` trong `validatePrefsPatch`, và tạm cho `save` ghi đè cả dòng thay vì `mergePatch` → test quyền và test "hai lần lưu" đỏ; trả lại.
- [ ] **Step 5: Commit** — `feat: staff.prefs (get, save, reset) per staff member`.

---

### Task 3: Tài liệu, kiểm tra toàn bộ, rà soát độc lập, gộp

- [ ] **Step 1: Cập nhật tài liệu.** `PROGRESS.md`: "Đã xong" thêm **Phần 5 · giai đoạn 4 — Cài đặt B** (`staff.prefs`: `get`, `save`, `reset`; các tùy chọn và mặc định; kiểm tra quyền cho trang vào và nhắc việc; mất quyền về sau thì đọc ra `home`/`false`; chỉ lưu khóa đã đặt; hai tab lưu khóa khác nhau không ghi đè; không ghi nhật ký; lớp dữ liệu chỉ lưu, giao diện áp dụng); "Việc tiếp theo" sang giai đoạn 5 (cài đặt hệ thống); "Thay đổi hợp đồng": hằng và kiểu mới, `StaffPrefs`, `StaffPrefsPatch`, `StaffPrefsApi`, bảng `staff_prefs`, khóa lỗi (`<tên tùy chọn>`, `nudges.<khóa>`, `prefs`); "Yêu cầu gửi nhánh kia": màn tùy chọn (cỡ chữ, độ dày bảng, giảm chuyển động, trang vào, kiểu xem lịch, số dòng, khoảng ngày báo cáo, nhắc việc theo quyền), tự áp dụng khi đọc `get()` sau đăng nhập; `landing` đã được lớp dữ liệu hạ về `home` nếu mất quyền; chỉ gọi `save` với phần đổi.
- [ ] **Step 2: Chạy toàn bộ** — `npm run verify` (nền). Expected: exit 0 trừ bài tải video của bên giao diện (đã biết đỏ, chạy riêng để xác nhận cùng bài).
- [ ] **Step 3: Rà soát độc lập** bằng agent mới (diff so với nhánh tích hợp, spec, kế hoạch, Review Focus); sửa mọi lỗi quan trọng test-first; lỗi nhỏ ghi sổ.
- [ ] **Step 4: Commit, đẩy, gộp** như các giai đoạn trước (`git push -u origin claude/du-lieu`; ở thư mục gốc `git fetch origin && git merge --ff-only origin/claude/focused-pascal-rfxnnp`, `git merge --no-ff claude/du-lieu`, `git push origin claude/focused-pascal-rfxnnp`; nếu nhánh tích hợp đã đi tiếp thì gộp nó vào `claude/du-lieu` trước và chạy lại test đơn vị và kiểm tra kiểu).

---

## Self-Review

- **Độ phủ spec §3.3.B:** mọi tùy chọn và mặc định (T1) · `get`/`save`/`reset` theo phiên (T2) · kiểm tra giá trị lạ/khóa lạ (T1, T2) · `landing` theo quyền, `nudges` theo quyền (T1, T2) · `onboarding_done`/`onboarding_hidden` (T1, T2).
- **Khác spec (kế hoạch chốt):** `save` trả về tùy chọn đã gộp (mở rộng, không phá hợp đồng); mất quyền thì đọc ra `home`/`false` thay vì từ chối lúc đọc; không ghi nhật ký; `onboarding_done` giới hạn 50 mục dạng `[a-z0-9_.-]{1,40}`.
- **Nhất quán kiểu:** `StaffPrefsPatch` dùng làm kiểu lưu trữ (`StaffPrefsRow.values`) và đầu vào `save`; `resolvePrefs`/`mergePatch`/`validatePrefsPatch` định nghĩa ở T1, dùng ở T2.
