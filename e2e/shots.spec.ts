import { test } from '@playwright/test';
import { open } from './helpers';
import { SCREENS } from './manifest';

/** Owner review pack (tech §12.3): runs only with SHOTS=1 (npm run shots), fixed clock, hero paused, animations off. */
test.describe('review shots', () => {
  test.skip(!process.env.SHOTS, 'only for npm run shots');
  for (const sc of SCREENS) {
    test(`${sc.zone}__${sc.slug}`, async ({ page }, info) => {
      await open(page, '/');
      await page.evaluate(async () => {
        const d = (window as unknown as { __lesonDemo: { setNow(iso: string | null): void; reset(): Promise<void> } }).__lesonDemo;
        d.setNow('2026-10-19T09:00:00+07:00');
        await d.reset();
      });
      await open(page, sc.route, sc.as ? { as: sc.as } : {});
      await page.waitForTimeout(1500);
      const pause = page.locator('.motion-toggle');
      if (sc.route === '/' && await pause.isVisible()) await pause.click();
      await page.screenshot({ path: `review/shots/${info.project.name}/${sc.zone}__${sc.slug}.png`, fullPage: true, animations: 'disabled' });
    });
  }
});
