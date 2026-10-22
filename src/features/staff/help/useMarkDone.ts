import { useCallback, useEffect } from 'react';
import { useSession } from '@/app/session/SessionProvider';
import { staff } from '@/data/staff';

/**
 * Marks one of the "first tasks" as done at the moment the person really does it.
 * Never in the way: a key that is not on the person's list, or any failure, is swallowed.
 * No memory kept here: marking what is already marked writes nothing, and a reset of the options or of the demo data must start over.
 */
export function useMarkDone(): (key: string) => void {
  const { session } = useSession();
  const staffId = session?.kind === 'staff' ? session.staffId : null;
  return useCallback((key: string) => {
    if (!staffId) return;
    void staff.help.markDone(key).catch(() => undefined);
  }, [staffId]);
}

/** For a task that is just "opening this screen". */
export function useMarkOnMount(key: string): void {
  const mark = useMarkDone();
  useEffect(() => { mark(key); }, [mark, key]);
}
