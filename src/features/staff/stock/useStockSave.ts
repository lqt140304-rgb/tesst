import { useState } from 'react';
import { ConflictError, ValidationError } from '@/data/contracts/errors';
import { useToast } from '@/ui';
import { saveError } from '../ui';

/**
 * What every stock dialog does on Save: stop on errors found beforehand, run the write, then toast and close.
 * A stale version (another tab saved first) toasts the standard message and closes; the page has already reloaded itself.
 * A refusal from the rules lands under the box it names.
 */
export function useStockSave(onClose: () => void) {
  const toast = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  /** `found` are the errors the form already knows; `work` writes and returns the success message. */
  async function save(found: Record<string, string>, work: () => Promise<string>) {
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      toast({ message: await work() });
      onClose();
    } catch (e) {
      if (e instanceof ConflictError) { toast({ tone: 'error', message: saveError(e) }); onClose(); return; }
      setErrors(e instanceof ValidationError ? e.fields : { form: saveError(e) });
    } finally {
      setBusy(false);
    }
  }
  /** Drop the message of a box the person just changed, so it never sits next to the live preview that contradicts it. */
  const clear = (...keys: string[]) => setErrors((e) => (keys.some((k) => k in e) ? Object.fromEntries(Object.entries(e).filter(([k]) => !keys.includes(k))) : e));
  return { errors, busy, save, clear };
}
