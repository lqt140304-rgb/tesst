import { expect, test } from '@playwright/test';
import { openStaff, staffMain as main } from './helpers';
import { fitsDevice } from './width';

test.describe('customer list', () => {
  test('a paged table with pet photos; accent-free search; a row opens the record', async ({ page }) => {
    await openStaff(page, '/nv/khach-hang', 'quanly_ha');
    await expect(main(page).getByRole('table')).toBeVisible();
    expect(await main(page).locator('[data-row]').count()).toBeLessThanOrEqual(10);
    await expect(main(page).getByRole('navigation', { name: 'Phân trang' })).toBeVisible();
    await main(page).getByRole('searchbox', { name: 'Tìm khách hàng' }).fill('nguyen thi lan');
    await expect(main(page).locator('[data-row]')).toHaveCount(1);
    await expect(main(page).locator('[data-row]').first().locator('[data-pet-avatar]').first()).toBeVisible();
    await main(page).locator('[data-row]').first().click();
    await expect(page).toHaveURL(/#\/nv\/khach-hang\/[^/]+$/);
  });

  test('the "Còn nợ" filter shows only customers with an amount owed', async ({ page }) => {
    await openStaff(page, '/nv/khach-hang', 'quanly_ha');
    await main(page).getByRole('radio', { name: 'Còn nợ' }).click();
    expect(await main(page).locator('[data-row]').count()).toBeGreaterThan(0);
    await expect(main(page).locator('[data-row]').filter({ hasNotText: '₫' })).toHaveCount(0);
  });

  test('phones: the table turns into cards and fits @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await openStaff(page, '/nv/khach-hang', 'quanly_ha');
    await expect(main(page).locator('[data-row]').first()).toBeVisible();
    await fitsDevice(page);
  });
});
