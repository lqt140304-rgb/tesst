/** Vietnam has no DST, so every timestamp in the demo uses a fixed +07:00 offset. */
export const TZ = 'Asia/Ho_Chi_Minh';
const OFFSET = '+07:00';
const DAY_MS = 86_400_000;

const ymdFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const hmFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const toDate = (iso: string | Date) => (iso instanceof Date ? iso : new Date(iso));

/** YYYY-MM-DD of the given instant in Vietnam. */
export function todayVN(now: Date): string {
  return ymdFmt.format(now);
}

/** Calendar-day arithmetic on a YYYY-MM-DD string. */
export function addDays(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return new Date(d.getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

/** ISO timestamp in Vietnam time for `base` shifted by `offsetDays`, at `hhmm`. */
export function at(base: string, offsetDays: number, hhmm: string): string {
  return `${addDays(base, offsetDays)}T${hhmm}:00${OFFSET}`;
}

/** Date part (YYYY-MM-DD) of an instant, in Vietnam. */
export function dayOf(iso: string | Date): string {
  return ymdFmt.format(toDate(iso));
}

function weekdayOf(isoDate: string): string {
  return WEEKDAYS[new Date(`${isoDate}T00:00:00Z`).getUTCDay()]!;
}

/** "Thứ Hai, 19/10" */
export function formatDayVi(iso: string | Date): string {
  const d = dayOf(iso);
  return `${weekdayOf(d)}, ${d.slice(8, 10)}/${d.slice(5, 7)}`;
}

/** "Thứ Hai, 19/10/2026" */
export function formatLongDayVi(iso: string | Date): string {
  const d = dayOf(iso);
  return `${weekdayOf(d)}, ${formatDateVi(iso)}`;
}

/** "19/10/2026" */
export function formatDateVi(iso: string | Date): string {
  const d = dayOf(iso);
  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
}

/** "19/10" */
export function formatShortDateVi(iso: string | Date): string {
  const d = dayOf(iso);
  return `${d.slice(8, 10)}/${d.slice(5, 7)}`;
}

/** "08:10" */
export function formatTimeVi(iso: string | Date): string {
  return hmFmt.format(toDate(iso));
}

export function partOfDay(iso: string | Date): 'sang' | 'chieu' | 'toi' {
  const h = Number(formatTimeVi(iso).slice(0, 2));
  if (h >= 5 && h < 12) return 'sang';
  if (h >= 12 && h < 18) return 'chieu';
  return 'toi';
}

function dayDiff(iso: string | Date, now: Date): number {
  const a = new Date(`${dayOf(iso)}T00:00:00Z`).getTime();
  const b = new Date(`${todayVN(now)}T00:00:00Z`).getTime();
  return Math.round((a - b) / DAY_MS);
}

export function relativeDayVi(iso: string | Date, now: Date): 'Hôm nay' | 'Hôm qua' | 'Ngày mai' | null {
  const diff = dayDiff(iso, now);
  if (diff === 0) return 'Hôm nay';
  if (diff === -1) return 'Hôm qua';
  if (diff === 1) return 'Ngày mai';
  return null;
}

/** "12 phút trước", "2 giờ trước", "Hôm qua", or the short date. */
export function minutesAgoVi(iso: string | Date, now: Date): string {
  const mins = Math.floor((now.getTime() - toDate(iso).getTime()) / 60_000);
  const diff = dayDiff(iso, now);
  if (diff === 0) {
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    return `${Math.floor(mins / 60)} giờ trước`;
  }
  if (diff === -1) return 'Hôm qua';
  return formatShortDateVi(iso);
}

/** Whole days between two instants (b − a), by Vietnam calendar days. */
export function daysBetween(a: string | Date, b: string | Date): number {
  const x = new Date(`${dayOf(a)}T00:00:00Z`).getTime();
  const y = new Date(`${dayOf(b)}T00:00:00Z`).getTime();
  return Math.round((y - x) / DAY_MS);
}

/** Instant → ISO string with the fixed +07:00 offset (seconds precision). */
export function toIsoVN(d: Date): string {
  return `${new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 19)}+07:00`;
}

/** ISO (+07:00) for `minutes` before `now`. */
export function minutesBefore(now: Date, minutes: number): string {
  return toIsoVN(new Date(now.getTime() - minutes * 60_000));
}
