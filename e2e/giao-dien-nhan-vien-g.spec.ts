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

const TEAM = '/nv/cai-dat/tai-khoan';
const toast = (page: Page, text: string | RegExp) => page.getByRole('status').filter({ hasText: text });
const rowOf = (page: Page, text: string | RegExp) => main(page).locator('[data-row]').filter({ hasText: text });
const dialogOf = (page: Page, name: string | RegExp) => page.getByRole('dialog', { name });
const NEW_USER = { username: 'bacsi_lan', password: 'mat-khau-123', name: 'BS. Lan Hương', title: 'Bác sĩ nội trú' };

async function openEdit(page: Page, who: string) {
  await rowOf(page, who).first().click();
  const d = dialogOf(page, 'Sửa tài khoản nhân viên');
  await expect(d).toBeVisible();
  return d;
}

test.describe('staff accounts', () => {
  test('lists the four sample accounts with role, extra rights and status', async ({ page }) => {
    await openStaff(page, TEAM, 'quanly_ha');
    await expect(main(page).getByRole('heading', { level: 1, name: 'Tài khoản nhân viên' })).toBeVisible();
    await expect(main(page).locator('[data-row]')).toHaveCount(4);
    await expect(rowOf(page, 'Nguyễn Thu Hà')).toContainText('Bạn');
    await expect(rowOf(page, 'Nguyễn Thu Hà')).toContainText('Quản lý');
    await expect(rowOf(page, 'Nguyễn Thu Hà')).toContainText('Không có');
    await expect(rowOf(page, 'bacsi_duc')).toContainText('1 quyền thêm');
    await expect(rowOf(page, 'Lê Ngọc Anh')).toContainText('Đang dùng');
    await expect(main(page).getByText(/Tài khoản tạo mới là tài khoản mẫu/)).toBeVisible();
  });

  test('a doctor cannot open the page and is not offered the link', async ({ page }) => {
    await openStaff(page, TEAM, 'bacsi_mai');
    await expect(page.getByRole('heading', { name: 'Mục này dành cho người có quyền phù hợp' })).toBeVisible();
    await expect(subNav(page).getByRole('link', { name: 'Tài khoản nhân viên' })).toHaveCount(0);
  });

  test('adds a person who can then sign in; a taken name and no role are refused under their fields', async ({ page }) => {
    await openStaff(page, TEAM, 'quanly_ha');
    await main(page).getByRole('button', { name: 'Thêm nhân viên' }).click();
    const d = dialogOf(page, 'Thêm nhân viên');
    await d.getByLabel('Tên đăng nhập').fill('bacsi_mai');
    await d.getByLabel('Mật khẩu', { exact: true }).fill(NEW_USER.password);
    await d.getByLabel('Tên hiển thị').fill(NEW_USER.name);
    await d.getByLabel('Chức danh').fill(NEW_USER.title);
    await d.getByRole('button', { name: 'Lưu tài khoản' }).click();
    await expect(d).toContainText('Tên này đã có người dùng.');
    await expect(d).toContainText('Vui lòng chọn ít nhất một vai.');
    await d.getByLabel('Tên đăng nhập').fill(NEW_USER.username);
    await d.getByRole('checkbox', { name: 'Bác sĩ', exact: true }).click();
    await d.getByRole('button', { name: 'Lưu tài khoản' }).click();
    await expect(toast(page, /Đã thêm tài khoản bacsi_lan/)).toBeVisible();
    await expect(rowOf(page, NEW_USER.name)).toContainText('Bác sĩ');
    await signInAs(page, NEW_USER.username, NEW_USER.password);
    await expect(page).toHaveURL(/#\/nv/);
  });

  test('editing shows the rights a role gives as ticked and locked; an extra right is counted', async ({ page }) => {
    await openStaff(page, TEAM, 'quanly_ha');
    const d = await openEdit(page, 'Lê Ngọc Anh');
    const seeStock = d.getByRole('checkbox', { name: /Xem kho/ });
    await expect(seeStock).toBeChecked();
    await expect(seeStock).toBeDisabled();
    await expect(d.getByText('Có theo vai').first()).toBeVisible();
    await expect(d.getByText('Quyền ghi Kho cần thêm Xem kho.')).toHaveCount(0);
    await d.getByRole('checkbox', { name: /Nhập thêm kho/ }).click();
    await d.getByRole('button', { name: 'Lưu tài khoản' }).click();
    await expect(toast(page, /Đã lưu tài khoản/)).toBeVisible();
    await expect(rowOf(page, 'Lê Ngọc Anh')).toContainText('1 quyền thêm');
  });

  test('picking another role updates the locked rights at once', async ({ page }) => {
    await openStaff(page, TEAM, 'quanly_ha');
    const d = await openEdit(page, 'Lê Ngọc Anh');
    const invoices = d.getByRole('checkbox', { name: /Lập hóa đơn/ });
    await expect(invoices).not.toBeChecked();
    await d.getByRole('checkbox', { name: 'Bác sĩ', exact: true }).click();
    await expect(invoices).toBeChecked();
    await expect(invoices).toBeDisabled();
  });

  test('resets someone else\'s password; your own row offers no such button', async ({ page }) => {
    await openStaff(page, TEAM, 'quanly_ha');
    await expect(rowOf(page, 'Nguyễn Thu Hà').getByRole('button', { name: /Đặt lại mật khẩu/ })).toHaveCount(0);
    await rowOf(page, 'bacsi_duc').getByRole('button', { name: /Đặt lại mật khẩu/ }).click();
    const d = dialogOf(page, /Đặt lại mật khẩu/);
    await expect(d.getByText('Hãy báo cho họ; họ đổi lại ở Hồ sơ của họ.')).toBeVisible();
    await d.getByLabel('Mật khẩu mới').fill('mat-khau-moi-456');
    await d.getByRole('button', { name: 'Đặt lại mật khẩu', exact: true }).click();
    await expect(toast(page, /Đã đặt lại mật khẩu/)).toBeVisible();
    await signInAs(page, 'bacsi_duc', 'mat-khau-moi-456');
    await expect(page).toHaveURL(/#\/nv/);
  });

  test('your own edit window says where your password and your switch live', async ({ page }) => {
    await openStaff(page, TEAM, 'quanly_ha');
    const d = await openEdit(page, 'Nguyễn Thu Hà');
    await expect(d.getByText('Bạn đổi mật khẩu của mình ở Hồ sơ của tôi.')).toBeVisible();
    await expect(d.getByText('Bạn không tắt được tài khoản của chính mình.')).toBeVisible();
    await expect(rowOf(page, 'Nguyễn Thu Hà').getByRole('button', { name: /Tắt tài khoản/ })).toHaveCount(0);
  });

  test('switching off asks first, stops the sign-in and goes last; switching on needs no question', async ({ page }) => {
    await openStaff(page, TEAM, 'quanly_ha');
    await rowOf(page, 'Lê Ngọc Anh').getByRole('button', { name: /Tắt tài khoản/ }).click();
    const d = dialogOf(page, /Tắt tài khoản/);
    await expect(d.getByText('Người này sẽ không đăng nhập được nữa. Lịch sử vẫn giữ tên.')).toBeVisible();
    await d.getByRole('button', { name: 'Tắt tài khoản', exact: true }).click();
    await expect(toast(page, /Đã tắt tài khoản/)).toBeVisible();
    await expect(main(page).locator('[data-row]').last()).toContainText('Lê Ngọc Anh');
    await expect(main(page).locator('[data-row]').last()).toContainText('Đã tắt');
    await signInAs(page, 'spa_ngocanh', 'leson-demo');
    await expect(page).toHaveURL(/dang-nhap\/nhan-vien/);
    await openStaff(page, TEAM, 'quanly_ha');
    await rowOf(page, 'Lê Ngọc Anh').getByRole('button', { name: /Bật lại tài khoản/ }).click();
    await expect(toast(page, /Đã bật lại tài khoản/)).toBeVisible();
    await expect(rowOf(page, 'Lê Ngọc Anh')).toContainText('Đang dùng');
  });

  test('the last manager cannot give up the manager role', async ({ page }) => {
    await openStaff(page, TEAM, 'quanly_ha');
    const d = await openEdit(page, 'Nguyễn Thu Hà');
    await d.getByRole('checkbox', { name: 'Bác sĩ', exact: true }).click();
    await d.getByRole('checkbox', { name: 'Quản lý', exact: true }).click();
    await d.getByRole('button', { name: 'Lưu tài khoản' }).click();
    await expect(d.getByText('Phải còn ít nhất một Quản lý đang dùng.')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(rowOf(page, 'Nguyễn Thu Hà')).toContainText('Quản lý');
  });

  test('a second tab that saved first wins: the late save is refused', async ({ page, context }) => {
    await openStaff(page, TEAM, 'quanly_ha');
    const d = await openEdit(page, 'Phạm Thanh Mai');
    const other = await context.newPage();
    await openStaff(other, TEAM, 'quanly_ha');
    const dB = await openEdit(other, 'Phạm Thanh Mai');
    await dB.getByLabel('Tên hiển thị').fill('BS. Mai Linh');
    await dB.getByRole('button', { name: 'Lưu tài khoản' }).click();
    await expect(toast(other, /Đã lưu tài khoản/)).toBeVisible();
    await d.getByLabel('Tên hiển thị').fill('BS. Mai Muộn');
    await d.getByRole('button', { name: 'Lưu tài khoản' }).click();
    await expect(toast(page, /vừa được người khác cập nhật/)).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(rowOf(page, 'BS. Mai Linh')).toBeVisible();
    await expect(main(page).getByText('BS. Mai Muộn')).toHaveCount(0);
  });

  test('a right granted or taken back works the next time the person opens the page', async ({ page }) => {
    const tickReports = async (on: boolean) => {
      await openStaff(page, TEAM, 'quanly_ha');
      const d = await openEdit(page, 'bacsi_duc');
      const box = d.getByRole('checkbox', { name: /Xem báo cáo vận hành/ });
      if ((await box.isChecked()) !== on) await box.click();
      await d.getByRole('button', { name: 'Lưu tài khoản' }).click();
      await expect(toast(page, /Đã lưu tài khoản/).last()).toBeVisible();
    };
    await tickReports(true);
    await openStaff(page, '/nv/bao-cao', 'bacsi_duc');
    await expect(main(page).getByRole('heading', { level: 1, name: 'Báo cáo vận hành' })).toBeVisible();
    await tickReports(false);
    await openStaff(page, '/nv/bao-cao', 'bacsi_duc');
    await expect(page.getByRole('heading', { name: 'Mục này dành cho người có quyền phù hợp' })).toBeVisible();
  });

  test('the dialog opens from the keyboard and gives the focus back', async ({ page }) => {
    await openStaff(page, TEAM, 'quanly_ha');
    const add = main(page).getByRole('button', { name: 'Thêm nhân viên' });
    await add.focus();
    await page.keyboard.press('Enter');
    await expect(dialogOf(page, 'Thêm nhân viên')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(add).toBeFocused();
  });

  test('has no accessibility violations with the edit window open @a11y', async ({ page }) => {
    await openStaff(page, TEAM, 'quanly_ha');
    await openEdit(page, 'Phạm Thanh Mai');
    const results = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).analyze();
    expect(results.violations).toEqual([]);
  });

  test('the list and the edit window fit the device width @narrow', async ({ page }) => {
    await openStaff(page, TEAM, 'quanly_ha');
    await fitsDevice(page);
    await openEdit(page, 'Phạm Thanh Mai');
    await fitsDevice(page);
    const box = await dialogOf(page, 'Sửa tài khoản nhân viên').boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });
});
