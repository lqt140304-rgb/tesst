import { expect, test, type Page } from '@playwright/test';
import { open } from './helpers';

/** Scroll so the services stage's top sits at `frac` of the viewport height (1 = bottom edge). */
async function stageAt(page: Page, frac: number) {
  await page.evaluate(async (f) => {
    const stage = document.querySelector<HTMLElement>('[data-services-stage]')!;
    const y = stage.getBoundingClientRect().top + window.scrollY - window.innerHeight * f;
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 400));
  }, frac);
}
/** Drawn fraction of the orbit line (pathLength 1): the first dash length; no dash pattern at all = the whole line. */
const drawn = (page: Page) => page.locator('[data-orbit-line]').evaluate((el) => {
  const v = el.getAttribute('stroke-dasharray') || getComputedStyle(el).strokeDasharray;
  return !v || v === 'none' ? 1 : parseFloat(v.split(/[ ,]+/)[0] ?? '0');
});
const landed = (page: Page) => page.locator('[data-service-card]').evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)));

test.describe('Giới thiệu → Dịch vụ', () => {
  test('@desktop-only the orbit draws with the scroll and the cards land on it in order', async ({ page }) => {
    await open(page, '/');
    await page.waitForTimeout(1200);
    await stageAt(page, 0.7);
    const mid = await drawn(page);
    expect(mid).toBeGreaterThan(0.05);
    expect(mid).toBeLessThan(0.95);
    const midCards = await landed(page);
    expect(midCards[0]).toBeGreaterThan(0.95);
    expect(midCards[3]).toBeLessThan(0.5);
    await stageAt(page, 0.15);
    expect(await drawn(page)).toBeGreaterThan(0.99);
    expect((await landed(page)).every((o) => o > 0.99)).toBe(true);
    const paws = page.locator('[data-orbit-paw]');
    await expect(paws).toHaveCount(3);
    expect((await paws.evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)))).every((o) => o > 0.99)).toBe(true);
    await stageAt(page, 0.95);
    expect(await drawn(page)).toBeLessThan(0.05);
  });

  test('@motion-reduced reduced motion: the orbit and cards are simply in place', async ({ page }) => {
    await open(page, '/');
    await page.waitForTimeout(800);
    expect(await drawn(page)).toBeGreaterThan(0.99);
    expect((await landed(page)).every((o) => o > 0.99)).toBe(true);
  });
});
