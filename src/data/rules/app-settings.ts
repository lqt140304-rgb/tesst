import { APP_SETTING_KEYS, PAYMENT_METHODS, PAYMENT_METHOD_LABEL, type AppSettingKey, type PaymentMethod } from '../contracts/enums';
import type { AppSettingsPatch, AppSettingsValues, ClosedDay, ClosedDayInput, FixedRule } from '../contracts/staff';
import { inYears, isRealDate } from './calendar';
import { VIDEO_MAX_BYTES, VIDEO_MAX_SECONDS } from './video-upload';

/** Demo defaults, not hospital figures, except the calendar: it follows the hospital's working hours, 08:00–21:00 (owner, 22/10/2026). */
export const DEFAULT_SETTINGS: AppSettingsValues = {
  stock_expiry_days: 30, stock_default_min: 5, default_duration_kham: 30, default_duration_spa: 60,
  calendar_start: '08:00', calendar_end: '21:00', payment_methods: [...PAYMENT_METHODS], request_overdue_hours: 24, closed_days: [],
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
  closed_days: 'Danh sách ngày nghỉ cần là danh sách tối đa 120 ngày.',
  closed_row: 'Mỗi ngày nghỉ gồm ngày và ghi chú.',
  closed_date: 'Ngày nghỉ cần là ngày có thật, dạng năm-tháng-ngày, trong các năm 2000–2100.',
  closed_note: 'Ghi chú tối đa 60 ký tự.',
  closed_twice: 'Ngày này đã có trong danh sách.',
} as const;

export const CLOSED_DAYS_MAX = 120;
export const CLOSED_NOTE_MAX = 60;

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
  if (has('closed_days')) {
    const list = patch.closed_days;
    if (!Array.isArray(list) || list.length > CLOSED_DAYS_MAX) errors.set('closed_days', SETTINGS_MSG.closed_days);
    else {
      const seen = new Set<string>();
      Array.from(list).forEach((row, i) => {
        const key = `closed_days.${i}`;
        if (!isObject(row) || Object.keys(row).some((k) => k !== 'date' && k !== 'note')) return void errors.set(key, SETTINGS_MSG.closed_row);
        const date = Object.hasOwn(row, 'date') ? row.date : undefined;
        if (typeof date !== 'string' || !isRealDate(date) || !inYears(date)) return void errors.set(key, SETTINGS_MSG.closed_date);
        const note = Object.hasOwn(row, 'note') ? row.note : undefined;
        if (note !== undefined && (typeof note !== 'string' || note.trim().length > CLOSED_NOTE_MAX)) return void errors.set(key, SETTINGS_MSG.closed_note);
        if (seen.has(date)) errors.set(key, SETTINGS_MSG.closed_twice);
        seen.add(date);
      });
    }
  }
  for (const k of Object.keys(patch)) if (!APP_SETTING_KEYS.includes(k as AppSettingKey)) errors.set(k, SETTINGS_MSG.unknown);
  return Object.fromEntries(errors);
}

/** Only the keys a patch names and the settings know; methods without repeats and in the fixed order. Call after `validateSettingsPatch`. */
export function applySettingsPatch(current: AppSettingsValues, patch: AppSettingsPatch): AppSettingsValues {
  const next: Record<string, unknown> = { ...current, payment_methods: [...current.payment_methods] };
  for (const k of APP_SETTING_KEYS) if (Object.hasOwn(patch, k) && patch[k] !== undefined) next[k] = patch[k];
  next.payment_methods = PAYMENT_METHODS.filter((m) => (next.payment_methods as PaymentMethod[]).includes(m));
  next.closed_days = normalizeClosedDays(next.closed_days as readonly ClosedDayInput[]);
  return next as AppSettingsValues;
}

/** Copies, notes trimmed and filled in, sorted by date. */
export const normalizeClosedDays = (days: readonly ClosedDayInput[]): ClosedDay[] =>
  days.map((d) => ({ date: d.date, note: (d.note ?? '').trim() })).sort((a, b) => a.date.localeCompare(b.date));

export const findClosedDay = (days: readonly ClosedDay[], date: string): ClosedDay | undefined => days.find((d) => d.date === date);

export function changedSettings(before: AppSettingsValues, after: AppSettingsValues): AppSettingKey[] {
  return APP_SETTING_KEYS.filter((k) => (k === 'payment_methods'
    ? PAYMENT_METHODS.some((m) => before.payment_methods.includes(m) !== after.payment_methods.includes(m))
    : k === 'closed_days'
      ? JSON.stringify(normalizeClosedDays(before.closed_days)) !== JSON.stringify(normalizeClosedDays(after.closed_days))
      : before[k] !== after[k]));
}

export function describeSetting(key: AppSettingKey, v: AppSettingsValues): string {
  switch (key) {
    case 'stock_expiry_days': return `${v.stock_expiry_days} ngày`;
    case 'default_duration_kham': return `${v.default_duration_kham} phút`;
    case 'default_duration_spa': return `${v.default_duration_spa} phút`;
    case 'request_overdue_hours': return `${v.request_overdue_hours} giờ`;
    case 'payment_methods': return PAYMENT_METHODS.filter((m) => v.payment_methods.includes(m)).map((m) => PAYMENT_METHOD_LABEL[m]).join(', ');
    case 'closed_days': {
      const days = normalizeClosedDays(v.closed_days);
      if (days.length === 0) return 'Chưa có ngày nghỉ';
      const shown = days.slice(0, 3).map((d) => `${d.date.slice(8)}/${d.date.slice(5, 7)}/${d.date.slice(0, 4)}`).join(', ');
      return `${days.length} ngày nghỉ: ${shown}${days.length > 3 ? ` và ${days.length - 3} ngày khác` : ''}`;
    }
    default: return String(v[key]);
  }
}

/** More than `hours` since it was made (exactly `hours` is not yet late); a time after `now` is never late. */
export const isOverdue = (createdAtIso: string, now: Date, hours: number): boolean => now.getTime() - Date.parse(createdAtIso) > hours * 3_600_000;
