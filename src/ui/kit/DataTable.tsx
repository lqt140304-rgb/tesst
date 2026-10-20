import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { Icon } from '../icons/Icon';
import { moveRow, pageList, paginate, rangeLabel } from './table';
import s from './DataTable.module.css';

/** A click on a control inside a cell (button, link, field) belongs to that control, not to the row. */
const fromControl = (target: EventTarget, row: Element) => {
  const hit = target instanceof Element ? target.closest('a, button, input, select, textarea, label, [role="button"]') : null;
  return !!hit && hit !== row && row.contains(hit);
};

export type Column<T> = { key: string; header: string; cell: (row: T) => ReactNode; align?: 'start' | 'end'; primary?: boolean; hideOnPhone?: boolean };

/**
 * One table for every width (redesign §5.2): below 768 px CSS lays rows out as cards, each value labelled from its header —
 * no second markup, so screen readers hear each row once. Rows open with click, Enter or Space; arrows move between rows.
 */
export function DataTable<T>({ rows, columns, rowKey, caption, noun, selectedKey, onOpen, pageSize = 10, page: pageProp, onPageChange, empty }: {
  rows: T[]; columns: Column<T>[]; rowKey: (row: T) => string; caption: string; noun: string;
  selectedKey?: string; onOpen?: (row: T, via: 'pointer' | 'keyboard') => void; pageSize?: number; page?: number; onPageChange?: (page: number) => void; empty?: ReactNode;
}) {
  const [own, setOwn] = useState(1);
  const p = paginate(rows, pageProp ?? own, pageSize);
  const go = (n: number) => (onPageChange ? onPageChange(n) : setOwn(n));
  const refs = useRef<(HTMLTableRowElement | null)[]>([]);
  const sel = p.rows.findIndex((r) => rowKey(r) === selectedKey);
  const tabStop = sel >= 0 ? sel : 0;

  function onKey(e: KeyboardEvent<HTMLTableRowElement>, i: number, row: T) {
    if (e.target !== e.currentTarget) return; // keys typed into a button, link or field in a cell stay theirs
    if ((e.key === 'Enter' || e.key === ' ') && onOpen) { e.preventDefault(); onOpen(row, 'keyboard'); return; }
    const n = moveRow(i, e.key, p.rows.length);
    if (n !== i) { e.preventDefault(); refs.current[n]?.focus(); }
  }

  if (rows.length === 0 && empty) return <div className={s.empty}>{empty}</div>;
  const style = p.pages > 1 ? ({ '--min-rows': pageSize } as CSSProperties) : undefined;
  return (
    <div className={s.wrap}>
      <div className={s.region} role="region" aria-label={caption} tabIndex={0} style={style}>
        <table className={s.table}>
          <caption className="sr-only">{caption}</caption>
          <thead><tr>{columns.map((c) => <th key={c.key} scope="col" className={cx(c.align === 'end' && s.end)}>{c.header}</th>)}</tr></thead>
          <tbody>
            {p.rows.map((row, i) => {
              const key = rowKey(row);
              const selected = key === selectedKey;
              return (
                <tr key={key} ref={(el) => { refs.current[i] = el; }} data-row tabIndex={i === tabStop ? 0 : -1} aria-current={selected || undefined}
                  className={cx(s.row, selected && s.selected, onOpen && s.clickable)}
                  onClick={onOpen ? (e) => { if (!fromControl(e.target, e.currentTarget)) onOpen(row, 'pointer'); } : undefined} onKeyDown={(e) => onKey(e, i, row)}>
                  {columns.map((c) => (
                    <td key={c.key} data-label={c.header} className={cx(c.align === 'end' && s.end, c.primary && s.primary, c.hideOnPhone && s.hideOnPhone)}>{c.cell(row)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className={s.foot}>
        <p className={s.range}>{rangeLabel(p, noun)}</p>
        {p.pages > 1 && (
          <nav className={s.pager} aria-label="Phân trang">
            <button type="button" className={s.pageBtn} aria-label="Trang trước" disabled={p.page === 1} onClick={() => go(p.page - 1)}><Icon name="chevron-left" size={16} /></button>
            {pageList(p.page, p.pages).map((n, i) => (n === '…'
              ? <span key={`gap-${i}`} className={s.gap} aria-hidden="true">…</span>
              : <button key={n} type="button" className={s.pageBtn} aria-current={n === p.page ? 'page' : undefined} aria-label={`Trang ${n}`} onClick={() => go(n)}>{n}</button>))}
            <button type="button" className={s.pageBtn} aria-label="Trang sau" disabled={p.page === p.pages} onClick={() => go(p.page + 1)}><Icon name="chevron-right" size={16} /></button>
          </nav>
        )}
      </div>
    </div>
  );
}
