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

const PROFILE = '/nv/cai-dat/ho-so';
const chip = (page: Page) => page.getByRole('button', { name: /^Tài khoản của/ });

async function signInAs(page: Page, username: string, password: string) {
  await page.evaluate(async () => { await (window as unknown as { __lesonDemo: { logout(): Promise<void> } }).__lesonDemo.logout(); });
  await page.evaluate(() => { location.hash = '/dang-nhap/nhan-vien'; });
  await page.getByLabel('Tên đăng nhập').fill(username);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
}

test.describe('profile', () => {
  test('shows who you are; the title cannot be edited', async ({ page }) => {
    await openStaff(page, PROFILE, 'bacsi_mai');
    const m = main(page);
    await expect(m.getByRole('heading', { level: 1, name: 'Hồ sơ của tôi' })).toBeVisible();
    await expect(m.getByText('bacsi_mai', { exact: true })).toBeVisible();
    await expect(m.getByText('Chỉ Quản lý sửa được chức danh.')).toBeVisible();
    await expect(m.getByLabel('Chức danh')).toHaveCount(0);
  });

  test('renames yourself and the new name shows in the account menu and after a reload', async ({ page }) => {
    await openStaff(page, PROFILE, 'bacsi_mai');
    const m = main(page);
    await m.getByLabel('Tên hiển thị').fill('Bác sĩ Mai Linh');
    await m.getByRole('button', { name: 'Lưu tên' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã lưu tên.' })).toBeVisible();
    await expect(chip(page)).toHaveAttribute('aria-label', 'Tài khoản của Bác sĩ Mai Linh');
    await page.reload();
    await expect(main(page).getByLabel('Tên hiển thị')).toHaveValue('Bác sĩ Mai Linh');
  });

  test('a blank name is refused under the field', async ({ page }) => {
    await openStaff(page, PROFILE, 'bacsi_mai');
    const m = main(page);
    await m.getByLabel('Tên hiển thị').fill('   ');
    await m.getByRole('button', { name: 'Lưu tên' }).click();
    await expect(m.getByText('Vui lòng nhập tên hiển thị.')).toBeVisible();
  });

  test('each password mistake lands on its own field and nothing changes', async ({ page }) => {
    await openStaff(page, PROFILE, 'bacsi_mai');
    const m = main(page);
    const field = (label: string) => m.getByLabel(label, { exact: true });
    const box = (label: string) => m.locator('[data-field]').filter({ has: page.getByLabel(label, { exact: true }) });
    const send = () => m.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();

    await field('Mật khẩu hiện tại').fill('sai-mat-khau');
    await field('Mật khẩu mới').fill('mat-khau-moi-123');
    await field('Nhập lại mật khẩu mới').fill('mat-khau-moi-123');
    await send();
    await expect(box('Mật khẩu hiện tại')).toContainText('Mật khẩu hiện tại chưa đúng.');

    await field('Mật khẩu hiện tại').fill('leson-demo');
    await field('Mật khẩu mới').fill('leson-demo');
    await field('Nhập lại mật khẩu mới').fill('leson-demo');
    await send();
    await expect(box('Mật khẩu mới')).toContainText('Mật khẩu mới cần khác mật khẩu hiện tại.');

    await field('Mật khẩu mới').fill('mat-khau-moi-123');
    await field('Nhập lại mật khẩu mới').fill('khac-hoan-toan-1');
    await send();
    await expect(box('Nhập lại mật khẩu mới')).toContainText('Hai mật khẩu chưa khớp nhau.');

    await signInAs(page, 'bacsi_mai', 'leson-demo'); // still the old password
    await expect(page).toHaveURL(/#\/nv/);
  });

  test('a changed password works at the next sign-in and the old one does not', async ({ page }) => {
    await openStaff(page, PROFILE, 'bacsi_mai');
    const m = main(page);
    await m.getByLabel('Mật khẩu hiện tại', { exact: true }).fill('leson-demo');
    await m.getByLabel('Mật khẩu mới', { exact: true }).fill('mat-khau-moi-123');
    await m.getByLabel('Nhập lại mật khẩu mới', { exact: true }).fill('mat-khau-moi-123');
    await m.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã đổi mật khẩu.' })).toBeVisible();
    await expect(m.getByLabel('Mật khẩu hiện tại', { exact: true })).toHaveValue('');
    await signInAs(page, 'bacsi_mai', 'leson-demo');
    await expect(page).toHaveURL(/dang-nhap\/nhan-vien/);
    await signInAs(page, 'bacsi_mai', 'mat-khau-moi-123');
    await expect(page).toHaveURL(/#\/nv/);
  });

  test('the show/hide button turns the password into plain text', async ({ page }) => {
    await openStaff(page, PROFILE, 'bacsi_mai');
    const input = main(page).getByLabel('Mật khẩu mới', { exact: true });
    await expect(input).toHaveAttribute('type', 'password');
    await main(page).locator('[data-field]').filter({ has: page.getByLabel('Mật khẩu mới', { exact: true }) }).getByRole('button', { name: 'Hiện' }).click();
    await expect(input).toHaveAttribute('type', 'text');
  });

  test('"Quyền của tôi" opens in the profile, grouped by work area', async ({ page }) => {
    await openStaff(page, '/nv', 'bacsi_mai');
    await chip(page).click();
    await page.getByRole('menuitem', { name: 'Quyền của tôi' }).click();
    await expect(page).toHaveURL(/#\/nv\/cai-dat\/ho-so$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const m = main(page);
    await expect(m.getByRole('heading', { level: 2, name: 'Quyền của tôi' })).toBeVisible();
    await expect(m.getByRole('heading', { level: 3, name: 'Nội trú' })).toBeVisible();
    await expect(m.getByText('Xem lịch hẹn')).toBeVisible();
    await expect(m.getByText('Xem doanh thu')).toHaveCount(0);
  });

  test('has no accessibility violations @a11y', async ({ page }) => {
    await openStaff(page, PROFILE, 'quanly_ha');
    const results = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).analyze();
    expect(results.violations).toEqual([]);
  });

  test('fits the device width @narrow', async ({ page }) => {
    await openStaff(page, PROFILE, 'quanly_ha');
    await fitsDevice(page);
  });
});

test.describe('stock rights', () => {
  const buttons = ['Nhập thêm', 'Xuất ra', 'Kiểm kê', 'Sửa thông tin', 'Ngừng dùng'];
  for (const user of ['bacsi_mai', 'spa_ngocanh']) {
    test(`${user} sees the stock but no writing button`, async ({ page }) => {
      await openStaff(page, '/nv/kho/stock-1', user);
      await expect(main(page).locator('[class*="bigQty"]')).toBeVisible();
      for (const name of buttons) await expect(main(page).getByRole('button', { name, exact: true })).toHaveCount(0);
      await openStaff(page, '/nv/kho', user);
      await expect(main(page).getByRole('button', { name: 'Thêm món' })).toHaveCount(0);
    });
  }
  test('the manager has all five buttons and can add an item', async ({ page }) => {
    await openStaff(page, '/nv/kho/stock-1', 'quanly_ha');
    for (const name of buttons) await expect(main(page).getByRole('button', { name, exact: true })).toBeVisible();
    await openStaff(page, '/nv/kho', 'quanly_ha');
    await expect(main(page).getByRole('button', { name: 'Thêm món' })).toBeVisible();
  });
});
