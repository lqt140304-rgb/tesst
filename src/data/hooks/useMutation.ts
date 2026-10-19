import { useCallback, useState } from 'react';

export function useMutation<A extends unknown[], R>(fn: (...a: A) => Promise<R>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const run = useCallback(async (...a: A) => {
    setPending(true);
    setError(undefined);
    try {
      return await fn(...a);
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setPending(false);
    }
  }, [fn]);
  return { run, pending, error };
}
