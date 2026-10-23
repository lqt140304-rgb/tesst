import { describe, expect, it } from 'vitest';
import { formatDateVi, formatTimeVi } from '@/lib/dates';
import { whenText } from './inquiryWhen';

describe('whenText', () => {
  it('writes the time then the date', () => {
    const iso = '2026-10-22T09:05:00+07:00';
    expect(whenText(iso)).toBe(`${formatTimeVi(iso)} ${formatDateVi(iso)}`);
  });
  it('a missing or unreadable time gives an empty text instead of throwing', () => {
    expect(whenText('')).toBe('');
    expect(whenText('not a time')).toBe('');
  });
});
