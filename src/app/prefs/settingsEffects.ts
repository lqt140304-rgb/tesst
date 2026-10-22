import { PAYMENT_METHODS, type PaymentMethod, type Service } from '@/data/contracts/enums';
import type { AppSettingsValues, Holiday } from '@/data/staff';
import { findHoliday } from '@/data/rules/app-settings';
import { HOLIDAY_CLOSE } from '@/data/rules/booking';

/** Whole hours that contain the calendar hours: the start rounds down, the end rounds up. */
export function hoursOf(s: Pick<AppSettingsValues, 'calendar_start' | 'calendar_end'>): { startH: number; endH: number } {
  const [sh = 0] = s.calendar_start.split(':').map(Number);
  const [eh = 0, em = 0] = s.calendar_end.split(':').map(Number);
  return { startH: sh, endH: em > 0 ? eh + 1 : eh };
}

/** Inpatient has no duration setting: it stays at 30 minutes, as before. */
export function minutesFor(service: Service, s: Pick<AppSettingsValues, 'default_duration_kham' | 'default_duration_spa'>): number {
  return service === 'kham' ? s.default_duration_kham : service === 'spa' ? s.default_duration_spa : 30;
}

/** The methods in their fixed order; never empty, so a payment can always be recorded. */
export function enabledMethods(s: Pick<AppSettingsValues, 'payment_methods'>): PaymentMethod[] {
  const on = PAYMENT_METHODS.filter((m) => s.payment_methods.includes(m));
  return on.length > 0 ? on : ['cash'];
}

export const holidayMark = (date: string, holidays: readonly Holiday[]): Holiday | undefined => findHoliday(holidays, date);

/** A warning, not a block: staff may still book past the holiday closing time. */
export function holidayNotice(date: string, endTime: string | undefined, holidays: readonly Holiday[]): string | undefined {
  if (!endTime || !findHoliday(holidays, date)) return undefined;
  return endTime > HOLIDAY_CLOSE ? `Ngày lễ: bệnh viện làm đến ${HOLIDAY_CLOSE}.` : undefined;
}
