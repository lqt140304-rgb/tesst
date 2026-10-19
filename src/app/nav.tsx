/** The only module allowed to use react-router's Link/navigate (works in hash and memory routers). */
import { forwardRef, type AnchorHTMLAttributes } from 'react';
import { Link, NavLink, useNavigate, type NavigateOptions } from 'react-router';

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string; replace?: boolean; state?: unknown };

export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(function AppLink({ to, ...rest }, ref) {
  return <Link ref={ref} to={to} {...rest} />;
});

type AppNavLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'> & {
  to: string; end?: boolean; className?: string | ((s: { isActive: boolean }) => string);
};
export function AppNavLink({ to, end, className, ...rest }: AppNavLinkProps) {
  return <NavLink to={to} end={end} className={className} {...rest} />;
}

export function useAppNavigate() {
  const navigate = useNavigate();
  return (to: string | number, opts?: NavigateOptions) => (typeof to === 'number' ? navigate(to) : navigate(to, opts));
}

/** External links always open in a new tab safely. */
export function ExternalLink(props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a target="_blank" rel="noopener noreferrer" {...props} />;
}
