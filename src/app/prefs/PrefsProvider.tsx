import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { staff, type AppSettingsValues, type StaffPrefs, type StaffPrefsPatch } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { DEFAULT_SETTINGS } from '@/data/rules/app-settings';
import type { Cap } from '@/data/rules/capabilities';
import { defaultPrefs } from '@/data/rules/staff-prefs';
import { useSession } from '../session/SessionProvider';
import { appearanceAttrs } from './prefsView';

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

const merge = (p: StaffPrefs, patch: StaffPrefsPatch): StaffPrefs => ({ ...p, ...patch, nudges: { ...p.nudges, ...patch.nudges } });

/**
 * The signed-in staff member's personal options and the system settings, read once and kept fresh when the store changes.
 * Outside the staff zone there are none: the defaults stay, and the appearance attributes are not on the page.
 */
export function PrefsProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const staffId = session?.kind === 'staff' ? session.staffId : null;
  const prefsQ = useQuery(() => (staffId ? staff.prefs.get() : Promise.resolve(null)), [staffId]);
  const settingsQ = useQuery(() => (staffId ? staff.settings.get() : Promise.resolve(null)), [staffId]);

  // What the person just chose shows at once; it gives way as soon as a fresh read arrives (also when another tab changed it).
  const [local, setLocal] = useState<{ staffId: string; prefs: StaffPrefs } | null>(null);
  const [seen, setSeen] = useState<StaffPrefs | null | undefined>(undefined);
  if (prefsQ.data !== seen) { setSeen(prefsQ.data); setLocal(null); }

  const fetched = staffId ? prefsQ.data : null;
  const prefs = (local && local.staffId === staffId ? local.prefs : fetched) ?? FALLBACK;
  const ready = !!staffId && (!!fetched || local?.staffId === staffId);

  const save = useCallback(async (patch: StaffPrefsPatch) => {
    if (!staffId) return;
    const before = prefs;
    setLocal({ staffId, prefs: merge(before, patch) });
    try {
      const next = await staff.prefs.save(patch);
      setLocal({ staffId, prefs: next });
    } catch (e) {
      setLocal({ staffId, prefs: before });
      throw e;
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
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const usePrefs = (): PrefsValue => useContext(Ctx).prefs;
export const usePageSize = (): number => useContext(Ctx).prefs.prefs.page_size;
/** The system settings; the old fixed values until they are read, and again if reading fails. */
export const useAppSettings = (): AppSettingsValues => useContext(Ctx).settings;
