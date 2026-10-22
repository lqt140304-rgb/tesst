import { LANDING_PAGES, NUDGE_KEYS, type CalendarView, type LandingPage, type NudgeKey, type ReportRange } from '@/data/contracts/enums';
import type { StaffPrefs, StaffPrefsPatch } from '@/data/staff';
import type { Cap } from '@/data/rules/capabilities';
import { LANDING_NEEDS, NUDGE_NEEDS } from '@/data/rules/staff-prefs';
import { paths } from '@/app/routes';
import type { Fixed } from '@/features/staff/revenue/revenueView';

type Can = (c: Cap | Cap[]) => boolean;

const LANDING_PATH: Record<LandingPage, string> = {
  home: paths.nv.home, appointments: paths.nv.calendar, inpatient: paths.nv.board, invoices: paths.nv.invoices,
};
export const landingPath = (p: LandingPage): string => LANDING_PATH[p];

/** A kind with no right needed (home) is always open; the rest need any one of their rights. */
const open = (can: Can, needs: readonly Cap[]) => needs.length === 0 || can([...needs]);
export const landingChoices = (can: Can): LandingPage[] => LANDING_PAGES.filter((p) => open(can, LANDING_NEEDS[p]));
export const nudgeChoices = (can: Can): NudgeKey[] => NUDGE_KEYS.filter((k) => open(can, NUDGE_NEEDS[k]));

export const reportPeriod = (r: ReportRange): Fixed => r;
export const viewFromPref = (v: CalendarView): 'ngay' | 'tuan' => (v === 'day' ? 'ngay' : 'tuan');

export function appearanceAttrs(p: Pick<StaffPrefs, 'text_size' | 'density' | 'motion'>) {
  return { 'data-staff-text': p.text_size, 'data-staff-density': p.density, 'data-staff-motion': p.motion } as const;
}

/** What the person sees after choosing: the patch laid over what is shown now (nudges one by one). */
export const mergePrefs = (p: StaffPrefs, patch: StaffPrefsPatch): StaffPrefs => ({ ...p, ...patch, nudges: { ...p.nudges, ...patch.nudges } });

/** A save the API refused: put back only the keys that save touched, so a newer choice made meanwhile stays. */
export function revertPatch(shown: StaffPrefs, before: StaffPrefs, patch: StaffPrefsPatch): StaffPrefs {
  const out: StaffPrefs = { ...shown, nudges: { ...shown.nudges } };
  for (const key of Object.keys(patch) as (keyof StaffPrefsPatch)[]) {
    if (key === 'nudges') { for (const k of Object.keys(patch.nudges ?? {}) as NudgeKey[]) out.nudges[k] = before.nudges[k]; }
    else (out as Record<string, unknown>)[key] = before[key];
  }
  return out;
}
