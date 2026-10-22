# Phần 5 · Giai đoạn 3 — Cài đặt A: tài khoản nhân viên, hồ sơ cá nhân, thông tin bệnh viện (dữ liệu) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quản lý tạo, sửa, tắt/bật nhân viên và đặt lại mật khẩu (`staff.team`); mọi nhân viên xem hồ sơ, đổi tên hiển thị, đổi mật khẩu (`staff.profile`) và xem thông tin bệnh viện chỉ đọc (`staff.settings.hospital`).

**Architecture:** Quy tắc thuần ở `rules/staff-admin.ts` (kiểm tra đầu vào, quyền lẻ, "còn ít nhất một Quản lý") và `rules/hospital.ts` (hằng nguyên văn). API ở `mock/api/staff/team.ts` và `profile.ts` theo khuôn `prices.ts`/`stock.ts`: `staffActor`, `db.transact`, `checkVersion`, `audit`. Mật khẩu băm ngoài `transact` bằng `hashPassword`/`newSalt` có sẵn; tên đăng nhập kiểm tra lại **trong** `transact` như `auth.signup`.

**Tech Stack:** TypeScript 6, Vitest 5, mock store. Không thêm thư viện.

**Spec:** `docs/superpowers/specs/2026-10-21-phan-5-kho-bao-cao-cai-dat-design.md` (§3.0 quyền, §3.3.A). Chủ dự án đã duyệt 21/10/2026.

## Global Constraints

- Chỉ sửa `src/data/**`, `docs/`, `PROGRESS.md`. **Không** sửa `src/features`, `src/app`, `src/ui`, `src/styles`.
- Hợp đồng `src/data/contracts/` **chỉ thêm**. Lỗi nhập là `ValidationError(fields)` với **khóa trường** và câu tiếng Việt nguyên văn ở Task 2.
- Quyền mới `staff.manage` ("Quản lý tài khoản nhân viên"): chỉ Quản lý có sẵn; Bác sĩ, Spa không đổi. Hồ sơ cá nhân và thông tin bệnh viện: **mọi nhân viên đang dùng**, không cần quyền riêng; khách và khách vãng lai bị `ForbiddenError`.
- **Mật khẩu không bao giờ** xuất hiện trong kết quả trả về, nhật ký thao tác hay `summary_vi`. Thao tác về mật khẩu, vai, quyền, tắt/bật ghi nhật ký `sensitive: true`.
- Tên đăng nhập dùng chung quy tắc `validateUsername`/`validatePassword`/`MSG` của `rules/validation.ts`, **không trùng** nhân viên hay tài khoản khách khác.
- Nhân viên mới vẫn `is_sample: true`; không xóa hẳn nhân viên; "Khôi phục dữ liệu mẫu" làm nhân viên tạo thêm biến mất (hành vi sẵn có của `db.reset`).
- Thông tin bệnh viện **nguyên văn `CLAUDE.md`**, không có giờ làm việc thường.
- Không đổi dữ liệu mẫu hiện có ngoài việc thêm `version: 1` cho nhân viên mẫu.
- TDD: test thất bại trước. Commit nhỏ, tiêu đề tiếng Anh; **không ghi tên model vào commit/code/tài liệu**; thân commit chỉ kết thúc bằng dòng `Claude-Session: https://claude.ai/code/session_01WQRA4c5rpvrJd3fkJ3fRkU`.
- Trước khi gộp: `npm run verify` trong `.worktrees/du-lieu` (~12–14 phút). Lưu ý: từ 00:00 đến ~03:30 giờ Việt Nam vài bài e2e đỏ vì dữ liệu mẫu nhạy giờ (đã ghi ở `PROGRESS.md`).

## Review Focus

1. **Không tự khóa mình và luôn còn một Quản lý:** không tắt chính mình; không tắt hay hạ vai người Quản lý cuối cùng, kể cả khi người thao tác là người không phải Quản lý nhưng có `staff.manage` lẻ (Task 3).
2. **Tên đăng nhập trùng:** với nhân viên, với tài khoản khách, tên không hợp lệ, **hai lần tạo cùng lúc** (Task 3).
3. **Mật khẩu không lộ** và đổi mật khẩu đủ mọi lỗi: sai mật khẩu hiện tại, mật khẩu yếu, trùng mật khẩu cũ, hai ô không khớp; phiên đang mở giữ nguyên; mật khẩu cũ hết dùng được (Task 3, 4).
4. **Hiệu lực ngay với phiên đang mở:** đổi vai/quyền hoặc tắt tài khoản thì lần gọi kế tiếp của người đó đã đổi (Task 3).
5. **Quyền và phiên bản:** Bác sĩ/Spa/khách/khách vãng lai bị từ chối ở mọi hàm `team`; hai tab sửa cùng một nhân viên → `ConflictError`; đổi mật khẩu/tên của chính mình làm phiên bản cũ ở danh sách nhân viên thành cũ (Task 3, 4).

---

## File Structure

| Tệp | Việc |
|---|---|
| `src/data/rules/capabilities.ts` (sửa) | quyền `staff.manage` |
| `src/data/mock/store/schema.ts`, `store/db.ts`, `seed/accounts.ts` (sửa) | `StaffUser.version`; nhân viên cũ tự là phiên bản 1 |
| `src/data/rules/staff-admin.ts` (mới) | kiểm tra đầu vào, quyền lẻ, "còn Quản lý", đổi mật khẩu; `STAFF_MSG` |
| `src/data/rules/hospital.ts` (mới) | `HOSPITAL_INFO` |
| `src/data/contracts/staff.ts` (sửa) | kiểu và `StaffTeamApi`, `StaffProfileApi`, `StaffSettingsApi` |
| `src/data/mock/api/staff/common.ts` (sửa) | `anyStaff(env)` |
| `src/data/mock/api/staff/team.ts`, `profile.ts` (mới); `api/index.ts` (sửa) | API |
| Test | `capabilities.test.ts`, `db.test.ts`, `rules/staff-admin.test.ts`, `rules/hospital.test.ts`, `api/staff/team.test.ts`, `api/staff/profile.test.ts` |

---

### Task 1: Quyền `staff.manage` và phiên bản cho nhân viên

**Files:**
- Modify: `src/data/rules/capabilities.ts`, `capabilities.test.ts`; `src/data/mock/store/schema.ts`, `store/db.ts`, `store/db.test.ts`; `src/data/mock/seed/accounts.ts`

**Interfaces:**
- Produces: `Cap` thêm `'staff.manage'` (nhãn `'Quản lý tài khoản nhân viên'`); `StaffUser.version: number`; tài liệu cũ tự điền `version = 1` cho `staff_users`.

- [ ] **Step 1: Write the failing tests.** `capabilities.test.ts`: số quyền **20**; test "only the manager has `staff.manage`" (Quản lý có; Bác sĩ, Spa không; quyền lẻ cấp được). `db.test.ts`: một test cạnh "rows saved before versions existed load as version 1": thêm một `staff_users` thiếu `version` vào tài liệu cũ rồi kiểm `db.read().t.staff_users[0].version === 1`.
- [ ] **Step 2: Run to verify fail** — `npx vitest run src/data/rules/capabilities.test.ts src/data/mock/store/db.test.ts` → FAIL (19 quyền; `version` undefined).
- [ ] **Step 3: Implement.** Thêm quyền cuối `CAPS` và `CAP_LABEL`; `StaffUser` thêm `version: number`; `seed/accounts.ts` đặt `version: 1` khi tạo nhân viên mẫu; `db.ts` thêm `d.t.staff_users` vào danh sách bảng được `r.version ??= 1`. Sửa mọi chỗ khác dựng `StaffUser` (typecheck chỉ ra).
- [ ] **Step 4: Run to verify pass** — `npm test && npm run typecheck && npx eslint src/data` → PASS.
- [ ] **Step 5: Commit** — `feat: staff.manage capability and versions for staff users`.

---

### Task 2: Quy tắc thuần, hằng thông tin bệnh viện, kiểu hợp đồng

**Files:**
- Create: `src/data/rules/staff-admin.ts`, `staff-admin.test.ts`, `src/data/rules/hospital.ts`, `hospital.test.ts`
- Modify: `src/data/contracts/staff.ts` (chỉ thêm)

**Interfaces:**
- Consumes: `CAPS`, `PRESETS`/`PresetId` (`rules/capabilities`), `validateUsername`, `validatePassword`, `MSG` (`rules/validation`).
- Produces (`staff.ts`, chỉ thêm):
```ts
export type StaffAdminRow = { id: string; username: string; name: string; title: string; presets: PresetId[]; extraCaps: Cap[]; active: boolean; isSelf: boolean; version: number };
export type StaffAccountInput = { display_name: string; title: string; preset_ids: PresetId[]; extra_capabilities: Cap[] };
export type StaffCreateInput = StaffAccountInput & { username: string; password: string };
export interface StaffTeamApi {
  list(): Promise<StaffAdminRow[]>;
  create(input: StaffCreateInput): Promise<string>;
  update(id: string, version: number, input: StaffAccountInput): Promise<void>;
  setActive(id: string, version: number, active: boolean): Promise<void>;
  resetPassword(id: string, version: number, input: { password: string }): Promise<void>;
}
export type StaffProfile = { username: string; name: string; title: string; presets: PresetId[]; caps: Cap[] };
export interface StaffProfileApi {
  get(): Promise<StaffProfile>;
  updateName(name: string): Promise<void>;
  changePassword(input: { current: string; next: string; next2: string }): Promise<void>;
}
export type HospitalInfo = { name: string; address: string; hotline: string; hotlineTel: string; emergencyHours: string; headDoctor: string };
export interface StaffSettingsApi { hospital(): Promise<HospitalInfo> }
```
(import `Cap`, `PresetId` từ `../rules/capabilities` bằng `import type`.)
- Produces (`rules/staff-admin.ts`):
```ts
export const STAFF_MSG: { name: 'Vui lòng nhập tên hiển thị.'; nameLong: 'Tên hiển thị tối đa 60 ký tự.'; title: 'Vui lòng nhập chức danh.'; titleLong: 'Chức danh tối đa 40 ký tự.'; presets: 'Vui lòng chọn ít nhất một vai.'; presetUnknown: 'Vai không hợp lệ.'; capUnknown: 'Có quyền không hợp lệ.'; selfOff: 'Bạn không tắt được tài khoản của chính mình.'; lastManager: 'Phải còn ít nhất một Quản lý đang dùng.'; selfPassword: 'Bạn đổi mật khẩu của mình ở Hồ sơ cá nhân.'; currentWrong: 'Mật khẩu hiện tại chưa đúng.'; samePassword: 'Mật khẩu mới cần khác mật khẩu hiện tại.' };
export function validateStaffInput(input: StaffAccountInput): Record<string, string>;      // khóa: display_name, title, preset_ids, extra_capabilities
export function validateNewStaff(input: StaffCreateInput): Record<string, string>;         // thêm: username (validateUsername), password (validatePassword)
export function normalizeExtraCaps(presets: readonly PresetId[], extras: readonly Cap[]): Cap[]; // bỏ quyền đã nằm trong vai, bỏ trùng, theo thứ tự CAPS
export function hasActiveManager(users: readonly { active: boolean; preset_ids: readonly PresetId[] }[]): boolean;
export function validateNameChange(name: string): string | null;                            // trống → STAFF_MSG.name; > 60 → nameLong
export function validatePasswordChange(i: { current: string; next: string; next2: string }, currentOk: boolean): Record<string, string>; // khóa current, next, next2
```
Tên và chức danh kiểm tra **sau `trim()`**; tên hiển thị tối đa 60, chức danh 1–40. `validatePasswordChange`: `!currentOk` → `current`; `validatePassword(next)` lỗi → `next`; nếu `next` hợp lệ mà `=== current` → `next: samePassword`; `next !== next2` → `next2: MSG.passwordMismatch`.
- Produces (`rules/hospital.ts`): `export const HOSPITAL_INFO: HospitalInfo` = `{ name: 'Bệnh viện Thú y Lê Sơn', address: '101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội', hotline: '097 355 51 05', hotlineTel: 'tel:+84973555105', emergencyHours: '24/24', headDoctor: 'Bác sĩ trưởng Lê Thái Sơn' }`.

- [ ] **Step 1: Write the failing tests**

`staff-admin.test.ts`:
```ts
const ok = { display_name: 'BS. Mới', title: 'Bác sĩ', preset_ids: ['bac_si'], extra_capabilities: [] } as const;
describe('validateStaffInput', () => {
  it('accepts a good input; spaces around name and title are ignored', () => {
    expect(validateStaffInput(ok)).toEqual({});
    expect(validateStaffInput({ ...ok, display_name: '  ', title: ' ' })).toEqual({ display_name: STAFF_MSG.name, title: STAFF_MSG.title });
  });
  it('limits the length of name (60) and title (40)', () => {
    expect(validateStaffInput({ ...ok, display_name: 'x'.repeat(61) }).display_name).toBe(STAFF_MSG.nameLong);
    expect(validateStaffInput({ ...ok, title: 'x'.repeat(41) }).title).toBe(STAFF_MSG.titleLong);
    expect(validateStaffInput({ ...ok, display_name: 'x'.repeat(60), title: 'x'.repeat(40) })).toEqual({});
  });
  it('needs at least one known role and only known capabilities', () => {
    expect(validateStaffInput({ ...ok, preset_ids: [] }).preset_ids).toBe(STAFF_MSG.presets);
    expect(validateStaffInput({ ...ok, preset_ids: ['chu' as never] }).preset_ids).toBe(STAFF_MSG.presetUnknown);
    expect(validateStaffInput({ ...ok, extra_capabilities: ['x.y' as never] }).extra_capabilities).toBe(STAFF_MSG.capUnknown);
  });
});
describe('validateNewStaff', () => {
  it('uses the sign-up rules for username and password', () => {
    expect(validateNewStaff({ ...ok, username: 'bacsi_moi', password: 'matkhau-moi-1' })).toEqual({});
    expect(validateNewStaff({ ...ok, username: 'ab', password: 'abc' })).toEqual({ username: MSG.usernameLength, password: MSG.passwordShort });
  });
});
describe('normalizeExtraCaps', () => {
  it('drops what the role already gives and duplicates, in capability order', () => {
    expect(normalizeExtraCaps(['bac_si'], ['stock.manage', 'appointments.view', 'stock.view', 'stock.view'])).toEqual(['stock.view', 'stock.manage']);
    expect(normalizeExtraCaps(['quan_ly'], ['stock.view'])).toEqual([]);
  });
});
describe('hasActiveManager', () => {
  it('needs an active user with the manager role', () => {
    expect(hasActiveManager([{ active: true, preset_ids: ['quan_ly'] }])).toBe(true);
    expect(hasActiveManager([{ active: false, preset_ids: ['quan_ly'] }, { active: true, preset_ids: ['bac_si'] }])).toBe(false);
    expect(hasActiveManager([{ active: true, preset_ids: ['bac_si', 'quan_ly'] }])).toBe(true);
    expect(hasActiveManager([])).toBe(false);
  });
});
describe('name and password change', () => {
  it('name: empty and over 60 are refused', () => {
    expect(validateNameChange(' ')).toBe(STAFF_MSG.name);
    expect(validateNameChange('x'.repeat(61))).toBe(STAFF_MSG.nameLong);
    expect(validateNameChange('  Hà  ')).toBeNull();
  });
  it('password: each error on its own field', () => {
    const good = { current: 'cu-matkhau-1', next: 'moi-matkhau-2', next2: 'moi-matkhau-2' };
    expect(validatePasswordChange(good, true)).toEqual({});
    expect(validatePasswordChange(good, false)).toEqual({ current: STAFF_MSG.currentWrong });
    expect(validatePasswordChange({ ...good, next: 'abc', next2: 'abc' }, true)).toEqual({ next: MSG.passwordShort });
    expect(validatePasswordChange({ ...good, next: good.current, next2: good.current }, true)).toEqual({ next: STAFF_MSG.samePassword });
    expect(validatePasswordChange({ ...good, next2: 'khac-hoan-toan' }, true)).toEqual({ next2: MSG.passwordMismatch });
  });
});
```
`hospital.test.ts`: `HOSPITAL_INFO` `toEqual` đúng sáu chuỗi nguyên văn ở trên (viết tay trong test) và `Object.keys` **không** có khóa nào chứa "hour" ngoài `emergencyHours` (không giờ làm việc thường).

- [ ] **Step 2: Run to verify fail** — `npx vitest run src/data/rules/staff-admin.test.ts src/data/rules/hospital.test.ts` → FAIL (module không tồn tại).
- [ ] **Step 3: Implement** kiểu hợp đồng (cuối `staff.ts`), `staff-admin.ts`, `hospital.ts` theo khối Interfaces. Gợi ý: so khớp vai bằng `Object.keys(PRESETS)`; quyền bằng `CAPS`.
- [ ] **Step 4: Run to verify pass** — `npx vitest run src/data/rules && npm run typecheck && npx eslint src/data` → PASS.
- [ ] **Step 5: Commit** — `feat: staff admin rules, hospital info and contract types`.

---

### Task 3: `staff.team`

**Files:**
- Create: `src/data/mock/api/staff/team.ts`, `team.test.ts`
- Modify: `src/data/mock/api/index.ts` (thêm `team: staffTeamApi(env)` vào `staff`)

**Interfaces:**
- Consumes: Task 1–2; `staffActor`, `find`, `audit` (`./common`), `checkVersion`, `hashPassword`, `newSalt` (`../../password`), `newId`, `sleepRead`, `sleepWrite`, `normalizeExtraCaps`, `hasActiveManager`, `validate*`, `STAFF_MSG`, `MSG`.
- Produces: `export function staffTeamApi(env: Env): StaffTeamApi`.

Quyết định thực thi:
- Mọi hàm `staffActor(env, 'staff.manage')`. Kiểm `version` **trước** kiểm đầu vào (như `prices.ts`).
- `list`: mọi nhân viên kể cả đã tắt, người đã tắt xếp cuối, còn lại giữ thứ tự bảng; trả **literal tường minh** (không rải đối tượng; không có `password_*`).
- `create`: kiểm đầu vào bằng `validateNewStaff`; tên đăng nhập trùng nhân viên hoặc tài khoản khách → `fields.username = MSG.usernameTaken`; băm mật khẩu **ngoài** `transact`; trong `transact` kiểm lại trùng tên đăng nhập; đẩy `StaffUser { id: newId(), username, display_name: trim, title: trim, preset_ids, extra_capabilities: normalizeExtraCaps(...), is_sample: true, active: true, password_salt, password_hash, version: 1 }`; nhật ký `staff.create` `sensitive: true`, `summary_vi` = `${người làm} thêm tài khoản nhân viên ${username}` (không mật khẩu). Trả `id`.
- `update`: `validateStaffInput`; tính vai mới; nếu sau thay đổi **không còn** Quản lý đang dùng (`hasActiveManager` trên danh sách đã áp dụng thay đổi) → `ValidationError({ preset_ids: STAFF_MSG.lastManager })`; áp dụng, `version += 1`; nhật ký `staff.update` `sensitive: true`.
- `setActive`: tắt chính mình → `ValidationError({ active: STAFF_MSG.selfOff })`; sau thay đổi không còn Quản lý đang dùng → `ValidationError({ active: STAFF_MSG.lastManager })`; bật thì không kiểm; `version += 1`; nhật ký `staff.activate`/`staff.deactivate` `sensitive: true`.
- `resetPassword`: id là chính mình → `ValidationError({ password: STAFF_MSG.selfPassword })`; `validatePassword`; băm ngoài `transact`; `version += 1`; nhật ký `staff.password_reset` `sensitive: true`.

- [ ] **Step 1: Write the failing tests** (`team.test.ts`; `setup()` = `makeTestApi()` + `loginAs(api, 'quanly_ha')`; helpers `fieldsOf(promise)`, `row(db, username)`)

```ts
it('lists everyone with active people first, marks the caller, and never carries a password', async () => {
  const { api } = await setup();
  const rows = await api.staff.team.list();
  expect(rows.map((r) => r.username)).toEqual(['quanly_ha', 'bacsi_duc', 'bacsi_mai', 'spa_ngocanh']);
  expect(rows.find((r) => r.isSelf)!.username).toBe('quanly_ha');
  expect(rows[0]).toMatchObject({ name: 'Nguyễn Thu Hà', presets: ['quan_ly'], active: true, version: 1 });
  expect(JSON.stringify(rows)).not.toMatch(/password|salt|hash/i);
});
describe('create', () => {
  const input = { username: 'bacsi_moi', password: 'matkhau-moi-1', display_name: 'BS. Mới', title: 'Bác sĩ', preset_ids: ['bac_si'], extra_capabilities: ['stock.view', 'appointments.view'] } as const;
  it('adds the person, drops capabilities the role already has, audits without the password, and they can sign in', async () => {
    const { api, db } = await setup();
    const id = await api.staff.team.create({ ...input, extra_capabilities: [...input.extra_capabilities] });
    expect(row(db, 'bacsi_moi')).toMatchObject({ id, display_name: 'BS. Mới', title: 'Bác sĩ', preset_ids: ['bac_si'], extra_capabilities: ['stock.view'], active: true, is_sample: true, version: 1 });
    expect(row(db, 'bacsi_moi').password_hash).not.toBe(input.password);
    const audit = db.read().t.audit_events.at(-1)!;
    expect(audit).toMatchObject({ action: 'staff.create', sensitive: true });
    expect(JSON.stringify(audit)).not.toContain(input.password);
    await api.auth.logout();
    await api.auth.login({ identifier: 'bacsi_moi', password: input.password });
    expect(((await api.auth.me()) as { caps: string[] }).caps).toContain('stock.view');
  });
  it('refuses a username used by staff or by a customer, a bad one, a weak password and a blank name — and writes nothing', async () => {
    const { api, db } = await setup();
    const n = db.read().t.staff_users.length;
    expect(await fieldsOf(api.staff.team.create({ ...input, username: 'bacsi_duc', preset_ids: ['bac_si'], extra_capabilities: [] }))).toEqual({ username: MSG.usernameTaken });
    expect(await fieldsOf(api.staff.team.create({ ...input, username: 'lan_nguyen', preset_ids: ['bac_si'], extra_capabilities: [] }))).toEqual({ username: MSG.usernameTaken });
    expect(await fieldsOf(api.staff.team.create({ ...input, username: 'ab', password: 'abc', display_name: ' ', preset_ids: ['bac_si'], extra_capabilities: [] }))).toEqual({ username: MSG.usernameLength, password: MSG.passwordShort, display_name: STAFF_MSG.name });
    expect(db.read().t.staff_users).toHaveLength(n);
  });
  it('two creates of the same username at once: one wins, the other is told the name is taken', async () => {
    const { api, db } = await setup();
    const rs = await Promise.allSettled([api.staff.team.create({ ...input, preset_ids: ['bac_si'], extra_capabilities: [] }), api.staff.team.create({ ...input, preset_ids: ['bac_si'], extra_capabilities: [] })]);
    expect(rs.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(db.read().t.staff_users.filter((u) => u.username === 'bacsi_moi')).toHaveLength(1);
  });
});
describe('update', () => {
  it('changes name, title, role and extra capabilities and bumps the version; a stale version is refused', async () => {
    const { api, db } = await setup();
    const u = row(db, 'bacsi_mai');
    await api.staff.team.update(u.id, u.version, { display_name: 'BS. Mai Lan', title: 'Bác sĩ nội trú', preset_ids: ['bac_si'], extra_capabilities: ['stock.view'] });
    expect(row(db, 'bacsi_mai')).toMatchObject({ display_name: 'BS. Mai Lan', title: 'Bác sĩ nội trú', extra_capabilities: ['stock.view'], version: u.version + 1 });
    expect(db.read().t.audit_events.at(-1)).toMatchObject({ action: 'staff.update', sensitive: true });
    await expect(api.staff.team.update(u.id, u.version, { display_name: 'X', title: 'Y', preset_ids: ['bac_si'], extra_capabilities: [] })).rejects.toThrow(ConflictError);
  });
  it('the last manager cannot lose the role; with a second manager it can', async () => {
    const { api, db } = await setup();
    const me = row(db, 'quanly_ha');
    const demote = { display_name: me.display_name, title: me.title, preset_ids: ['bac_si'] as const, extra_capabilities: [] };
    expect(await fieldsOf(api.staff.team.update(me.id, me.version, { ...demote, preset_ids: ['bac_si'] }))).toEqual({ preset_ids: STAFF_MSG.lastManager });
    await api.staff.team.create({ username: 'quanly_hai', password: 'matkhau-moi-1', display_name: 'Quản lý Hai', title: 'Quản lý', preset_ids: ['quan_ly'], extra_capabilities: [] });
    await expect(api.staff.team.update(me.id, me.version, { ...demote, preset_ids: ['bac_si'] })).resolves.toBeUndefined();
  });
});
describe('setActive', () => {
  it('cannot switch off yourself', async () => {
    const { api, db } = await setup();
    const me = row(db, 'quanly_ha');
    expect(await fieldsOf(api.staff.team.setActive(me.id, me.version, false))).toEqual({ active: STAFF_MSG.selfOff });
  });
  it('switching a person off stops sign-in and moves them to the end; switching on again restores it', async () => {
    const { api, db } = await setup();
    const u = row(db, 'bacsi_duc');
    await api.staff.team.setActive(u.id, u.version, false);
    expect((await api.staff.team.list()).at(-1)).toMatchObject({ username: 'bacsi_duc', active: false });
    expect(db.read().t.audit_events.at(-1)).toMatchObject({ action: 'staff.deactivate', sensitive: true });
    await api.auth.logout();
    await expect(api.auth.login({ identifier: 'bacsi_duc', password: 'leson-demo' })).rejects.toThrow(AuthError);
    await loginAs(api, 'quanly_ha');
    const off = row(db, 'bacsi_duc');
    await api.staff.team.setActive(off.id, off.version, true);
    await api.auth.logout();
    await expect(api.auth.login({ identifier: 'bacsi_duc', password: 'leson-demo' })).resolves.toBeTruthy();
  });
  it('the last active manager cannot be switched off even by a non-manager who holds staff.manage', async () => {
    const { api, db } = makeTestApi();
    db.transact('t', (d) => { d.t.staff_users.find((u) => u.username === 'bacsi_duc')!.extra_capabilities = ['staff.manage']; });
    await loginAs(api, 'bacsi_duc');
    const boss = row(db, 'quanly_ha');
    expect(await fieldsOf(api.staff.team.setActive(boss.id, boss.version, false))).toEqual({ active: STAFF_MSG.lastManager });
  });
});
describe('resetPassword', () => {
  it('sets a new password for someone else: the old one stops working, nothing leaks, audit is sensitive', async () => {
    const { api, db } = await setup();
    const u = row(db, 'spa_ngocanh');
    await api.staff.team.resetPassword(u.id, u.version, { password: 'mat-khau-tam-9' });
    const audit = db.read().t.audit_events.at(-1)!;
    expect(audit).toMatchObject({ action: 'staff.password_reset', sensitive: true });
    expect(JSON.stringify(audit)).not.toContain('mat-khau-tam-9');
    await api.auth.logout();
    await expect(api.auth.login({ identifier: 'spa_ngocanh', password: 'leson-demo' })).rejects.toThrow(AuthError);
    await expect(api.auth.login({ identifier: 'spa_ngocanh', password: 'mat-khau-tam-9' })).resolves.toBeTruthy();
  });
  it('refuses your own account, a weak password and a stale version', async () => {
    const { api, db } = await setup();
    const me = row(db, 'quanly_ha');
    const u = row(db, 'spa_ngocanh');
    expect(await fieldsOf(api.staff.team.resetPassword(me.id, me.version, { password: 'mat-khau-tam-9' }))).toEqual({ password: STAFF_MSG.selfPassword });
    expect(await fieldsOf(api.staff.team.resetPassword(u.id, u.version, { password: 'abc' }))).toEqual({ password: MSG.passwordShort });
    await api.staff.team.resetPassword(u.id, u.version, { password: 'mat-khau-tam-9' });
    await expect(api.staff.team.resetPassword(u.id, u.version, { password: 'mat-khau-tam-8' })).rejects.toThrow(ConflictError);
  });
});
describe('a change takes effect on the person already signed in', () => {
  it('extra capabilities and switching off apply on their next call', async () => {
    const t = makeTestApi();
    const second = createMockApi({ db: t.db, sessionKV: createKV(memoryStorage()), rememberKV: createKV(memoryStorage()), clock: () => new Date(TEST_NOW) });
    await loginAs(t.api, 'quanly_ha');
    await loginAs(second, 'bacsi_duc');
    await expect(second.staff.stock.list()).rejects.toThrow(ForbiddenError);
    const u = row(t.db, 'bacsi_duc');
    await t.api.staff.team.update(u.id, u.version, { display_name: u.display_name, title: u.title, preset_ids: ['bac_si'], extra_capabilities: ['stock.view'] });
    await expect(second.staff.stock.list()).resolves.toHaveLength(13);
    const again = row(t.db, 'bacsi_duc');
    await t.api.staff.team.setActive(again.id, again.version, false);
    await expect(second.staff.stock.list()).rejects.toThrow(ForbiddenError);
  });
});
describe('permissions', () => {
  const calls = (api: Api, id: string, v: number) => [
    () => api.staff.team.list(),
    () => api.staff.team.create({ username: 'ai_do', password: 'matkhau-moi-1', display_name: 'A', title: 'B', preset_ids: ['spa'], extra_capabilities: [] }),
    () => api.staff.team.update(id, v, { display_name: 'A', title: 'B', preset_ids: ['spa'], extra_capabilities: [] }),
    () => api.staff.team.setActive(id, v, false),
    () => api.staff.team.resetPassword(id, v, { password: 'matkhau-moi-1' }),
  ];
  it.each(['bacsi_duc', 'bacsi_mai', 'spa_ngocanh', 'lan_nguyen'])('%s is refused every team function and nothing changes', async (who) => {
    const { api, db } = makeTestApi();
    await loginAs(api, who);
    const u = row(db, 'spa_ngocanh');
    const rev = db.read().rev;
    for (const call of calls(api, u.id, u.version)) await expect(call()).rejects.toThrow(ForbiddenError);
    expect(db.read().rev).toBe(rev);
  });
  it('a signed-out visitor is refused every team function', async () => {
    const { api, db } = makeTestApi();
    const u = row(db, 'spa_ngocanh');
    for (const call of calls(api, u.id, u.version)) await expect(call()).rejects.toThrow(ForbiddenError);
  });
});
```
(Nhập: `makeTestApi`, `loginAs`, `TEST_NOW` từ `../../testing`; `createMockApi` từ `..` (`api/index`); `createKV`, `memoryStorage` từ `../../store/kv`; `ConflictError`, `ForbiddenError`, `AuthError`, `ValidationError` từ `contracts/errors`; `STAFF_MSG`, `MSG`; `type Api = ReturnType<typeof makeTestApi>['api']`.)

- [ ] **Step 2: Run to verify fail** — `npx vitest run src/data/mock/api/staff/team.test.ts` → FAIL (`api.staff.team` không có).
- [ ] **Step 3: Implement** `staffTeamApi` theo "Quyết định thực thi"; nối vào `api/index.ts`.
- [ ] **Step 4: Run to verify pass** — `npm test && npm run typecheck && npx eslint src/data` → PASS. Kiểm độ "cắn": tạm bỏ kiểm "còn Quản lý" ở `setActive` → test "last active manager" đỏ; tạm bỏ kiểm lại tên đăng nhập trong `transact` → test hai lần tạo cùng lúc đỏ; trả lại.
- [ ] **Step 5: Commit** — `feat: staff.team (create, update, switch on/off, reset password) with last-manager and self-lockout guards`.

---

### Task 4: `staff.profile` và `staff.settings.hospital`

**Files:**
- Modify: `src/data/mock/api/staff/common.ts` (thêm `anyStaff`), `src/data/mock/api/index.ts`
- Create: `src/data/mock/api/staff/profile.ts`, `profile.test.ts`

**Interfaces:**
- Consumes: Task 1–2; `currentActor` (`../../guard`).
- Produces: `export function anyStaff(env: Env): StaffActor` (người đang đăng nhập là nhân viên đang dùng, không đòi quyền cụ thể; khách/khách vãng lai → `ForbiddenError`); `staffProfileApi(env): StaffProfileApi`; `staffSettingsApi(env): StaffSettingsApi`; nối `staff.profile`, `staff.settings`.

Quyết định thực thi: chủ thể luôn lấy từ phiên (không nhận id). `get` trả `{ username, name, title, presets, caps }` (`caps` = `[...a.caps]` theo thứ tự `CAPS`). `updateName(name)`: `validateNameChange` → `ValidationError({ name })`; ghi `display_name = name.trim()`, `version += 1`; nhật ký `staff.rename` (không nhạy cảm). `changePassword`: băm mật khẩu hiện tại bằng muối đã lưu để biết `currentOk`; `validatePasswordChange`; băm mật khẩu mới ngoài `transact`; trong `transact` đọc lại người dùng, nếu `password_hash` không còn bằng giá trị đã xác thực thì `ValidationError({ current: STAFF_MSG.currentWrong })`; ghi muối + băm mới, `version += 1`; nhật ký `staff.password_change` `sensitive: true`. Phiên giữ nguyên. `settings.hospital()` trả bản sao `HOSPITAL_INFO`.

- [ ] **Step 1: Write the failing tests** (`profile.test.ts`)
```ts
it.each(['quanly_ha', 'bacsi_duc', 'spa_ngocanh'])('%s reads their own profile, equal to what me() says', async (who) => {
  const { api } = makeTestApi();
  await loginAs(api, who);
  const p = await api.staff.profile.get();
  const me = (await api.auth.me()) as { username: string; name: string; title: string; caps: string[]; presets: string[] };
  expect(p).toEqual({ username: me.username, name: me.name, title: me.title, presets: me.presets, caps: me.caps });
});
describe('updateName', () => {
  it('trims, saves, shows everywhere the name is read, bumps the version, and old audit lines keep the old name', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const v = db.read().t.staff_users.find((u) => u.username === 'bacsi_duc')!.version;
    await api.staff.profile.updateName('  BS. Đức Minh  ');
    expect((await api.staff.profile.get()).name).toBe('BS. Đức Minh');
    expect(db.read().t.staff_users.find((u) => u.username === 'bacsi_duc')!.version).toBe(v + 1);
    expect(db.read().t.audit_events.at(-1)).toMatchObject({ action: 'staff.rename', sensitive: false });
    expect(db.read().t.audit_events.filter((e) => e.actor_id === 'stf-duc').some((e) => e.actor_name_snapshot === 'BS. Trần Minh Đức')).toBe(true);
  });
  it('refuses blank and over-long names and writes nothing', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'bacsi_duc');
    const rev = db.read().rev;
    expect(await fieldsOf(api.staff.profile.updateName(' '))).toEqual({ name: STAFF_MSG.name });
    expect(await fieldsOf(api.staff.profile.updateName('x'.repeat(61)))).toEqual({ name: STAFF_MSG.nameLong });
    expect(db.read().rev).toBe(rev);
  });
});
describe('changePassword', () => {
  const good = { current: 'leson-demo', next: 'mat-khau-moi-7', next2: 'mat-khau-moi-7' };
  it('each mistake is reported on its own field and nothing changes', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    const rev = db.read().rev;
    expect(await fieldsOf(api.staff.profile.changePassword({ ...good, current: 'sai-mat-khau' }))).toEqual({ current: STAFF_MSG.currentWrong });
    expect(await fieldsOf(api.staff.profile.changePassword({ ...good, next: 'abc', next2: 'abc' }))).toEqual({ next: MSG.passwordShort });
    expect(await fieldsOf(api.staff.profile.changePassword({ current: 'leson-demo', next: 'leson-demo', next2: 'leson-demo' }))).toEqual({ next: STAFF_MSG.samePassword });
    expect(await fieldsOf(api.staff.profile.changePassword({ ...good, next2: 'khac-hoan-toan' }))).toEqual({ next2: MSG.passwordMismatch });
    expect(db.read().rev).toBe(rev);
  });
  it('success: the session stays, the old password stops working, the new works, audit is sensitive without any password', async () => {
    const { api, db } = makeTestApi();
    await loginAs(api, 'spa_ngocanh');
    await api.staff.profile.changePassword(good);
    expect(((await api.auth.me()) as { username: string }).username).toBe('spa_ngocanh');
    const audit = db.read().t.audit_events.at(-1)!;
    expect(audit).toMatchObject({ action: 'staff.password_change', sensitive: true });
    expect(JSON.stringify(audit)).not.toMatch(/leson-demo|mat-khau-moi-7/);
    await api.auth.logout();
    await expect(api.auth.login({ identifier: 'spa_ngocanh', password: 'leson-demo' })).rejects.toThrow(AuthError);
    await expect(api.auth.login({ identifier: 'spa_ngocanh', password: 'mat-khau-moi-7' })).resolves.toBeTruthy();
  });
  it('a password or name change makes the version the manager screen holds stale', async () => {
    const t = makeTestApi();
    const second = createMockApi({ db: t.db, sessionKV: createKV(memoryStorage()), rememberKV: createKV(memoryStorage()), clock: () => new Date(TEST_NOW) });
    await loginAs(t.api, 'quanly_ha');
    const u = t.db.read().t.staff_users.find((x) => x.username === 'spa_ngocanh')!;
    await loginAs(second, 'spa_ngocanh');
    await second.staff.profile.updateName('Ngọc Anh Spa');
    await expect(t.api.staff.team.setActive(u.id, u.version, false)).rejects.toThrow(ConflictError);
  });
});
describe('hospital information', () => {
  it.each(['quanly_ha', 'bacsi_duc', 'spa_ngocanh'])('%s can read it, equal to the fixed constant', async (who) => {
    const { api } = makeTestApi();
    await loginAs(api, who);
    expect(await api.staff.settings.hospital()).toEqual(HOSPITAL_INFO);
  });
});
describe('who may call profile and hospital', () => {
  it.each(['lan_nguyen'])('%s (a customer) is refused', async (who) => {
    const { api } = makeTestApi();
    await loginAs(api, who);
    await expect(api.staff.profile.get()).rejects.toThrow(ForbiddenError);
    await expect(api.staff.profile.updateName('X')).rejects.toThrow(ForbiddenError);
    await expect(api.staff.profile.changePassword({ current: 'a', next: 'b', next2: 'b' })).rejects.toThrow(ForbiddenError);
    await expect(api.staff.settings.hospital()).rejects.toThrow(ForbiddenError);
  });
  it('a signed-out visitor is refused, and a staff member switched off mid-session is too', async () => {
    const t = makeTestApi();
    await expect(t.api.staff.profile.get()).rejects.toThrow(ForbiddenError);
    await loginAs(t.api, 'bacsi_duc');
    t.db.transact('t', (d) => { d.t.staff_users.find((u) => u.username === 'bacsi_duc')!.active = false; });
    await expect(t.api.staff.profile.get()).rejects.toThrow(ForbiddenError);
    await expect(t.api.staff.settings.hospital()).rejects.toThrow(ForbiddenError);
  });
});
```
(Nhập như Task 3; `HOSPITAL_INFO` từ `rules/hospital`; `fieldsOf` như ở các test trước.)

- [ ] **Step 2: Run to verify fail** — `npx vitest run src/data/mock/api/staff/profile.test.ts` → FAIL (`api.staff.profile` không có).
- [ ] **Step 3: Implement** theo "Quyết định thực thi".
- [ ] **Step 4: Run to verify pass** — `npm test && npm run typecheck && npx eslint src/data` → PASS. Kiểm độ "cắn": tạm bỏ kiểm lại `password_hash` trong `transact` của `changePassword` hoặc tạm không tăng `version` khi đổi tên → test "version stale" đỏ; trả lại.
- [ ] **Step 5: Commit** — `feat: staff.profile (rename, change password) and read-only hospital information`.

---

### Task 5: Tài liệu, kiểm tra toàn bộ, rà soát độc lập, gộp

**Files:** `PROGRESS.md`; có thể `scripts/check-budgets.mjs` nếu ngân sách vượt (nâng có ghi lý do).

- [ ] **Step 1: Cập nhật tài liệu.** `PROGRESS.md`: "Đã xong" thêm **Phần 5 · giai đoạn 3 — Cài đặt A** (hàm `staff.team`, `staff.profile`, `staff.settings.hospital`; quyền `staff.manage` chỉ Quản lý; hai luật chặn; mật khẩu không lộ và nhật ký nhạy cảm; hiệu lực ngay với phiên đang mở; `StaffUser.version`; nhân viên tạo thêm biến mất khi khôi phục dữ liệu mẫu); "Việc tiếp theo" sang giai đoạn 4 (Tùy chọn cá nhân); "Thay đổi hợp đồng": các kiểu `StaffAdminRow`, `StaffAccountInput`, `StaffCreateInput`, `StaffTeamApi`, `StaffProfile`, `StaffProfileApi`, `HospitalInfo`, `StaffSettingsApi`; `Cap` `staff.manage`; khóa lỗi (`username`, `password`, `display_name`, `title`, `preset_ids`, `extra_capabilities`, `active`, `current`, `next`, `next2`, `name`); "Yêu cầu gửi nhánh kia": màn Cài đặt (menu hiện theo `can('staff.manage')` cho mục nhân viên; hồ sơ và thông tin bệnh viện cho mọi nhân viên); gửi `version`; thông tin bệnh viện nên dùng `staff.settings.hospital()` thay chữ rải rác; "Quyền của tôi" của Quản lý dài thêm 1 mục (tổng thêm 4 từ phần 5).
- [ ] **Step 2: Chạy toàn bộ** — `npm run verify` (nền, log vào scratchpad). Expected: exit 0; ngoại lệ đã biết: vài bài e2e đỏ vì giờ hoặc chập chờn (ghi rõ bài nào, chạy riêng để xác nhận).
- [ ] **Step 3: Rà soát độc lập** bằng agent mới (đọc `git diff` so với nhánh tích hợp, spec, kế hoạch, Review Focus); sửa mọi lỗi quan trọng test-first, mỗi lỗi một commit; lỗi nhỏ ghi sổ.
- [ ] **Step 4: Commit, đẩy, gộp.** Như các giai đoạn trước: `git push -u origin claude/du-lieu`; ở thư mục gốc `git fetch origin && git merge --ff-only origin/claude/focused-pascal-rfxnnp`, `git merge --no-ff claude/du-lieu`, `git push origin claude/focused-pascal-rfxnnp`. Nếu nhánh tích hợp trên máy chủ đã đi tiếp, gộp nó vào `claude/du-lieu` trước, chạy lại test đơn vị và kiểm tra kiểu (không `force-push`).

---

## Self-Review

- **Độ phủ spec §3.3.A:** `team.list/create/update/setActive/resetPassword` (T3) · hai luật chặn (T3) · hiệu lực ngay (T3) · `version` (T1) · `profile.get/updateName/changePassword` (T4) · thông tin bệnh viện nguyên văn, không giờ làm việc thường (T2, T4) · nhân viên mới `is_sample` và biến mất khi khôi phục (hành vi sẵn có, ghi ở T5) · không xóa hẳn (không có hàm xóa).
- **Quyết định kế hoạch thay spec:** `team.get` bỏ (spec §3.3.A liệt kê không có); khóa lỗi của `updateName` là `name`; khóa của `setActive` là `active`; tắt người Quản lý cuối bị chặn cả khi người thao tác là người có `staff.manage` lẻ.
- **Nhất quán kiểu:** `StaffAccountInput`/`StaffCreateInput`/`StaffAdminRow` (T2) dùng ở T3; `StaffProfile`, `HospitalInfo` (T2) dùng ở T4; `anyStaff` (T4) chỉ dùng ở `profile.ts`.
- **Mật khẩu:** băm bằng `hashPassword`/`newSalt` (có sẵn); kiểm tra bằng `validatePassword` (có sẵn). Không đổi `auth.ts`.
