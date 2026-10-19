import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { paths, safeNext } from './routes';
import { useSession } from './session/SessionProvider';
import { useLive } from './transition';

const withNext = (base: string, path: string) => `${base}?tiep=${encodeURIComponent(path)}`;

export function RequireGuest({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const loc = useLocation();
  const live = useLive();
  if (!live) return <>{children}</>;
  if (session?.kind === 'staff') return <Navigate to={safeNext(new URLSearchParams(loc.search).get('tiep'))?.startsWith('/nv') ? safeNext(new URLSearchParams(loc.search).get('tiep'))! : paths.nv.home} replace />;
  if (session?.kind === 'customer') {
    const next = safeNext(new URLSearchParams(loc.search).get('tiep'));
    return <Navigate to={next && !next.startsWith('/nv') ? next : paths.kh.home} replace />;
  }
  return <>{children}</>;
}

export function RequireCustomer({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const loc = useLocation();
  const live = useLive();
  if (!live) return <>{children}</>;
  if (!session) return <Navigate to={withNext(paths.login, loc.pathname)} replace />;
  if (session.kind === 'staff') return <Navigate to={paths.nv.home} replace />;
  return <>{children}</>;
}

export function RequireStaff({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const loc = useLocation();
  const live = useLive();
  if (!live) return <>{children}</>;
  if (!session) return <Navigate to={withNext(paths.loginStaff, loc.pathname)} replace />;
  if (session.kind === 'customer') return <Navigate to={paths.kh.home} replace />;
  return <>{children}</>;
}
