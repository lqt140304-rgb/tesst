import { describe, expect, it } from 'vitest';
import { addDays, at, formatDateVi, formatDayVi, formatTimeVi, minutesAgoVi, partOfDay, relativeDayVi, todayVN } from './dates';

describe('dates', () => {
  it('formats the weekday from the date (19/10/2026 is Monday)', () => {
    expect(formatDayVi('2026-10-19T09:00:00+07:00')).toBe('Thứ Hai, 19/10');
    expect(formatDayVi('2026-10-21T09:00:00+07:00')).toBe('Thứ Tư, 21/10');
    expect(formatDayVi('2026-10-25T09:00:00+07:00')).toBe('Chủ Nhật, 25/10');
  });
  it('builds ISO timestamps from a day offset in Vietnam time', () => {
    expect(at('2026-10-19', -2, '09:30')).toBe('2026-10-17T09:30:00+07:00');
    expect(at('2026-10-31', 1, '08:00')).toBe('2026-11-01T08:00:00+07:00');
  });
  it('computes today in Vietnam even when UTC is still yesterday', () => {
    expect(todayVN(new Date('2026-10-18T18:30:00Z'))).toBe('2026-10-19');
  });
  it('adds days to a plain date', () => {
    expect(addDays('2026-10-19', 13)).toBe('2026-11-01');
  });
  it('formats date and time', () => {
    expect(formatDateVi('2026-10-19T08:10:00+07:00')).toBe('19/10/2026');
    expect(formatTimeVi('2026-10-19T08:10:00+07:00')).toBe('08:10');
  });
  it('names the part of day', () => {
    expect(partOfDay('2026-10-19T08:10:00+07:00')).toBe('sang');
    expect(partOfDay('2026-10-19T13:00:00+07:00')).toBe('chieu');
    expect(partOfDay('2026-10-19T20:00:00+07:00')).toBe('toi');
  });
  it('labels relative days', () => {
    const now = new Date('2026-10-19T09:00:00+07:00');
    expect(relativeDayVi('2026-10-19T20:00:00+07:00', now)).toBe('Hôm nay');
    expect(relativeDayVi('2026-10-18T20:00:00+07:00', now)).toBe('Hôm qua');
    expect(relativeDayVi('2026-10-20T08:00:00+07:00', now)).toBe('Ngày mai');
    expect(relativeDayVi('2026-10-25T08:00:00+07:00', now)).toBeNull();
  });
  it('says how long ago', () => {
    const now = new Date('2026-10-19T09:00:00+07:00');
    expect(minutesAgoVi('2026-10-19T08:48:00+07:00', now)).toBe('12 phút trước');
    expect(minutesAgoVi('2026-10-19T07:00:00+07:00', now)).toBe('2 giờ trước');
    expect(minutesAgoVi('2026-10-19T08:59:40+07:00', now)).toBe('Vừa xong');
    expect(minutesAgoVi('2026-10-18T21:40:00+07:00', now)).toBe('Hôm qua');
    expect(minutesAgoVi('2026-10-16T21:40:00+07:00', now)).toBe('16/10');
  });
});
