import { describe, expect, it } from 'vitest';
import { isClockTime, parseScheduleTimes } from './schedule-times';

describe('order schedule times (F03)', () => {
  it('reads commas or spaces, pads the hour, sorts and drops repeats', () => {
    expect(parseScheduleTimes('20:00, 8:00 14:30, 08:00')).toEqual({ ok: true, times: ['08:00', '14:30', '20:00'] });
    expect(parseScheduleTimes('  ')).toEqual({ ok: true, times: [] });
  });

  it('rejects impossible times and names the bad part instead of dropping it', () => {
    for (const bad of ['25:99', '08:60', '24:00', '8h', 'sáng']) {
      const r = parseScheduleTimes(`08:00, ${bad}`);
      expect(r.ok).toBe(false);
      expect(!r.ok && r.error).toBe(`Giờ "${bad}" không hợp lệ. Bạn nhập theo dạng giờ:phút (giờ 00–23, phút 00–59), ví dụ 08:00.`);
    }
  });

  it('isClockTime accepts only HH:MM within the day', () => {
    expect(['00:00', '08:05', '23:59'].every(isClockTime)).toBe(true);
    expect(['25:99', '08:60', '8:00', '0800', ''].some(isClockTime)).toBe(false);
  });
});
