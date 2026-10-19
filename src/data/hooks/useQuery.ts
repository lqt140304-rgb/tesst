import { useEffect, useState, useSyncExternalStore } from 'react';
import { api } from '../index';

export type QueryState<T> = { data?: T; error?: Error; isLoading: boolean; isRefreshing: boolean; refetch: () => void };

type Result<T> = { key: string; rev: number; nonce: number; data?: T; error?: Error };

/**
 * Runs `fn` when `deps` change and silently re-runs when the store changes (stale-while-revalidate:
 * existing data stays on screen, so no spinner storms).
 */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[]): QueryState<T> {
  const rev = useSyncExternalStore(api.system.subscribe, api.system.rev);
  const key = JSON.stringify(deps);
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    let alive = true;
    fn().then(
      (data) => { if (alive) setResult({ key, rev, nonce, data }); },
      (error: Error) => { if (alive) setResult((r) => ({ key, rev, nonce, data: r?.key === key ? r.data : undefined, error })); },
    );
    return () => { alive = false; };
    // `fn` is a fresh closure every render; `key`, `rev` and `nonce` are the real triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, rev, nonce]);

  const same = result?.key === key;
  return {
    data: same ? result.data : undefined,
    error: same && result.nonce === nonce ? result.error : undefined,
    isLoading: !same || (result.data === undefined && result.nonce !== nonce),
    isRefreshing: same && result.rev !== rev,
    refetch: () => setNonce((n) => n + 1),
  };
}
