import { DEFAULT_SETTINGS } from '../../rules/app-settings';
import type { SeedCtx } from './ctx';

/** One row with the demo defaults (not hospital figures). */
export function seedSettings(c: SeedCtx) {
  c.doc.t.app_settings.push({ id: 'main', version: 1, values: { ...DEFAULT_SETTINGS, payment_methods: [...DEFAULT_SETTINGS.payment_methods], holidays: [] } });
}
