import type { StaffAppointment } from '@/data/staff';

const fold = (x: string) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').trim();
/** Phone digits in one shape: no spaces, a leading 0 or +84 both read as 84. */
const digits = (x: string) => x.replace(/\D/g, '').replace(/^0/, '84');

/** Quick search on the calendar: pet, customer, appointment code (no accents, any case) or phone (spaces, 0 or +84 ignored). */
export function matchesAppointment(a: Pick<StaffAppointment, 'petName' | 'customerName' | 'customerPhone' | 'code'>, q: string): boolean {
  const text = fold(q);
  if (!text) return true;
  if (/^[\d\s+().-]+$/.test(q.trim())) {
    const d = digits(q);
    return d.length > 0 && digits(a.customerPhone).includes(d);
  }
  return [a.petName, a.customerName, a.code].some((f) => fold(f).includes(text));
}
