import type { PaymentMethod } from '@/data/contracts/enums';
import { PRESETS, PRESET_LABEL, STOCK_WRITE_CAPS, CAPS, type Cap, type PresetId } from '@/data/rules/capabilities';
import type { AppSettingsPatch, AppSettingsValues, HolidayInput } from '@/data/staff';
import { parseWhole } from './settingsForm';

export type CapGroup = { key: string; label: string; caps: Cap[] };

/** The rights by work area, as the manager thinks of them; every right sits in exactly one group. */
export const CAP_GROUPS: CapGroup[] = [
  { key: 'lich', label: 'Yêu cầu và lịch', caps: ['requests.handle', 'appointments.view', 'appointments.manage'] },
  { key: 'khach', label: 'Khách hàng', caps: ['customers.view', 'customers.edit', 'accounts.link'] },
  { key: 'noitru', label: 'Nội trú', caps: ['inpatient.view', 'inpatient.admit', 'inpatient.clinical', 'inpatient.diary_write', 'inpatient.share'] },
  { key: 'hoadon', label: 'Hóa đơn và giá', caps: ['invoices.create', 'payments.record', 'invoices.void', 'pricelist.edit'] },
  { key: 'kho', label: 'Kho', caps: ['stock.view', 'stock.receive', 'stock.issue', 'stock.adjust', 'stock.items', 'stock.manage'] },
  { key: 'baocao', label: 'Báo cáo và cài đặt', caps: ['reports.revenue', 'reports.operations', 'staff.manage', 'settings.manage', 'support.inbox'] },
];

/** The old umbrella right is shown only to someone who still holds it, so nobody hands it out by accident. */
export function groupsFor(held: ReadonlySet<Cap>): CapGroup[] {
  return CAP_GROUPS.map((g) => ({ ...g, caps: g.caps.filter((c) => c !== 'stock.manage' || held.has(c)) }));
}

export function inheritedCaps(presets: readonly PresetId[]): ReadonlySet<Cap> {
  return new Set(presets.flatMap((p) => PRESETS[p]));
}

/** What a person has beyond their roles, in the fixed order of `CAPS`. */
export function extraOf(selected: ReadonlySet<Cap>, presets: readonly PresetId[]): Cap[] {
  const base = inheritedCaps(presets);
  return CAPS.filter((c) => selected.has(c) && !base.has(c));
}

export const rolesText = (presets: readonly PresetId[]): string => presets.map((p) => PRESET_LABEL[p]).join(', ');
export const extraText = (n: number): string => (n === 0 ? 'Không có' : `${n} quyền thêm`);

/** Writing the stock is useless without seeing it, so say so before the manager saves. */
export function viewNote(selected: ReadonlySet<Cap>, presets: readonly PresetId[]): string | undefined {
  const writes = selected.has('stock.manage') || STOCK_WRITE_CAPS.some((c) => selected.has(c));
  const sees = selected.has('stock.view') || inheritedCaps(presets).has('stock.view');
  return writes && !sees ? 'Quyền ghi Kho cần thêm Xem kho.' : undefined;
}

export type SystemDraft = {
  calendar_start: string; calendar_end: string; default_duration_kham: string; default_duration_spa: string; stock_expiry_days: string;
  stock_default_min: string; request_overdue_hours: string; payment_methods: PaymentMethod[]; holidays: { date: string; note: string }[];
};

export const draftOf = (v: AppSettingsValues): SystemDraft => ({
  calendar_start: v.calendar_start, calendar_end: v.calendar_end, default_duration_kham: String(v.default_duration_kham),
  default_duration_spa: String(v.default_duration_spa), stock_expiry_days: String(v.stock_expiry_days), stock_default_min: String(v.stock_default_min),
  request_overdue_hours: String(v.request_overdue_hours), payment_methods: [...v.payment_methods], holidays: v.holidays.map((h) => ({ ...h })),
});

const NUMBER_KEYS = ['default_duration_kham', 'default_duration_spa', 'stock_expiry_days', 'stock_default_min', 'request_overdue_hours'] as const;
const TIME_KEYS = ['calendar_start', 'calendar_end'] as const;

const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x));
const holidayInputs = (list: { date: string; note: string }[]): HolidayInput[] =>
  list.map((h) => (h.note.trim() ? { date: h.date, note: h.note.trim() } : { date: h.date }));

/** Only what the person changed. An unreadable number goes as NaN so the rules answer with the sentence for that field. */
export function patchOf(v: AppSettingsValues, d: SystemDraft): AppSettingsPatch {
  const patch: AppSettingsPatch = {};
  for (const k of TIME_KEYS) if (d[k] !== v[k]) patch[k] = d[k];
  for (const k of NUMBER_KEYS) {
    const n = parseWhole(d[k]) ?? Number.NaN;
    if (n !== v[k]) patch[k] = n;
  }
  if (!sameSet(d.payment_methods, v.payment_methods)) patch.payment_methods = d.payment_methods;
  const key = (list: { date: string; note: string }[]) => JSON.stringify(holidayInputs(list));
  if (key(d.holidays) !== key(v.holidays)) patch.holidays = holidayInputs(d.holidays);
  return patch;
}

export const sortHolidays = <T extends { date: string }>(list: T[]): T[] => [...list].sort((a, b) => a.date.localeCompare(b.date));
