import { expect, test } from '@playwright/test';
import { open, addService } from './helpers';

/** Review Focus 1: a stale staff form gets the conflict message and the latest data, never overwrites another tab. */
test('a draft saved in another tab is not overwritten by a stale editor', async ({ page, context }) => {
  const other = await context.newPage();
  await open(page, '/nv/hoa-don/inv-28', { as: 'quanly_ha' });
  await open(other, '/nv/hoa-don/inv-28', { as: 'quanly_ha' });
  await expect(page.getByRole('heading', { name: /Lập hóa đơn/ })).toBeVisible();

  await addService(other, 'cắt móng', /Thêm Cắt móng/);
  await other.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(other.getByRole('status').filter({ hasText: 'Đã lưu hóa đơn nháp.' })).toBeVisible();

  await page.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(page.getByText('Mục này vừa được người khác cập nhật. Đã tải thông tin mới nhất — vui lòng kiểm tra lại.')).toBeVisible();
  await expect(page.locator('[data-line]', { hasText: 'Cắt móng' })).toBeVisible();
  await other.reload();
  await expect(other.locator('[data-line]', { hasText: 'Cắt móng' })).toBeVisible();
});

test('a stale reschedule form does not overwrite a newer time', async ({ page, context }) => {
  const other = await context.newPage();
  await open(page, '/nv/lich-hen', { as: 'quanly_ha' });
  await page.locator('[data-appointment]').filter({ visible: true }).first().click();
  await page.getByRole('button', { name: 'Đổi lịch', exact: true }).click();
  const pet = await page.locator('[data-detail] h2').first().innerText();

  await open(other, '/nv/lich-hen', { as: 'quanly_ha' });
  await other.locator('[data-appointment]', { hasText: pet }).filter({ visible: true }).first().click();
  await other.getByRole('button', { name: 'Đổi lịch', exact: true }).click();
  await other.locator('[data-detail]').getByLabel('Giờ mới').fill('18:30');
  await other.locator('[data-detail]').getByRole('button', { name: 'Lưu giờ mới' }).click();
  await expect(other.getByRole('status').filter({ hasText: /Đã dời lịch sang 18:30/ })).toBeVisible();

  await page.locator('[data-detail]').getByLabel('Giờ mới').fill('19:30');
  await page.locator('[data-detail]').getByRole('button', { name: 'Lưu giờ mới' }).click();
  await expect(page.locator('[data-detail]').getByText(/Mục này vừa được người khác cập nhật/)).toBeVisible();
});
