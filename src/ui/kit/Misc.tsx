import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import { cx } from '@/lib/cx';
import { formatVnd } from '@/lib/money';
import { formatDateVi, formatDayVi, formatTimeVi } from '@/lib/dates';
import { AppLink } from '@/app/nav';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/names';
import s from './Misc.module.css';

export type BadgeTone = 'peach' | 'mint' | 'lilac' | 'rose' | 'cream';
const ICON_FOR: Record<number, number> = { 28: 16, 32: 18, 40: 22, 52: 27, 56: 28 };

export function IconBadge({ icon, tone, size = 40, className }: { icon: IconName; tone: BadgeTone; size?: 28 | 32 | 40 | 52 | 56; className?: string }) {
  return (
    <span className={cx(s.badge, s[`b${size}`], s[tone], className)} aria-hidden="true">
      <Icon name={icon} size={ICON_FOR[size]!} />
    </span>
  );
}

export function Card({ children, className, pad = true, as: As = 'div' }: { children: ReactNode; className?: string; pad?: boolean; as?: 'div' | 'section' | 'article' | 'li' }) {
  return <As className={cx(s.card, pad && s.pad, className)}>{children}</As>;
}

export function CardLink({ to, children, className, pad = true }: { to: string; children: ReactNode; className?: string; pad?: boolean }) {
  return <AppLink to={to} className={cx(s.card, s.interactive, pad && s.pad, className)}>{children}</AppLink>;
}

export function EmptyState({ icon = 'paw-line', title, body, action, art }: { icon?: IconName; title: string; body?: ReactNode; action?: ReactNode; art?: ReactNode }) {
  return (
    <div className={s.empty}>
      <div className={s.emptyArt}>{art ?? <Icon name={icon} size={56} />}</div>
      <p className={s.emptyTitle}>{title}</p>
      {body && <p className={s.emptyBody}>{body}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ h = 16, w = '100%', r }: { h?: number; w?: number | string; r?: number }) {
  return <span className={s.sk} style={{ height: h, width: w, borderRadius: r }} aria-hidden="true" />;
}

export function Banner({ tone = 'info', icon, title, children, action }: { tone?: 'info' | 'warm' | 'ok' | 'alert'; icon?: IconName; title?: ReactNode; children?: ReactNode; action?: ReactNode }) {
  const cls = { info: s.bInfo, warm: s.bWarm, ok: s.bOk, alert: s.bAlert }[tone];
  return (
    <div className={cx(s.banner, cls)} role={tone === 'alert' ? 'alert' : undefined}>
      <Icon name={icon ?? (tone === 'ok' ? 'circle-check' : 'info')} size={20} />
      <div className={s.bannerBody}>
        {title && <strong>{title}</strong>}
        {children && <div>{children}</div>}
      </div>
      {action && <div className={s.bannerAction}>{action}</div>}
    </div>
  );
}

export const Money = ({ value, className }: { value: number; className?: string }) => <span className={cx(s.money, className)}>{formatVnd(value)}</span>;

export function DateText({ iso, mode = 'date' }: { iso: string; mode?: 'date' | 'day' | 'time' | 'dayTime' }) {
  const text = mode === 'date' ? formatDateVi(iso) : mode === 'day' ? formatDayVi(iso) : mode === 'time' ? formatTimeVi(iso) : `${formatTimeVi(iso)} · ${formatDayVi(iso)}`;
  return <time dateTime={iso}>{text}</time>;
}

/** Number count-up, once, when scrolled into view (staff dashboard only — no statistics on the public site). */
export function CountUp({ value, format = (n) => n.toLocaleString('vi-VN') }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    if (!seen || reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 900);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, value, reduce]);
  return <span ref={ref} className={s.money}>{format(reduce ? value : shown)}</span>;
}
