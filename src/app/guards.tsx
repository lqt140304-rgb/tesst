import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { landingPath } from './prefs';
import { paths, safeNext } from './routes';
import { useSession } from './session/SessionProvider';
import { useLive } from './transition';

const withNext = (base: string, path: string) => `${base}?tiep=${encodeURIComponent(path)}`;

/** Signed in as staff with no page asked for: the page the person chose to open after signing in (the data layer already falls back to the overview if the right is gone). */
function StaffLanding() {
  const q = useQuery(() => staff.prefs.get(), []);
  if (q.data) return <Navigate to={landingPath(q.data.landing)} replace />;
  return q.error ? <Navigate to={paths.nv.home} replace /> : null;
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const loc = useLocation();
  const live = useLive();
  if (!live) return <>{children}</>;
  if (session?.kind === 'staff') {
    const next = safeNext(new URLSearchParams(loc.search).get('tiep'));
    return next?.startsWith('/nv') ? <Navigate to={next} replace /> : <StaffLanding />;
  }
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
