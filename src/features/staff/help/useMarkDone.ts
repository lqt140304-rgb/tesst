import { useCallback, useEffect } from 'react';
import { useSession } from '@/app/session/SessionProvider';
import { staff } from '@/data/staff';

/** What was already sent in this page session: a person doing the same thing twice is marked once. */
const sent = new Set<string>();

/**
 * Marks one of the "first tasks" as done at the moment the person really does it.
 * Never in the way: a key that is not on the person's list, or any failure, is swallowed.
 */
export function useMarkDone(): (key: string) => void {
  const { session } = useSession();
  const staffId = session?.kind === 'staff' ? session.staffId : null;
  return useCallback((key: string) => {
    if (!staffId) return;
    const id = `${staffId}:${key}`;
    if (sent.has(id)) return;
    sent.add(id);
    void staff.help.markDone(key).catch(() => undefined);
  }, [staffId]);
}

/** For a task that is just "opening this screen". */
export function useMarkOnMount(key: string): void {
  const mark = useMarkDone();
  useEffect(() => { mark(key); }, [mark, key]);
}
