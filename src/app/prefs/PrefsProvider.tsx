import { MotionConfig } from 'motion/react';
import { ForceReducedMotion } from '@/ui/motion';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { staff, type AppSettingsValues, type StaffPrefs, type StaffPrefsPatch } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { DEFAULT_SETTINGS } from '@/data/rules/app-settings';
import type { Cap } from '@/data/rules/capabilities';
import { defaultPrefs } from '@/data/rules/staff-prefs';
import { useSession } from '../session/SessionProvider';
import { appearanceAttrs, mergePrefs, revertPatch } from './prefsView';

type PrefsValue = {
  prefs: StaffPrefs; ready: boolean;
  /** Shows the new value at once; if the API refuses, puts the old one back and throws the API's error. */
  save(patch: StaffPrefsPatch): Promise<void>;
  reset(): Promise<void>;
};

const FALLBACK = defaultPrefs(new Set<Cap>());
const Ctx = createContext<{ prefs: PrefsValue; settings: AppSettingsValues }>({
  prefs: { prefs: FALLBACK, ready: false, save: () => Promise.resolve(), reset: () => Promise.resolve() }, settings: DEFAULT_SETTINGS,
});

/**
 * The signed-in staff member's personal options and the system settings, read once and kept fresh when the store changes.
 * Outside the staff zone there are none: the defaults stay, and the appearance attributes are not on the page.
 */
export function PrefsProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const staffId = session?.kind === 'staff' ? session.staffId : null;
  const prefsQ = useQuery(() => (staffId ? staff.prefs.get() : Promise.resolve(null)), [staffId]);
  const settingsQ = useQuery(() => (staffId ? staff.settings.get() : Promise.resolve(null)), [staffId]);

  // What the person just chose shows at once. It gives way to a fresh read, but never while a save is still on its way
  // (that read would not have the newest choice yet).
  const [local, setLocal] = useState<{ staffId: string; prefs: StaffPrefs } | null>(null);
  const [pending, setPending] = useState(0);
  const [seen, setSeen] = useState<StaffPrefs | null | undefined>(undefined);
  if (prefsQ.data !== seen) { setSeen(prefsQ.data); if (pending === 0) setLocal(null); }

  const fetched = staffId ? prefsQ.data : null;
  const prefs = (local && local.staffId === staffId ? local.prefs : fetched) ?? FALLBACK;
  const ready = !!staffId && (!!fetched || local?.staffId === staffId);

  // Saves go one after another, so the store ends on the last click even though each write takes a random while.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const save = useCallback(async (patch: StaffPrefsPatch) => {
    if (!staffId) return;
    const before = prefs;
    setLocal((cur) => ({ staffId, prefs: mergePrefs(cur && cur.staffId === staffId ? cur.prefs : before, patch) }));
    setPending((n) => n + 1);
    const run = queue.current.then(() => staff.prefs.save(patch));
    queue.current = run.catch(() => undefined);
    try {
      await run;
    } catch (e) {
      setLocal((cur) => ({ staffId, prefs: revertPatch(cur && cur.staffId === staffId ? cur.prefs : before, before, patch) }));
      throw e;
    } finally {
      setPending((n) => n - 1);
    }
  }, [staffId, prefs]);

  const reset = useCallback(async () => {
    if (!staffId) return;
    setLocal({ staffId, prefs: await staff.prefs.reset() });
  }, [staffId]);

  useEffect(() => {
    if (!staffId) return;
    const root = document.documentElement;
    const attrs = appearanceAttrs(prefs);
    for (const [k, v] of Object.entries(attrs)) root.setAttribute(k, v);
    return () => { for (const k of Object.keys(attrs)) root.removeAttribute(k); };
  }, [staffId, prefs]);

  const value = useMemo(() => ({
    prefs: { prefs, ready, save, reset }, settings: (staffId && settingsQ.data?.values) || DEFAULT_SETTINGS,
  }), [prefs, ready, save, reset, staffId, settingsQ.data]);
  const forced = staffId !== null && prefs.motion === 'reduced';
  return (
    <Ctx.Provider value={value}>
      <ForceReducedMotion.Provider value={forced}>
        <MotionConfig reducedMotion={forced ? 'always' : 'user'}>{children}</MotionConfig>
      </ForceReducedMotion.Provider>
    </Ctx.Provider>
  );
}

export const usePrefs = (): PrefsValue => useContext(Ctx).prefs;
export const usePageSize = (): number => useContext(Ctx).prefs.prefs.page_size;
/** The system settings; the old fixed values until they are read, and again if reading fails. */
export const useAppSettings = (): AppSettingsValues => useContext(Ctx).settings;
