import type { AppSettingsValues } from '../contracts/staff';
import { DEFAULT_SETTINGS } from '../rules/app-settings';
import type { Doc } from './store/schema';

/** The saved settings over the defaults; a missing row or key is the default, and the version then reads 1. */
export function readSettings(t: Readonly<Doc['t']>): { version: number; values: AppSettingsValues } {
  const row = t.app_settings.find((r) => r.id === 'main');
  return { version: row?.version ?? 1, values: { ...DEFAULT_SETTINGS, ...row?.values, payment_methods: [...(row?.values.payment_methods ?? DEFAULT_SETTINGS.payment_methods)] } };
}
