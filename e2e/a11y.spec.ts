import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { open } from './helpers';
import { SCREENS } from './manifest';

/** axe on every screen (wcag2a/aa, 2.1 AA, 2.2 AA): fail on serious or critical, log moderate (tech §12.3). */
test.describe('accessibility', () => {
  for (const sc of SCREENS) {
    test(`${sc.zone} · ${sc.slug}`, async ({ page }) => {
      await open(page, sc.route, sc.as ? { as: sc.as } : {});
      await expect(page.locator('h1').first()).toBeVisible();
      // Let anchored smooth scrolls and scroll-linked landings settle before measuring contrast.
      await page.waitForTimeout(sc.zone === 'public' ? 2200 : 900);
      // The axe package types a different playwright-core Page; the runtime object is the same.
      const r = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      const moderate = r.violations.filter((v) => v.impact === 'moderate');
      if (moderate.length) console.log(`[a11y moderate] ${sc.slug}: ${moderate.map((v) => v.id).join(', ')}`);
      expect(bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }
});
