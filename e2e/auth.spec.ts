import { expect, test, type Page } from '@playwright/test';
import { open } from './helpers';

const card = (page: Page) => page.locator('[data-auth-card]');

test.describe('login portal', () => {
  test('staff credentials on the customer tab land in the staff zone', async ({ page }) => {
    await open(page, '/dang-nhap');
    await card(page).getByLabel('Số điện thoại hoặc tên đăng nhập').fill('quanly_ha');
    await card(page).getByLabel('Mật khẩu', { exact: true }).fill('leson-demo');
    await card(page).getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page).toHaveURL(/#\/nv$/);
  });

  test('a customer goes to the page they came for', async ({ page }) => {
    await open(page, '/khach-hang/hoa-don');
    await expect(page).toHaveURL(/#\/dang-nhap\?tiep=/);
    await expect(page.getByText('Bạn đăng nhập để tiếp tục nhé.')).toBeVisible();
    await card(page).getByLabel('Số điện thoại hoặc tên đăng nhập').fill('lan_nguyen');
    await card(page).getByLabel('Mật khẩu', { exact: true }).fill('leson-demo');
    await card(page).getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page).toHaveURL(/#\/khach-hang\/hoa-don$/);
  });

  test('wrong password shows the generic error and keeps the identifier', async ({ page }) => {
    await open(page, '/dang-nhap');
    await card(page).getByLabel('Số điện thoại hoặc tên đăng nhập').fill('lan_nguyen');
    await card(page).getByLabel('Mật khẩu', { exact: true }).fill('sai-mat-khau');
    await card(page).getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(card(page).getByRole('alert')).toHaveText('Thông tin đăng nhập chưa đúng. Bạn kiểm tra lại rồi thử lần nữa nhé.');
    await expect(card(page).getByLabel('Số điện thoại hoặc tên đăng nhập')).toHaveValue('lan_nguyen');
  });

  test('empty fields get their own gentle message', async ({ page }) => {
    await open(page, '/dang-nhap');
    await card(page).getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(card(page).getByRole('alert')).toHaveText('Bạn nhập số điện thoại hoặc tên đăng nhập.');
  });

  test('a demo chip fills both fields without submitting', async ({ page }) => {
    await open(page, '/dang-nhap');
    await page.getByRole('button', { name: /Chị Lan/ }).click();
    await expect(card(page).getByLabel('Số điện thoại hoặc tên đăng nhập')).toHaveValue('lan_nguyen');
    await expect(card(page).getByLabel('Mật khẩu', { exact: true })).toHaveValue('leson-demo');
    await expect(card(page).getByRole('button', { name: 'Đăng nhập', exact: true })).toBeFocused();
    await expect(page).toHaveURL(/#\/dang-nhap$/);
  });

  test('the staff tab follows the URL and shows only staff chips', async ({ page }) => {
    await open(page, '/dang-nhap');
    await page.getByRole('tab', { name: 'Nhân viên' }).click();
    await expect(page).toHaveURL(/#\/dang-nhap\/nhan-vien$/);
    await expect(card(page).getByLabel('Tên đăng nhập')).toBeVisible();
    await expect(page.getByRole('button', { name: /Quản lý/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Chị Lan/ })).toHaveCount(0);
  });

  test('the password can be shown and hidden', async ({ page }) => {
    await open(page, '/dang-nhap');
    const pw = card(page).getByLabel('Mật khẩu', { exact: true });
    await expect(pw).toHaveAttribute('type', 'password');
    await card(page).getByRole('button', { name: 'Hiện' }).click();
    await expect(pw).toHaveAttribute('type', 'text');
    await expect(card(page).getByRole('button', { name: 'Ẩn' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('forgot password explains how to get help', async ({ page }) => {
    await open(page, '/dang-nhap');
    await card(page).getByRole('link', { name: 'Quên mật khẩu?' }).click();
    await expect(page.getByRole('heading', { name: 'Quên mật khẩu?' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Gọi 097 355 51 05/ })).toHaveAttribute('href', 'tel:+84973555105');
    await expect(page.getByText('Lê Sơn không bao giờ hỏi mật khẩu của bạn.')).toBeVisible();
    await page.getByRole('link', { name: 'Quay lại đăng nhập' }).click();
    await expect(page).toHaveURL(/#\/dang-nhap$/);
  });
});

test.describe('sign-up', () => {
  async function fillSignup(page: Page, username: string) {
    const c = card(page);
    await c.getByLabel('Họ và tên').fill('Hoàng Minh');
    await c.getByLabel('Số điện thoại').fill('0388 123 456');
    await c.getByLabel('Tên đăng nhập').fill(username);
    await c.getByLabel('Mật khẩu', { exact: true }).fill('banh-bao-2030');
    await c.getByLabel('Nhập lại mật khẩu').fill('banh-bao-2030');
    await c.getByRole('checkbox').check();
  }

  test('password hints are visible under the password field', async ({ page }) => {
    await open(page, '/dang-ky');
    await expect(card(page).getByText('Ít nhất 8 ký tự. Một cụm từ dễ nhớ với bạn là lựa chọn tốt.')).toBeVisible();
  });

  test('the name suggests a username without diacritics', async ({ page }) => {
    await open(page, '/dang-ky');
    await card(page).getByLabel('Họ và tên').fill('Nguyễn Thị Lan');
    await card(page).getByRole('button', { name: /Gợi ý: nguyenthilan/ }).click();
    await expect(card(page).getByLabel('Tên đăng nhập')).toHaveValue('nguyenthilan');
  });

  test('a phone-like username shows the locked message', async ({ page }) => {
    await open(page, '/dang-ky');
    await fillSignup(page, '0912345678');
    await card(page).getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await expect(card(page).getByText('Tên đăng nhập không được giống số điện thoại. Bạn thêm ít nhất một chữ cái nhé.')).toBeVisible();
  });

  test('success lands in the customer zone with a welcome toast', async ({ page }) => {
    await open(page, '/dang-ky');
    await fillSignup(page, 'HoangMinh');
    await expect(card(page).getByLabel('Tên đăng nhập')).toHaveValue('hoangminh');
    await card(page).getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await expect(page).toHaveURL(/#\/khach-hang$/);
    await expect(page.getByText('Đã tạo tài khoản. Chào mừng bạn đến với Lê Sơn!')).toBeVisible();
  });
});

test('logout returns to home with the toast', async ({ page }) => {
  await open(page, '/', { as: 'lan_nguyen' });
  await page.getByRole('button', { name: /Tài khoản của Nguyễn Thị Lan/ }).click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByText('Bạn đã đăng xuất. Hẹn gặp lại bạn và bé!')).toBeVisible();
});
