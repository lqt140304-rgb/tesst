import { expect, test } from '@playwright/test';
import { open } from '../helpers';

/** Journey 2: sign up → read the link code → staff links by code → invoices and inpatient unlock in the customer tab. */
test('a new account is linked at the counter and unlocks inpatient and invoices', async ({ page, context }) => {
  await open(page, '/dang-ky');
  const card = page.locator('[data-auth-card]');
  await card.getByLabel('Họ và tên').fill('Hoàng Văn Nam');
  await card.getByLabel('Số điện thoại').fill('090 000 00 05');
  await card.getByLabel('Tên đăng nhập').fill('nam_hoang');
  await card.getByLabel('Mật khẩu', { exact: true }).fill('lu-ve-nha-2030');
  await card.getByLabel('Nhập lại mật khẩu').fill('lu-ve-nha-2030');
  await card.getByRole('checkbox').check();
  await card.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(page).toHaveURL(/#\/khach-hang$/);
  await page.evaluate(() => { location.hash = '/khach-hang/noi-tru'; });
  await expect(page.getByText(/sau khi liên kết hồ sơ/).first()).toBeVisible();
  const code = (await page.locator('[id^="code-LS-"]').first().innerText()).trim();
  expect(code).toMatch(/^LS-[A-Z0-9]{4}$/);

  const staffTab = await context.newPage();
  await open(staffTab, '/nv/tai-khoan-web', { as: 'quanly_ha' });
  await staffTab.getByRole('button', { name: 'Liên kết bằng mã…' }).click();
  const dialog = staffTab.getByRole('dialog');
  await dialog.getByLabel('Mã kết nối khách đưa cho bạn').fill(code);
  await dialog.getByRole('button', { name: 'Tìm tài khoản' }).click();
  await dialog.getByRole('radio', { name: /Hoàng Văn Nam · KH-0005/ }).check();
  await dialog.getByLabel('Tôi đã đối chiếu người đến quầy đúng là chủ của hồ sơ này.').check();
  await dialog.getByRole('button', { name: 'Liên kết tài khoản' }).click();
  await expect(staffTab.getByRole('status').filter({ hasText: 'Đã liên kết tài khoản nam_hoang với hồ sơ KH-0005.' })).toBeVisible();

  const kh = page.locator('[data-zone="customer"] main');
  await expect(kh.getByText(/Lu/).first()).toBeVisible();
  await page.evaluate(() => { location.hash = '/khach-hang/hoa-don'; });
  await expect(page.getByRole('heading', { name: 'Hóa đơn', level: 1 })).toBeVisible();
  await expect(kh.getByText(/sau khi liên kết hồ sơ/)).toHaveCount(0);
});
