import { expect, test, type Page } from '@playwright/test';
import { open } from './helpers';

async function rafPerSecond(page: Page) {
  return page.evaluate(() => new Promise<number>((resolve) => {
    let n = 0;
    const orig = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => { n += 1; return orig(cb); };
    setTimeout(() => { window.requestAnimationFrame = orig; resolve(n); }, 1000);
  }));
}
const infinite = (page: Page) => page.evaluate(() => document.getAnimations().filter((a) => a.effect?.getTiming().iterations === Infinity).length);

test.describe('only the hero loops', () => {
  for (const [route, as] of [['/dang-nhap', undefined], ['/khach-hang', 'lan_nguyen'], ['/nv', 'quanly_ha'], ['/_bo-icon', undefined]] as const) {
    test(`idle ${route} has no animation loop`, async ({ page }) => {
      await open(page, route, as ? { as } : {});
      await page.waitForTimeout(2000);
      expect(await rafPerSecond(page)).toBe(0);
      expect(await infinite(page)).toBe(0);
    });
  }
  test('@motion-reduced reduced motion: hero is static and the pause button is hidden', async ({ page }) => {
    await open(page, '/');
    await page.waitForTimeout(1500);
    await expect(page.locator('.motion-toggle')).toBeHidden();
    expect(await rafPerSecond(page)).toBe(0);
  });
});
