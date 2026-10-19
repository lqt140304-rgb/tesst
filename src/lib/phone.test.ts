import { describe, expect, it } from 'vitest';
import { formatPhoneVi, normalizeVnPhone } from './phone';

describe('normalizeVnPhone', () => {
  it.each(['0912 345 678', '0912.345.678', '+84 912 345 678', '84912345678', '0912-345-678'])('normalises %s', (input) => {
    expect(normalizeVnPhone(input)).toBe('+84912345678');
  });
  it.each(['024 3333 4444', '12345', '', '0112345678', 'abc'])('rejects %s', (input) => {
    expect(normalizeVnPhone(input)).toBeNull();
  });
  it('formats E.164 for display', () => {
    expect(formatPhoneVi('+84973555105')).toBe('097 355 51 05');
  });
});
