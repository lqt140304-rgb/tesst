import { describe, expect, it } from 'vitest';
import { dedupeKey } from './dedupe';
import type { RequestSnapshot } from '../contracts/enums';

const base: RequestSnapshot = {
  contact_name: 'Nguyễn Lan', phone_e164: '+84900000001', pet_name: 'Miu', species: 'cat',
  service: 'kham', desired_date: '2026-10-21', note: 'Bé bỏ ăn',
};

describe('dedupeKey', () => {
  it('ignores case and extra spaces', () => {
    const messy = { ...base, contact_name: '  nguyễn   LAN ', pet_name: 'miu ', note: ' bé  bỏ ăn' };
    expect(dedupeKey({ kind: 'guest' }, messy)).toBe(dedupeKey({ kind: 'guest' }, base));
  });
  it('treats NFD and NFC Vietnamese as the same', () => {
    expect(dedupeKey({ kind: 'guest' }, { ...base, contact_name: 'Nguyễn Lan'.normalize('NFD') })).toBe(dedupeKey({ kind: 'guest' }, base));
  });
  it('differs when any field differs', () => {
    expect(dedupeKey({ kind: 'guest' }, { ...base, note: 'Khác' })).not.toBe(dedupeKey({ kind: 'guest' }, base));
    expect(dedupeKey({ kind: 'guest' }, { ...base, desired_date: '2026-10-22' })).not.toBe(dedupeKey({ kind: 'guest' }, base));
  });
  it('differs between guest and account scope and between accounts', () => {
    const g = dedupeKey({ kind: 'guest' }, base);
    const a = dedupeKey({ kind: 'account', accountId: 'a1' }, base);
    const b = dedupeKey({ kind: 'account', accountId: 'a2' }, base);
    expect(new Set([g, a, b]).size).toBe(3);
  });
});
