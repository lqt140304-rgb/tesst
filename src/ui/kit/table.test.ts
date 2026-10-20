import { describe, expect, it } from 'vitest';
import { moveRow, pageList, paginate, rangeLabel } from './table';

const rows = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe('table helpers', () => {
  it('pages and labels the range', () => {
    const p = paginate(rows(24), 1, 5);
    expect(p).toMatchObject({ page: 1, pages: 5, from: 1, to: 5, total: 24 });
    expect(p.rows).toEqual([1, 2, 3, 4, 5]);
    expect(rangeLabel(p, 'khách hàng')).toBe('Hiển thị 1–5 của 24 khách hàng');
    expect(rangeLabel(paginate(rows(24), 5, 5), 'khách hàng')).toBe('Hiển thị 21–24 của 24 khách hàng');
  });
  it('a page past the end (rows narrowed by a search) clamps to the last page — never an empty page', () => {
    expect(paginate(rows(4), 3, 5)).toMatchObject({ page: 1, from: 1, to: 4, pages: 1 });
    expect(paginate(rows(12), 9, 5)).toMatchObject({ page: 3, from: 11, to: 12 });
    expect(paginate(rows(12), 0, 5).page).toBe(1);
  });
  it('no rows → one empty page and "Không có kết quả"', () => {
    const p = paginate([], 2, 5);
    expect(p).toMatchObject({ page: 1, pages: 1, total: 0, from: 0, to: 0 });
    expect(rangeLabel(p, 'khách hàng')).toBe('Không có kết quả');
  });
  it('page buttons: all when few, first/last with gaps when many', () => {
    expect(pageList(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageList(6, 12)).toEqual([1, '…', 5, 6, 7, '…', 12]);
    expect(pageList(1, 12)).toEqual([1, 2, 3, 4, 5, '…', 12]);
    expect(pageList(12, 12)).toEqual([1, '…', 8, 9, 10, 11, 12]);
    expect(pageList(1, 12).length).toBeLessThanOrEqual(7);
  });
  it('keyboard row moves stay inside the table', () => {
    expect(moveRow(0, 'ArrowUp', 5)).toBe(0);
    expect(moveRow(4, 'ArrowDown', 5)).toBe(4);
    expect(moveRow(1, 'ArrowDown', 5)).toBe(2);
    expect(moveRow(2, 'Home', 5)).toBe(0);
    expect(moveRow(2, 'End', 5)).toBe(4);
    expect(moveRow(2, 'a', 5)).toBe(2);
  });
});
