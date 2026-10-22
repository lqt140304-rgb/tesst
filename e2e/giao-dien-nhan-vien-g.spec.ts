import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openStaff, staffMain as main } from './helpers';
import { fitsDevice } from './width';

const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 768;
const nav = (page: Page) => page.getByRole('navigation', { name: 'Khu nhân viên' });
const subNav = (page: Page) => main(page).getByRole('navigation', { name: 'Cài đặt' });

test.describe('settings shell and hospital', () => {
  for (const user of ['quanly_ha', 'bacsi_mai', 'spa_ngocanh']) {
    test(`${user} has the Cài đặt entry`, async ({ page }) => {
      await openStaff(page, '/nv', user);
      if (wide(page)) {
        await expect(nav(page).getByRole('link', { name: 'Cài đặt' })).toBeVisible();
      } else { // phones keep the first tabs and fold the rest into the "Thêm" sheet
        await page.getByRole('button', { name: 'Thêm', exact: true }).click();
        await expect(page.getByRole('dialog').getByRole('link', { name: 'Cài đặt' })).toBeVisible();
      }
    });
  }

  test('the hospital page shows the verbatim facts and nothing editable', async ({ page }) => {
    await openStaff(page, '/nv/cai-dat/benh-vien', 'bacsi_mai');
    const m = main(page);
    await expect(m.getByRole('heading', { level: 1, name: 'Thông tin bệnh viện' })).toBeVisible();
    await expect(m.getByText('Bệnh viện Thú y Lê Sơn')).toBeVisible();
    await expect(m.getByText('101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội')).toBeVisible();
    await expect(m.getByRole('link', { name: /097 355 51 05/ })).toHaveAttribute('href', 'tel:+84973555105');
    await expect(m.getByText('08:00–21:00')).toBeVisible();
    await expect(m.getByText(/không nghỉ trưa/)).toBeVisible();
    await expect(m.getByText('Bác sĩ trưởng Lê Thái Sơn')).toBeVisible();
    await expect(m.getByText('Nội dung này chỉ để xem. Cần sửa, báo bên làm hệ thống.')).toBeVisible();
    // "24/24" belongs to the emergency line only
    const emergency = m.locator('dt:has-text("Cấp cứu") + dd');
    await expect(emergency).toContainText('24/24');
    expect(await m.getByText('24/24').count()).toBe(1);
    await expect(m.locator('input, textarea, select')).toHaveCount(0);
  });

  test('the side list offers only the pages the person may open', async ({ page }) => {
    await openStaff(page, '/nv/cai-dat/benh-vien', 'bacsi_mai');
    await expect(subNav(page).getByRole('link', { name: 'Thông tin bệnh viện' })).toHaveAttribute('aria-current', 'page');
    await expect(subNav(page).getByRole('link', { name: 'Tài khoản nhân viên' })).toHaveCount(0);
    await openStaff(page, '/nv/cai-dat/benh-vien', 'quanly_ha');
    await expect(subNav(page).getByRole('link', { name: 'Thông tin bệnh viện' })).toBeVisible();
  });

  test('the bare settings address opens a page', async ({ page }) => {
    await openStaff(page, '/nv/cai-dat', 'bacsi_mai');
    await expect(page).toHaveURL(/#\/nv\/cai-dat\/[a-z-]+$/);
    await expect(main(page).getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('has no accessibility violations @a11y', async ({ page }) => {
    await openStaff(page, '/nv/cai-dat/benh-vien', 'quanly_ha');
    const results = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).analyze();
    expect(results.violations).toEqual([]);
  });

  test('fits the device width @narrow', async ({ page }) => {
    await openStaff(page, '/nv/cai-dat/benh-vien', 'quanly_ha');
    await fitsDevice(page);
  });
});
