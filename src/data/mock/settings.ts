import { APP_SETTING_KEYS } from '../contracts/enums';
import type { AppSettingsPatch, AppSettingsValues } from '../contracts/staff';
import { DEFAULT_SETTINGS, applySettingsPatch, validateSettingsPatch } from '../rules/app-settings';
import type { Doc } from './store/schema';

const CALENDAR = ['calendar_start', 'calendar_end'] as const;

/**
 * The saved settings over the defaults; a missing row reads version 1. Every reader goes through here, so a damaged row
 * (no values, a wrong type, a key from another build) never crashes the staff area or blocks payments: each stored value is
 * kept only if it passes its own rule, the two calendar hours are judged as a pair, and anything else is the default.
 */
export function readSettings(t: Readonly<Doc['t']>): { version: number; values: AppSettingsValues } {
  const row = t.app_settings.find((r) => r.id === 'main');
  const stored: Record<string, unknown> = row?.values && typeof row.values === 'object' ? row.values : {};
  const good: Record<string, unknown> = {};
  for (const k of APP_SETTING_KEYS) {
    if (CALENDAR.includes(k as never) || !Object.hasOwn(stored, k)) continue;
    if (Object.keys(validateSettingsPatch({ [k]: stored[k] }, DEFAULT_SETTINGS)).length === 0) good[k] = stored[k];
  }
  const hours = {
    calendar_start: Object.hasOwn(stored, 'calendar_start') ? stored.calendar_start : DEFAULT_SETTINGS.calendar_start,
    calendar_end: Object.hasOwn(stored, 'calendar_end') ? stored.calendar_end : DEFAULT_SETTINGS.calendar_end,
  };
  if (Object.keys(validateSettingsPatch(hours, DEFAULT_SETTINGS)).length === 0) Object.assign(good, hours);
  return { version: row?.version ?? 1, values: applySettingsPatch(DEFAULT_SETTINGS, good as AppSettingsPatch) };
}
