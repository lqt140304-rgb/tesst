import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { auth, system, type Session } from '@/data/public';
import type { Me } from '@/data/contracts/api';
import type { Cap } from '@/data/rules/capabilities';

type SessionValue = { session: Session | null; me: Me | null; meLoaded: boolean; can: (cap: Cap | Cap[]) => boolean };
const Ctx = createContext<SessionValue>({ session: null, me: null, meLoaded: false, can: () => false });

const snapshot = () => JSON.stringify(auth.current());

/** Session is read synchronously (guards never flash protected content); `me` follows session and data changes. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(auth.subscribe, snapshot);
  const session = useMemo(() => JSON.parse(raw) as Session | null, [raw]);
  const rev = useSyncExternalStore(system.subscribe, system.rev);
  const [me, setMe] = useState<{ key: string; value: Me | null } | null>(null);
  useEffect(() => {
    let alive = true;
    void auth.me().then((value) => { if (alive) setMe({ key: `${raw}|${rev}`, value }); });
    return () => { alive = false; };
  }, [raw, rev]);
  const value = useMemo<SessionValue>(() => {
    const current = me?.value ?? null;
    const caps = current?.kind === 'staff' ? new Set(current.caps) : new Set<Cap>();
    return {
      session,
      me: session ? current : null,
      meLoaded: me !== null,
      can: (cap) => (Array.isArray(cap) ? cap : [cap]).some((c) => caps.has(c)),
    };
  }, [session, me]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);

/** Short display name: 1–3 words kept; 4+ words → last two ("Nguyễn Thị Phương Anh" → "Phương Anh"). Locked header rule. */
export function shortName(full: string): string {
  const w = full.trim().split(/\s+/);
  return w.length <= 3 ? w.join(' ') : w.slice(-2).join(' ');
}
