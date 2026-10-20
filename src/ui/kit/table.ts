/** Pure helpers behind DataTable (redesign §5.2). */
export type PageInfo = { page: number; pages: number; from: number; to: number; total: number };

/** One page of rows. A page past the end (rows narrowed by a search) clamps to the last page, so a page is never empty by mistake. */
export function paginate<T>(rows: T[], page: number, pageSize: number): PageInfo & { rows: T[] } {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const start = (p - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize);
  return { rows: slice, page: p, pages, total, from: total ? start + 1 : 0, to: start + slice.length };
}

export const rangeLabel = (p: PageInfo, noun: string) => (p.total ? `Hiển thị ${p.from}–${p.to} của ${p.total} ${noun}` : 'Không có kết quả');

/** Page buttons, at most 7: all of them when few, otherwise first, last and a window around the current page. */
export function pageList(page: number, pages: number): (number | '…')[] {
  const span = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  if (pages <= 7) return span(1, pages);
  if (page <= 4) return [...span(1, 5), '…', pages];
  if (page >= pages - 3) return [1, '…', ...span(pages - 4, pages)];
  return [1, '…', page - 1, page, page + 1, '…', pages];
}

/** Arrow keys move one row, Home/End jump; always inside the table. */
export function moveRow(index: number, key: string, count: number): number {
  const last = Math.max(0, count - 1);
  switch (key) {
    case 'ArrowDown': return Math.min(index + 1, last);
    case 'ArrowUp': return Math.max(index - 1, 0);
    case 'Home': return 0;
    case 'End': return last;
    default: return index;
  }
}
