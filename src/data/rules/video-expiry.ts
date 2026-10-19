import { daysBetween } from '../../lib/dates';

export const VIDEO_TTL_DAYS = 60;

export function videoExpiresAt(uploadedAt: string): string {
  const t = new Date(new Date(uploadedAt).getTime() + VIDEO_TTL_DAYS * 86_400_000);
  // Re-express in +07:00 so stored timestamps stay in one offset.
  const local = new Date(t.getTime() + 7 * 3_600_000).toISOString().slice(0, 19);
  return `${local}+07:00`;
}

export function daysLeft(expiresAt: string, now: Date): number {
  return daysBetween(now, expiresAt);
}

/** R16: rose ≤ 3 days, orange 4–14 days. */
export function expiryTone(days: number): 'normal' | 'orange' | 'rose' {
  if (days <= 3) return 'rose';
  if (days <= 14) return 'orange';
  return 'normal';
}
