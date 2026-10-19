import { cx } from '@/lib/cx';
import { Icon } from '../icons/Icon';
import type { Pill } from '../status';
import s from './Pill.module.css';

/** Status chip: always an icon plus a label, never colour alone. */
export function StatusPill({ pill, dense, className }: { pill: Pill; dense?: boolean; className?: string }) {
  return (
    <span className={cx(s.pill, s[pill.tone], dense && s.dense, !pill.icon && s.noIcon, className)} data-tone={pill.tone}>
      {pill.icon && <Icon name={pill.icon} size={dense ? 13 : 14} />}
      {pill.label}
    </span>
  );
}

/** "Dữ liệu mẫu", "Ảnh minh họa", "Giá minh họa"… — honest labels for invented content. */
export function DemoTag({ children, className }: { children: string; className?: string }) {
  return <span className={cx(s.pill, s.demo, className)}>{children}</span>;
}
