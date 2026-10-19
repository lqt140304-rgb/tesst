import { useStableMatches } from './transition';
import type { Cap } from '@/data/rules/capabilities';

export type Zone = 'public' | 'auth' | 'customer' | 'staff' | 'print';
export type RouteHandle = { zone?: Zone; pageKey?: string; title?: string; cap?: Cap | Cap[]; linkedOnly?: boolean; section?: string };

/** The deepest route handle values (frozen while a layer exits). */
export function useHandle(): Required<Pick<RouteHandle, 'zone' | 'pageKey'>> & RouteHandle {
  const matches = useStableMatches();
  const merged: RouteHandle = {};
  for (const m of matches) Object.assign(merged, m.handle as RouteHandle | undefined);
  return { ...merged, zone: merged.zone ?? 'public', pageKey: merged.pageKey ?? matches[matches.length - 1]?.pathname ?? '/' };
}
