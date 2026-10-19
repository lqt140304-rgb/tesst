import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { m } from 'motion/react';
import { cx } from '@/lib/cx';
import { spring } from '../motion';
import s from './Tabs.module.css';

export type TabItem<T extends string> = { value: T; label: ReactNode; count?: number };

/** Tabs with a gliding indicator (spring-glide); arrow keys move between tabs. */
export function Tabs<T extends string>({ items, value, onChange, label, variant = 'pill', className }: {
  items: TabItem<T>[]; value: T; onChange: (v: T) => void; label: string; variant?: 'pill' | 'underline'; className?: string;
}) {
  const layoutId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  function onKey(e: KeyboardEvent, i: number) {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const n = (i + dir + items.length) % items.length;
    onChange(items[n]!.value);
    refs.current[n]?.focus();
  }
  return (
    <div role="tablist" aria-label={label} className={cx(s.list, variant === 'underline' && s.underline, className)}>
      {items.map((t, i) => {
        const selected = t.value === value;
        return (
          <button key={t.value} ref={(el) => { refs.current[i] = el; }} role="tab" type="button" aria-selected={selected} tabIndex={selected ? 0 : -1}
            className={s.tab} onClick={() => onChange(t.value)} onKeyDown={(e) => onKey(e, i)}>
            {selected && <m.span layoutId={layoutId} className={s.pill} transition={spring.glide} />}
            {t.label}
            {t.count !== undefined && <span className={s.count}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
