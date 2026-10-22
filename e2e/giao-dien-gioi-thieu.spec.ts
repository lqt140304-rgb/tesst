import { expect, test } from '@playwright/test';
import { open } from './helpers';

/** Part 6A: the intro page below the hero (spec 2026-10-22-phan-6). */
test.describe('khung trang', () => {
  test('the scroll thread is drawn along the page on wide screens and grows with the scroll @desktop-only', async ({ page }) => {
    await open(page, '/');
    const thread = page.locator('[data-thread]');
    await expect(thread).toBeAttached();
    const scale = () => thread.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).d);
    const before = await scale();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(400);
    expect(await scale()).toBeGreaterThan(before);
  });

  test('phones under 640 px do not draw it', async ({ page }) => {
    await open(page, '/');
    const w = page.viewportSize()!.width;
    const shown = await page.locator('[data-thread]').evaluate((el) => getComputedStyle(el).display !== 'none');
    expect(shown).toBe(w >= 640);
  });

  test('reduced motion: the thread is already full @motion-reduced', async ({ page }) => {
    await open(page, '/');
    const d = await page.locator('[data-thread]').evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).d);
    expect(d).toBe(1);
  });

  test('the menu follows the section: straight to /dich-vu and /lien-he', async ({ page }) => {
    for (const [route, name] of [['/dich-vu', 'Dịch vụ'], ['/lien-he', 'Liên hệ']] as const) {
      await open(page, route);
      await page.waitForTimeout(600);
      await expect(page.locator('nav[aria-label="Menu chính"]').first().getByRole('link', { name, includeHidden: true })).toHaveAttribute('aria-current', 'true');
    }
  });
});
