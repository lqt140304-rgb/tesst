import { TZ, todayVN } from '@/lib/dates';

/** Sections of the intro page, in page order; `lien-he` keeps its old anchor. */
export const PUB_SECTION_IDS = ['gioi-thieu', 'doi-ngu', 'cau-chuyen', 'khong-gian', 'dich-vu', 'san-pham', 'quy-trinh', 'hoi-dap', 'lien-he'] as const;

export type HoursState = { open: boolean; holiday: boolean };

const OPEN_FROM = 8 * 60;
const CLOSE_AT = 21 * 60;
const HOLIDAY_CLOSE_AT = 19 * 60;
const hmFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/** Open 08:00–21:00 every day (Sunday too); on a holiday until 19:00. Read in Vietnam time. */
export function hoursState(now: Date, holidays: readonly string[]): HoursState {
  const [h, m] = hmFmt.format(now).split(':').map(Number) as [number, number];
  const minutes = h * 60 + m;
  const holiday = holidays.includes(todayVN(now));
  return { open: minutes >= OPEN_FROM && minutes < (holiday ? HOLIDAY_CLOSE_AT : CLOSE_AT), holiday };
}

export const holidayNote = (s: HoursState): string | null => (s.holiday && s.open ? 'Hôm nay Lê Sơn làm đến 19:00.' : null);

/** One lead story, then up to two beside it; none hides the whole section. */
export function storyLayout(count: number): { lead: number | null; side: number[] } {
  if (count <= 0) return { lead: null, side: [] };
  return { lead: 0, side: [1, 2].filter((i) => i < count) };
}

/** First `max` characters cut at a word boundary, with an ellipsis when something was cut. */
export function excerpt(text: string, max: number): string {
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const cut = text[max] === ' ' ? head : head.slice(0, Math.max(head.lastIndexOf(' '), 0) || max);
  return `${cut.trimEnd()}…`;
}

export const productCategories = (items: { category: string }[]): string[] => [...new Set(items.map((i) => i.category))];

export function filterProducts<T extends { category: string }>(items: T[], category: string | 'all', limit = 6): T[] {
  return (category === 'all' ? items : items.filter((i) => i.category === category)).slice(0, limit);
}
