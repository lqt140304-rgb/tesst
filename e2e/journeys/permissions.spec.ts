import { expect, test } from '@playwright/test';
import { open } from '../helpers';

/** Journey 5: spa staff opens the revenue report directly → friendly Forbidden page; the nav item is absent. */
test('spa staff cannot reach revenue', async ({ page }) => {
  await open(page, '/nv/doanh-thu', { as: 'spa_ngocanh' });
  await expect(page.getByRole('heading', { name: 'Mục này dành cho người có quyền phù hợp' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Doanh thu/ })).toHaveCount(0);
  await page.getByRole('link', { name: 'Về Tổng quan' }).click();
  await expect(page.getByRole('heading', { name: /Chào buổi/ })).toBeVisible();
});
