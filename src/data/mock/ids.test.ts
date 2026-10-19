import { describe, expect, it } from 'vitest';
import { newId, nextCode } from './ids';
import { emptyTables, SCHEMA_VERSION, type Doc } from './store/schema';

const doc = (): Doc => ({ schemaVersion: SCHEMA_VERSION, seededAt: '2026-10-19', dirty: false, rev: 0, counters: { YC: 244, LH: 0, NT: 44, HD: 0, PT: 0, KH: 18, TC: 0 }, t: emptyTables() });

describe('ids', () => {
  it('allocates zero-padded human codes from counters', () => {
    const d = doc();
    expect(nextCode(d, 'YC')).toBe('YC-0245');
    expect(nextCode(d, 'YC')).toBe('YC-0246');
    expect(nextCode(d, 'KH')).toBe('KH-0019');
  });
  it('creates unique ids', () => {
    expect(new Set(Array.from({ length: 50 }, newId)).size).toBe(50);
  });
});
