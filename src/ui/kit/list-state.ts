import { useCallback, useState } from 'react';

/** A list's page, filter and selection, remembered per tab so "back" lands where the person left (motion proposal §3). */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
const PREFIX = 'leson:list:';

/** Saved fields override the defaults only when they have the same type; anything unreadable gives the defaults. */
export function readListState<T extends object>(store: StorageLike | null, key: string, initial: T): T {
  try {
    const raw = store?.getItem(PREFIX + key);
    const saved: unknown = raw ? JSON.parse(raw) : null;
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return initial;
    const out = { ...initial } as Record<string, unknown>;
    for (const [k, v] of Object.entries(saved)) if (k in out && typeof v === typeof out[k]) out[k] = v;
    return out as T;
  } catch {
    return initial;
  }
}

export function writeListState(store: StorageLike | null, key: string, value: object): void {
  try { store?.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* private window or full storage: the list still works */ }
}

const session = (): StorageLike | null => { try { return window.sessionStorage; } catch { return null; } };

export function useListState<T extends object>(key: string, initial: T): [T, (patch: Partial<T>) => void] {
  const [state, setState] = useState(() => readListState(session(), key, initial));
  const update = useCallback((patch: Partial<T>) => setState((s) => {
    const next = { ...s, ...patch };
    writeListState(session(), key, next);
    return next;
  }), [key]);
  return [state, update];
}
