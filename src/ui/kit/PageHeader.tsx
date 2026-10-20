import type { ReactNode } from 'react';
import { AppLink } from '@/app/nav';
import { Icon } from '../icons/Icon';
import s from './PageHeader.module.css';

export type Crumb = { label: string; to?: string };

/** One page header for customer and staff (redesign §5.2): breadcrumb, Lora title, a line of context, actions. */
export function PageHeader({ title, sub, actions, eyebrow, crumbs, size = 'md' }: {
  title: ReactNode; sub?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; crumbs?: Crumb[]; size?: 'md' | 'lg';
}) {
  return (
    <header className={s.head} data-size={size}>
      <div className={s.text}>
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Đường dẫn" className={s.crumbs}>
            <ol>
              {crumbs.map((c, i) => {
                const last = i === crumbs.length - 1;
                return (
                  <li key={`${c.label}-${i}`}>
                    {!last && c.to ? <AppLink to={c.to}>{c.label}</AppLink> : <span aria-current={last ? 'page' : undefined}>{c.label}</span>}
                    {!last && <Icon name="chevron-right" size={14} />}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
        {eyebrow}
        <h1 className={s.title} tabIndex={-1}>{title}</h1>
        {sub && <p className={s.sub}>{sub}</p>}
      </div>
      {actions && <div className={s.actions}>{actions}</div>}
    </header>
  );
}
