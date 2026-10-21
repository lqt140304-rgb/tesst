import { expect, test, type Locator, type Page } from '@playwright/test';
import { open } from './helpers';
import { SCREENS } from './manifest';
import { fitsDevice } from './width';

const main = (page: Page) => page.locator('[data-zone="staff"] main');
const radius = (loc: Locator) => loc.evaluate((e) => parseFloat(getComputedStyle(e).borderTopLeftRadius));

test.describe('staff base', () => {
  test('every staff page has a breadcrumb and one h1, and fits the device @narrow', async ({ page }) => {
    for (const s of SCREENS.filter((x) => x.zone === 'staff' && !['khong-du-quyen', 'tong-quan', 'tong-quan-spa'].includes(x.slug))) {
      await open(page, s.route, { as: s.as });
      // On a phone an open request is a page of its own: the list header (and its breadcrumb) is hidden on purpose.
      if (s.slug === 'yeu-cau-chi-tiet' && (page.viewportSize()?.width ?? 0) < 768) { await fitsDevice(page); continue; }
      await expect(main(page).getByRole('navigation', { name: 'Đường dẫn' }), s.slug).toBeVisible();
      await expect(main(page).getByRole('heading', { level: 1 }), s.slug).toHaveCount(1);
      await fitsDevice(page);
    }
  });

  test('controls are squarer, cards 12 px, and the staff sidebar has no paw pattern', async ({ page }) => {
    await open(page, '/nv/hoa-don/inv-27', { as: 'quanly_ha' });
    expect(await radius(main(page).getByRole('link', { name: 'In hóa đơn' }))).toBeLessThanOrEqual(6);
    expect(await radius(main(page).locator('[class*="panel"]').first())).toBeLessThanOrEqual(12);
    expect(await page.locator('[data-zone="staff"] aside').first().evaluate((e) => getComputedStyle(e).backgroundImage)).toBe('none');
    await open(page, '/nv/hoa-don', { as: 'quanly_ha' });
    expect(await radius(main(page).getByRole('searchbox', { name: 'Tìm hóa đơn' }))).toBeLessThanOrEqual(6);
    await open(page, '/khach-hang', { as: 'lan_nguyen' });
    expect(await radius(page.locator('[data-card="pets"] section').first())).toBeLessThanOrEqual(12);
    await open(page, '/dang-nhap', {});
    expect(await radius(page.locator('form button[type="submit"]').first())).toBeLessThanOrEqual(6);
  });
});
