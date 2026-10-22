import { useState } from 'react';
import { ConflictError, ValidationError } from '@/data/contracts/errors';
import { useToast } from '@/ui';
import { saveError } from '../ui';

export type Errors = Record<string, string>;

/**
 * What every form in Cài đặt does on Save: run the write, toast the success message it returns.
 * A refusal from the rules lands under the box it names, anything else in `form`.
 * A stale version (another tab saved first) toasts the standard message and lets the caller reload or close.
 */
export function useSave(onConflict?: () => void) {
  const toast = useToast();
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  /** `found` are the errors the form already knows; resolves to whether the write went through. */
  async function save(work: () => Promise<string>, found: Errors = {}): Promise<boolean> {
    setErrors(found);
    if (Object.keys(found).length) return false;
    setBusy(true);
    try {
      toast({ message: await work() });
      return true;
    } catch (e) {
      if (e instanceof ConflictError) { toast({ tone: 'error', message: saveError(e) }); onConflict?.(); return false; }
      setErrors(e instanceof ValidationError ? e.fields : { form: saveError(e) });
      return false;
    } finally {
      setBusy(false);
    }
  }
  /** Drop the message of a box the person just changed. */
  const clear = (...keys: string[]) => setErrors((e) => (keys.some((k) => k in e) ? Object.fromEntries(Object.entries(e).filter(([k]) => !keys.includes(k))) : e));
  return { errors, busy, save, clear };
}
