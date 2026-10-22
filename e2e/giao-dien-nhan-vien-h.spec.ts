import { expect, test, type Page } from '@playwright/test';
import { open, openStaff } from './helpers';

const attrs = (page: Page) => page.evaluate(() => {
  const d = document.documentElement.dataset;
  return { text: d.staffText ?? null, density: d.staffDensity ?? null, motion: d.staffMotion ?? null };
});

test.describe('prefs plumbing', () => {
  test('a staff session carries the three appearance attributes, with the defaults before anything is chosen', async ({ page }) => {
    await openStaff(page, '/nv', 'bacsi_mai');
    expect(await attrs(page)).toEqual({ text: 'md', density: 'comfortable', motion: 'system' });
  });

  test('they go away on sign-out and never reach the public site or the customer zone', async ({ page }) => {
    await openStaff(page, '/nv', 'bacsi_mai');
    await page.evaluate(async () => { await (window as unknown as { __lesonDemo: { logout(): Promise<void> } }).__lesonDemo.logout(); });
    await page.evaluate(() => { location.hash = '/'; });
    await expect.poll(() => attrs(page)).toEqual({ text: null, density: null, motion: null });
    await open(page, '/khach-hang', { as: 'lan_nguyen' });
    await expect(page.locator('[data-zone="customer"] main')).toBeVisible();
    expect(await attrs(page)).toEqual({ text: null, density: null, motion: null });
  });
});
