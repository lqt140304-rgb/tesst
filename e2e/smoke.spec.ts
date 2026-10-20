import { expect, test } from '@playwright/test';
import { noHorizontalScroll, open, trackErrors } from './helpers';
import { SCREENS } from './manifest';

/** One case per screen: h1 visible, no console or page errors, no sideways scroll (tech §12.2). */
test.describe('smoke', () => {
  for (const sc of SCREENS) {
    test(`${sc.zone} · ${sc.slug}`, async ({ page }) => {
      const errors = trackErrors(page);
      await open(page, sc.route, sc.as ? { as: sc.as } : {});
      await expect(page.locator('h1').first()).toBeVisible();
      await page.waitForTimeout(400);
      await noHorizontalScroll(page);
      expect(errors).toEqual([]);
    });
  }
});
