import { describe, expect, it } from 'vitest';
import { matchesAppointment } from './search';

const row = { petName: 'Bông', customerName: 'Nguyễn Thị Lan', customerPhone: '+84973555105', code: 'LH-0001' };

describe('matchesAppointment', () => {
  it.each(['bong', 'BÔNG', 'lan', 'nguyen thi', 'LH-0001', '097 355', '0973555105', '+84 973 555 105', '973555'])('matches %s', (q) => {
    expect(matchesAppointment(row, q)).toBe(true);
  });
  it.each(['mit', '0912', 'zzz', 'bông lan'])('does not match %s', (q) => {
    expect(matchesAppointment(row, q)).toBe(false);
  });
  it('an empty or blank query matches everything', () => {
    expect(matchesAppointment(row, '')).toBe(true);
    expect(matchesAppointment(row, '   ')).toBe(true);
  });
  it('đ is folded like d', () => {
    expect(matchesAppointment({ ...row, petName: 'Đậu' }, 'dau')).toBe(true);
  });
});
