import { describe, expect, it } from 'vitest';
import { safeNext } from './routes';

describe('safeNext', () => {
  it('accepts internal zone paths only', () => {
    expect(safeNext('/khach-hang/hoa-don/inv-3')).toBe('/khach-hang/hoa-don/inv-3');
    expect(safeNext('/nv')).toBe('/nv');
    expect(safeNext('/dat-lich')).toBe('/dat-lich');
    expect(safeNext('https://evil.example')).toBeNull();
    expect(safeNext('//evil.example')).toBeNull();
    expect(safeNext('/dang-nhap')).toBeNull();
    expect(safeNext(null)).toBeNull();
  });
});
