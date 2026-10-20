import { describe, expect, it } from 'vitest';
import { readListState, writeListState, type StorageLike } from './list-state';

const memory = (): StorageLike & { data: Record<string, string> } => {
  const data: Record<string, string> = {};
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
};
const initial = { page: 1, q: '', sel: '' };

describe('remembered list state (back keeps page, filter and selection)', () => {
  it('round-trips and merges what was saved over the defaults', () => {
    const m = memory();
    writeListState(m, 'kh', { page: 3 });
    expect(readListState(m, 'kh', initial)).toEqual({ page: 3, q: '', sel: '' });
  });
  it('blocked or broken storage falls back to the defaults without throwing', () => {
    const throwing: StorageLike = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('quota'); } };
    expect(readListState(throwing, 'kh', initial)).toEqual(initial);
    expect(() => writeListState(throwing, 'kh', { page: 2 })).not.toThrow();
    expect(readListState(null, 'kh', initial)).toEqual(initial);
    const bad = memory();
    bad.data['leson:list:kh'] = '{bad';
    expect(readListState(bad, 'kh', initial)).toEqual(initial);
    bad.data['leson:list:kh'] = '[1,2]';
    expect(readListState(bad, 'kh', initial)).toEqual(initial);
  });
  it('a saved value of the wrong type is ignored for that field', () => {
    const m = memory();
    m.data['leson:list:kh'] = JSON.stringify({ page: 'x', q: 'Lan' });
    expect(readListState(m, 'kh', initial)).toEqual({ page: 1, q: 'Lan', sel: '' });
  });
});
