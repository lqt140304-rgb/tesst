import { expect, test } from '@playwright/test';
import { open } from '../helpers';

/** Journey 1: a customer books → staff starts contact and confirms → the customer sees "Đã xác nhận" (two tabs). */
test('customer books, staff confirms, customer sees it confirmed', async ({ page, context }) => {
  await open(page, '/khach-hang/dat-lich', { as: 'lan_nguyen' });
  const form = page.locator('#form-dat-lich');
  await form.getByRole('radio', { name: /Miu/ }).click();
  await form.getByRole('radio', { name: /Spa & Grooming/ }).click();
  await form.getByLabel('Ngày bạn mong muốn').fill('2030-02-10');
  const consent = form.getByRole('checkbox', { name: /Tôi đồng ý/ });
  if (await consent.count()) await consent.check();
  await form.getByRole('button', { name: 'Gửi yêu cầu' }).click();
  await expect(page.getByRole('heading', { name: 'Lê Sơn đã nhận yêu cầu của bạn' })).toBeVisible();

  const staffTab = await context.newPage();
  await open(staffTab, '/nv/yeu-cau', { as: 'quanly_ha' });
  const nv = staffTab.locator('[data-zone="staff"] main');
  await nv.getByRole('searchbox', { name: 'Tìm yêu cầu' }).fill('Miu');
  await nv.locator('[data-request-card]', { hasText: 'Chờ xác nhận' }).first().click();
  const detail = nv.locator('[data-request-detail]');
  await detail.getByRole('button', { name: 'Bắt đầu liên hệ' }).click();
  await detail.getByRole('button', { name: 'Xác nhận lịch hẹn…' }).click();
  const tomorrow = await staffTab.evaluate(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(Date.now() + 864e5)));
  const dialog = staffTab.getByRole('dialog');
  await dialog.getByLabel('Ngày hẹn').fill(tomorrow);
  await dialog.getByLabel('Giờ hẹn').fill('15:30');
  await dialog.getByRole('radio', { name: /Chọn hồ sơ có sẵn: Nguyễn Thị Lan/ }).check();
  await dialog.getByRole('button', { name: 'Xác nhận và đưa vào lịch' }).click();
  await expect(staffTab.getByRole('status').filter({ hasText: /Đã xác nhận lịch hẹn lúc 15:30/ })).toBeVisible();

  await page.evaluate(() => { location.hash = '/khach-hang/lich-hen'; });
  const kh = page.locator('[data-zone="customer"] main');
  const row = kh.locator('[data-booking-row]', { hasText: 'Spa & Grooming · bé Miu' }).first();
  await expect(row).toBeVisible();
  await row.click();
  await expect(kh.locator('[data-detail]').getByText(/Hẹn gặp bạn và bé Miu lúc 15:30/)).toBeVisible();
});
