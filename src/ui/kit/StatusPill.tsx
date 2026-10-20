import { useState } from 'react';
import { cx } from '@/lib/cx';
import { Icon } from '../icons/Icon';
import type { Pill } from '../status';
import s from './Pill.module.css';

/** Status chip: always an icon plus a label, never colour alone. It pops once when its status changes (never on first paint). */
export function StatusPill({ pill, dense, className }: { pill: Pill; dense?: boolean; className?: string }) {
  const [last, setLast] = useState(pill.label);
  const [popped, setPopped] = useState(false);
  if (last !== pill.label) {
    setLast(pill.label);
    setPopped(true);
  }
  return (
    <span key={popped ? pill.label : undefined} className={cx(s.pill, s[pill.tone], dense && s.dense, !pill.icon && s.noIcon, popped && s.pop, className)}
      data-tone={pill.tone} data-popped={popped ? 'true' : undefined}>
      {pill.icon && <Icon name={pill.icon} size={dense ? 13 : 14} />}
      {pill.label}
    </span>
  );
}

/** "Dữ liệu mẫu", "Ảnh minh họa", "Giá minh họa"… — honest labels for invented content. */
export function DemoTag({ children, className }: { children: string; className?: string }) {
  return <span className={cx(s.pill, s.demo, className)}>{children}</span>;
}
