import { formatDateVi, formatTimeVi } from '@/lib/dates';

/** "09:05 22/10/2026" for a message's time; empty when the stored time is missing or unreadable (the data layer allows that, and formatting it would throw). */
export function whenText(iso: string): string {
  return Number.isNaN(Date.parse(iso)) ? '' : `${formatTimeVi(iso)} ${formatDateVi(iso)}`;
}
