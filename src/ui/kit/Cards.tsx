import { useId, type ReactNode } from 'react';
import { AppLink } from '@/app/nav';
import { cx } from '@/lib/cx';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/names';
import s from './Cards.module.css';

/** A figure with its label (revenue, counts). */
export function StatCard({ icon, label, value, hint, tone = 'plum' }: { icon: IconName; label: string; value: ReactNode; hint?: ReactNode; tone?: 'plum' | 'orange' | 'teal' }) {
  return (
    <div className={s.stat} data-stat>
      <span className={cx(s.statIcon, s[tone])} aria-hidden="true"><Icon name={icon} size={20} /></span>
      <span className={s.statText}>
        <span className={s.statLabel}>{label}</span>
        <span className={s.statValue}>{value}</span>
        {hint && <span className={s.statHint}>{hint}</span>}
      </span>
    </div>
  );
}

/** A titled card; the optional link reads "Xem tất cả →". */
export function SectionCard({ title, action, children, id, className }: { title: ReactNode; action?: { label: string; to: string }; children: ReactNode; id?: string; className?: string }) {
  const auto = useId();
  const hid = id ?? `sec-${auto}`;
  return (
    <section className={cx(s.section, className)} aria-labelledby={hid}>
      <div className={s.sectionHead}>
        <h2 id={hid} className={s.sectionTitle}>{title}</h2>
        {action && <AppLink to={action.to} className={s.more}>{action.label}<Icon name="arrow-right" size={15} aria-hidden="true" /></AppLink>}
      </div>
      {children}
    </section>
  );
}

/** Label–value pairs (pet profile, invoice facts). */
export function DetailList({ items }: { items: { label: ReactNode; value: ReactNode }[] }) {
  return (
    <dl className={s.details}>
      {items.map((it, i) => (<div key={i}><dt>{it.label}</dt><dd>{it.value}</dd></div>))}
    </dl>
  );
}
