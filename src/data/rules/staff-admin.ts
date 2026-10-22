import type { StaffAccountInput, StaffCreateInput } from '../contracts/staff';
import { CAPS, PRESETS, effectiveCaps, type Cap, type PresetId } from './capabilities';
import { MSG, validatePassword, validateUsername } from './validation';

export const STAFF_MSG = {
  name: 'Vui lòng nhập tên hiển thị.',
  nameLong: 'Tên hiển thị tối đa 60 ký tự.',
  title: 'Vui lòng nhập chức danh.',
  titleLong: 'Chức danh tối đa 40 ký tự.',
  presets: 'Vui lòng chọn ít nhất một vai.',
  presetUnknown: 'Vai không hợp lệ.',
  capUnknown: 'Có quyền không hợp lệ.',
  selfOff: 'Bạn không tắt được tài khoản của chính mình.',
  lastManager: 'Phải còn ít nhất một Quản lý đang dùng.',
  selfPassword: 'Bạn đổi mật khẩu của mình ở Hồ sơ cá nhân.',
  currentWrong: 'Mật khẩu hiện tại chưa đúng.',
  samePassword: 'Mật khẩu mới cần khác mật khẩu hiện tại.',
  beyondYou: 'Bạn chỉ cấp được những quyền bạn đang có.',
  managerOnly: 'Chỉ Quản lý mới thay đổi tài khoản của Quản lý.',
} as const;

type Errors = Record<string, string>;

export function validateNameChange(name: string): string | null {
  const n = name.trim();
  if (!n) return STAFF_MSG.name;
  return n.length > 60 ? STAFF_MSG.nameLong : null;
}

export function validateStaffInput(input: StaffAccountInput): Errors {
  const e: Errors = {};
  const nameErr = validateNameChange(input.display_name);
  if (nameErr) e.display_name = nameErr;
  const title = input.title.trim();
  if (!title) e.title = STAFF_MSG.title;
  else if (title.length > 40) e.title = STAFF_MSG.titleLong;
  if (!input.preset_ids.length) e.preset_ids = STAFF_MSG.presets;
  else if (input.preset_ids.some((p) => !Object.hasOwn(PRESETS, p))) e.preset_ids = STAFF_MSG.presetUnknown;
  if (input.extra_capabilities.some((c) => !(CAPS as readonly string[]).includes(c))) e.extra_capabilities = STAFF_MSG.capUnknown;
  return e;
}

export function validateNewStaff(input: StaffCreateInput): Errors {
  const e = validateStaffInput(input);
  const userErr = validateUsername(input.username.trim());
  if (userErr) e.username = userErr;
  const pwErr = validatePassword(input.password);
  if (pwErr) e.password = pwErr;
  return e;
}

/** What the roles already give is not stored as an extra; duplicates go; the order is the capability list's. */
export function normalizeExtraCaps(presets: readonly PresetId[], extras: readonly Cap[]): Cap[] {
  const given = new Set(presets.flatMap((p) => PRESETS[p]));
  return CAPS.filter((c) => extras.includes(c) && !given.has(c));
}

export const hasActiveManager = (users: readonly { active: boolean; preset_ids: readonly PresetId[] }[]) => users.some((u) => u.active && u.preset_ids.includes('quan_ly'));

export function validatePasswordChange(i: { current: string; next: string; next2: string }, currentOk: boolean): Errors {
  const e: Errors = {};
  if (!currentOk) e.current = STAFF_MSG.currentWrong;
  const pwErr = validatePassword(i.next);
  if (pwErr) e.next = pwErr;
  else if (currentOk && i.next === i.current) e.next = STAFF_MSG.samePassword;
  if (i.next !== i.next2) e.next2 = MSG.passwordMismatch;
  return e;
}

type Grant = { presets: readonly PresetId[]; extras: readonly Cap[] };

/**
 * The capabilities a change would newly give the person must all be ones the caller holds: staff.manage on its own is not the
 * manager role. Returns the field to blame, or null when the change is within the caller's reach (removing is always fine).
 */
export function grantExceeds(callerCaps: ReadonlySet<Cap>, before: Grant, after: Grant): 'preset_ids' | 'extra_capabilities' | null {
  const had = effectiveCaps({ preset_ids: [...before.presets], extra_capabilities: [...before.extras] });
  const lacks = (g: Grant) => [...effectiveCaps({ preset_ids: [...g.presets], extra_capabilities: [...g.extras] })].some((c) => !had.has(c) && !callerCaps.has(c));
  if (lacks({ presets: after.presets, extras: [] })) return 'preset_ids';
  return lacks(after) ? 'extra_capabilities' : null;
}
