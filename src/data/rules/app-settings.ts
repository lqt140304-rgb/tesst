import { APP_SETTING_KEYS, PAYMENT_METHODS, PAYMENT_METHOD_LABEL, type AppSettingKey, type PaymentMethod } from '../contracts/enums';
import type { AppSettingsPatch, AppSettingsValues, FixedRule } from '../contracts/staff';
import { VIDEO_MAX_BYTES, VIDEO_MAX_SECONDS } from './video-upload';

/** Demo defaults, not hospital figures, except the calendar: it follows the hospital's working hours, 08:00–21:00 (owner, 22/10/2026). */
export const DEFAULT_SETTINGS: AppSettingsValues = {
  stock_expiry_days: 30, stock_default_min: 5, default_duration_kham: 30, default_duration_spa: 60,
  calendar_start: '08:00', calendar_end: '21:00', payment_methods: [...PAYMENT_METHODS], request_overdue_hours: 24,
};

/** Decided rules, shown read-only next to the settings. */
export const FIXED_RULES: FixedRule[] = [
  { label: 'Video nội trú', value: `Tối đa ${VIDEO_MAX_SECONDS} giây và ${VIDEO_MAX_BYTES / (1024 * 1024)} MB, tự xóa sau 60 ngày` },
  { label: 'Thanh toán', value: 'Thanh toán tại quầy, không thanh toán trực tuyến' },
];

export const SETTINGS_MSG = {
  unknown: 'Cài đặt này không có.',
  shape: 'Cài đặt gửi lên chưa đúng.',
  stock_expiry_days: 'Số ngày chỉ nhận số nguyên từ 1 đến 365.',
  stock_default_min: 'Ngưỡng chỉ nhận số nguyên từ 0 đến 1000.',
  duration: 'Thời lượng chỉ nhận từ 5 đến 240 phút, theo bước 5 phút.',
  time: 'Giờ cần đúng dạng HH:MM, ví dụ 07:00.',
  span: 'Lưới lịch cần dài ít nhất 4 giờ, giờ bắt đầu trước giờ kết thúc.',
  payment_methods: 'Cần chọn ít nhất một phương thức thanh toán có sẵn.',
  request_overdue_hours: 'Số giờ chỉ nhận số nguyên từ 1 đến 168.',
  methodOff: 'Phương thức này đang tắt.',
} as const;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown, lo: number, hi: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const isTime = (v: unknown): v is string => typeof v === 'string' && TIME.test(v);
const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
const isMethods = (v: unknown): v is PaymentMethod[] =>
  Array.isArray(v) && v.length > 0 && Array.from(v).every((m) => PAYMENT_METHODS.includes(m as PaymentMethod));

export function validateSettingsPatch(patch: unknown, current: AppSettingsValues): Record<string, string> {
  if (!isObject(patch)) return { settings: SETTINGS_MSG.shape };
  // A Map, not `{}`: assigning to `errors['__proto__']` on a plain object is silently dropped.
  const errors = new Map<string, string>();
  const has = (k: AppSettingKey) => Object.hasOwn(patch, k);
  if (has('stock_expiry_days') && !isInt(patch.stock_expiry_days, 1, 365)) errors.set('stock_expiry_days', SETTINGS_MSG.stock_expiry_days);
  if (has('stock_default_min') && !isInt(patch.stock_default_min, 0, 1000)) errors.set('stock_default_min', SETTINGS_MSG.stock_default_min);
  for (const k of ['default_duration_kham', 'default_duration_spa'] as const) {
    if (has(k) && !(isInt(patch[k], 5, 240) && patch[k] % 5 === 0)) errors.set(k, SETTINGS_MSG.duration);
  }
  if (has('request_overdue_hours') && !isInt(patch.request_overdue_hours, 1, 168)) errors.set('request_overdue_hours', SETTINGS_MSG.request_overdue_hours);
  if (has('payment_methods') && !isMethods(patch.payment_methods)) errors.set('payment_methods', SETTINGS_MSG.payment_methods);
  if (has('calendar_start') && !isTime(patch.calendar_start)) errors.set('calendar_start', SETTINGS_MSG.time);
  if (has('calendar_end') && !isTime(patch.calendar_end)) errors.set('calendar_end', SETTINGS_MSG.time);
  if (!errors.has('calendar_start') && !errors.has('calendar_end') && (has('calendar_start') || has('calendar_end'))) {
    const start = has('calendar_start') ? (patch.calendar_start as string) : current.calendar_start;
    const end = has('calendar_end') ? (patch.calendar_end as string) : current.calendar_end;
    // Checked on the merged hours, so changing one end alone cannot squeeze the grid below four hours.
    if (minutes(end) - minutes(start) < 240) errors.set(has('calendar_end') ? 'calendar_end' : 'calendar_start', SETTINGS_MSG.span);
  }
  for (const k of Object.keys(patch)) if (!APP_SETTING_KEYS.includes(k as AppSettingKey)) errors.set(k, SETTINGS_MSG.unknown);
  return Object.fromEntries(errors);
}

/** Only the keys a patch names and the settings know; methods without repeats and in the fixed order. Call after `validateSettingsPatch`. */
export function applySettingsPatch(current: AppSettingsValues, patch: AppSettingsPatch): AppSettingsValues {
  const next: Record<string, unknown> = { ...current, payment_methods: [...current.payment_methods] };
  for (const k of APP_SETTING_KEYS) if (Object.hasOwn(patch, k) && patch[k] !== undefined) next[k] = patch[k];
  next.payment_methods = PAYMENT_METHODS.filter((m) => (next.payment_methods as PaymentMethod[]).includes(m));
  return next as AppSettingsValues;
}

export function changedSettings(before: AppSettingsValues, after: AppSettingsValues): AppSettingKey[] {
  return APP_SETTING_KEYS.filter((k) => (k === 'payment_methods'
    ? PAYMENT_METHODS.some((m) => before.payment_methods.includes(m) !== after.payment_methods.includes(m))
    : before[k] !== after[k]));
}

export function describeSetting(key: AppSettingKey, v: AppSettingsValues): string {
  switch (key) {
    case 'stock_expiry_days': return `${v.stock_expiry_days} ngày`;
    case 'default_duration_kham': return `${v.default_duration_kham} phút`;
    case 'default_duration_spa': return `${v.default_duration_spa} phút`;
    case 'request_overdue_hours': return `${v.request_overdue_hours} giờ`;
    case 'payment_methods': return PAYMENT_METHODS.filter((m) => v.payment_methods.includes(m)).map((m) => PAYMENT_METHOD_LABEL[m]).join(', ');
    default: return String(v[key]);
  }
}

/** More than `hours` since it was made (exactly `hours` is not yet late); a time after `now` is never late. */
export const isOverdue = (createdAtIso: string, now: Date, hours: number): boolean => now.getTime() - Date.parse(createdAtIso) > hours * 3_600_000;
