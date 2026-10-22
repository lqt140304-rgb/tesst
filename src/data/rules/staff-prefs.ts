import {
  CALENDAR_VIEWS, DENSITIES, LANDING_PAGES, MOTION_PREFS, NUDGE_KEYS, PAGE_SIZES, REPORT_RANGES, TEXT_SIZES,
  type LandingPage, type NudgeKey,
} from '../contracts/enums';
import type { StaffPrefs, StaffPrefsPatch } from '../contracts/staff';
import type { Cap } from './capabilities';

/** Landing pages that need a right; "invoices" opens for whoever can make or take payment on one. */
export const LANDING_NEEDS: Record<LandingPage, readonly Cap[]> = {
  home: [], appointments: ['appointments.view'], inpatient: ['inpatient.view'], invoices: ['invoices.create', 'payments.record'],
};
export const NUDGE_NEEDS: Record<NudgeKey, readonly Cap[]> = {
  requests: ['requests.handle'], reschedules: ['requests.handle'], stock: ['stock.view'], drafts: ['invoices.create'],
};

export const PREFS_MSG = {
  unknown: 'Tùy chọn này không có.',
  shape: 'Tùy chọn gửi lên chưa đúng.',
  text_size: 'Cỡ chữ chỉ chọn Vừa hoặc Lớn.',
  density: 'Độ dày bảng chỉ chọn Thoáng hoặc Gọn.',
  motion: 'Chuyển động chỉ chọn Theo máy hoặc Luôn giảm.',
  landing: 'Trang vào sau đăng nhập chưa đúng.',
  landingNoAccess: 'Bạn chưa có quyền vào trang này.',
  appointments_view: 'Kiểu xem lịch chỉ chọn Tuần hoặc Ngày.',
  page_size: 'Số dòng mỗi trang chỉ chọn 10, 20 hoặc 50.',
  report_range: 'Khoảng ngày mặc định chỉ chọn 7 ngày qua, 30 ngày qua hoặc Tháng này.',
  nudge: 'Nhắc việc chỉ nhận bật hoặc tắt.',
  nudgeNoAccess: 'Bạn chưa có quyền nhận loại nhắc này.',
  onboarding_done: 'Danh sách việc đã làm chưa đúng.',
  onboarding_hidden: 'Ẩn danh sách chỉ nhận có hoặc không.',
} as const;

const DONE_KEY = /^[a-z0-9_.-]{1,40}$/;
const DONE_MAX = 50;

const any = (caps: ReadonlySet<Cap>, needs: readonly Cap[]) => needs.length === 0 || needs.some((c) => caps.has(c));
export const canLand = (caps: ReadonlySet<Cap>, page: LandingPage) => any(caps, LANDING_NEEDS[page]);
export const canNudge = (caps: ReadonlySet<Cap>, key: NudgeKey) => any(caps, NUDGE_NEEDS[key]);

export function defaultPrefs(caps: ReadonlySet<Cap>): StaffPrefs {
  return {
    text_size: 'md', density: 'comfortable', motion: 'system', landing: 'home', appointments_view: 'week', page_size: 20, report_range: '7d',
    nudges: Object.fromEntries(NUDGE_KEYS.map((k) => [k, canNudge(caps, k)])) as StaffPrefs['nudges'],
    onboarding_done: [], onboarding_hidden: false,
  };
}

/** What was stored is kept as is; only the reading falls back, so a restored right brings the choice back. */
export function resolvePrefs(stored: StaffPrefsPatch | undefined, caps: ReadonlySet<Cap>): StaffPrefs {
  const base = defaultPrefs(caps);
  const s = stored ?? {};
  const out: StaffPrefs = { ...base, ...s, nudges: { ...base.nudges, ...s.nudges }, onboarding_done: [...(s.onboarding_done ?? base.onboarding_done)] };
  if (!canLand(caps, out.landing)) out.landing = 'home';
  for (const k of NUDGE_KEYS) if (!canNudge(caps, k)) out.nudges[k] = false;
  return out;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const oneOf = (list: readonly unknown[], v: unknown) => list.includes(v);

export function validatePrefsPatch(patch: unknown, caps: ReadonlySet<Cap>): Record<string, string> {
  if (!isObject(patch)) return { prefs: PREFS_MSG.shape };
  const errors: Record<string, string> = {};
  const has = (k: string) => Object.hasOwn(patch, k);
  const choice = (key: 'text_size' | 'density' | 'motion' | 'appointments_view' | 'report_range', list: readonly unknown[]) => {
    if (has(key) && !oneOf(list, patch[key])) errors[key] = PREFS_MSG[key];
  };
  choice('text_size', TEXT_SIZES);
  choice('density', DENSITIES);
  choice('motion', MOTION_PREFS);
  choice('appointments_view', CALENDAR_VIEWS);
  choice('report_range', REPORT_RANGES);
  if (has('page_size') && !oneOf(PAGE_SIZES, patch.page_size)) errors.page_size = PREFS_MSG.page_size;
  if (has('landing')) {
    if (!oneOf(LANDING_PAGES, patch.landing)) errors.landing = PREFS_MSG.landing;
    else if (!canLand(caps, patch.landing as LandingPage)) errors.landing = PREFS_MSG.landingNoAccess;
  }
  if (has('nudges')) {
    const n = patch.nudges;
    if (!isObject(n)) errors.nudges = PREFS_MSG.shape;
    else {
      for (const k of Object.keys(n)) {
        if (!oneOf(NUDGE_KEYS, k)) errors[`nudges.${k}`] = PREFS_MSG.unknown;
        else if (typeof n[k] !== 'boolean') errors[`nudges.${k}`] = PREFS_MSG.nudge;
        else if (n[k] && !canNudge(caps, k as NudgeKey)) errors[`nudges.${k}`] = PREFS_MSG.nudgeNoAccess;
      }
    }
  }
  if (has('onboarding_done')) {
    const d = patch.onboarding_done;
    if (!Array.isArray(d) || d.length > DONE_MAX || !d.every((x) => typeof x === 'string' && DONE_KEY.test(x))) errors.onboarding_done = PREFS_MSG.onboarding_done;
  }
  if (has('onboarding_hidden') && typeof patch.onboarding_hidden !== 'boolean') errors.onboarding_hidden = PREFS_MSG.onboarding_hidden;
  const known = new Set(['text_size', 'density', 'motion', 'landing', 'appointments_view', 'page_size', 'report_range', 'nudges', 'onboarding_done', 'onboarding_hidden']);
  for (const k of Object.keys(patch)) if (!known.has(k)) errors[k] = PREFS_MSG.unknown;
  return errors;
}

/** Only the keys the patch names are overwritten; nudges one by one; repeats leave the done-list. */
export function mergePatch(stored: StaffPrefsPatch, patch: StaffPrefsPatch): StaffPrefsPatch {
  const out: StaffPrefsPatch = { ...stored, ...patch };
  if (stored.nudges || patch.nudges) out.nudges = { ...stored.nudges, ...patch.nudges };
  if (out.onboarding_done) out.onboarding_done = [...new Set(out.onboarding_done)];
  return out;
}
