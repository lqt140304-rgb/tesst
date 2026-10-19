import { forwardRef, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { AppLink } from '@/app/nav';
import { cx } from '@/lib/cx';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/names';
import s from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'success' | 'danger' | 'emergency';
type Common = { variant?: ButtonVariant; size?: 'sm' | 'md' | 'lg'; icon?: IconName; iconRight?: IconName; full?: boolean; iconOnly?: boolean; children?: ReactNode };

const classes = ({ variant = 'primary', size = 'md', full, iconOnly }: Common, extra?: string) =>
  cx(s.btn, s[variant], size !== 'md' && s[size], full && s.full, iconOnly && s.iconOnly, extra);

const iconSize = (size: Common['size']) => (size === 'sm' ? 16 : 18);

export const Button = forwardRef<HTMLButtonElement, Common & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; loadingText?: string }>(
  function Button({ variant, size, icon, iconRight, full, iconOnly, loading, loadingText, children, className, disabled, type = 'button', ...rest }, ref) {
    return (
      <button ref={ref} type={type} className={classes({ variant, size, full, iconOnly }, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
        {loading ? <span className={s.spinner} aria-hidden="true" /> : icon && <Icon name={icon} size={iconSize(size)} />}
        {loading && loadingText ? loadingText : children}
        {!loading && iconRight && <Icon name={iconRight} size={iconSize(size)} />}
      </button>
    );
  },
);

export function ButtonLink({ to, variant, size, icon, iconRight, full, iconOnly, children, className, ...rest }: Common & { to: string; className?: string; 'aria-label'?: string; onClick?: (e: MouseEvent<HTMLAnchorElement>) => void; replace?: boolean }) {
  return (
    <AppLink to={to} className={classes({ variant, size, full, iconOnly }, className)} {...rest}>
      {icon && <Icon name={icon} size={iconSize(size)} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize(size)} />}
    </AppLink>
  );
}

/** Plain anchor (tel:, maps, external) styled as a button. */
export function ButtonAnchor({ href, variant, size, icon, iconRight, full, children, className, external, ...rest }: Common & { href: string; className?: string; external?: boolean; 'aria-label'?: string }) {
  return (
    <a href={href} className={classes({ variant, size, full }, className)} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
      {icon && <Icon name={icon} size={iconSize(size)} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize(size)} />}
    </a>
  );
}
