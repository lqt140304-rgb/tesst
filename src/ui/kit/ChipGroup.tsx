import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { Icon } from '../icons/Icon';
import s from './ChipGroup.module.css';

export type ChipOption<T extends string> = { value: T; label: ReactNode; leading?: ReactNode };

/** Single-select chips with radio semantics and arrow-key navigation. */
export function ChipGroup<T extends string>({ options, value, onChange, label, variant = 'chip', id }: {
  options: ChipOption<T>[]; value: T | undefined; onChange: (v: T) => void; label: string; variant?: 'chip' | 'card'; id?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = Math.max(0, options.findIndex((o) => o.value === value));
  function onKey(e: KeyboardEvent, i: number) {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const n = (i + dir + options.length) % options.length;
    onChange(options[n]!.value);
    refs.current[n]?.focus();
  }
  return (
    <div role="radiogroup" aria-label={label} className={s.group} id={id}>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => { refs.current[i] = el; }}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={i === current ? 0 : -1}
          className={cx(s.chip, variant === 'card' && s.card)}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {o.leading}
          <span>{o.label}</span>
          <span className={s.tick}><Icon name="check" size={16} /></span>
        </button>
      ))}
    </div>
  );
}
