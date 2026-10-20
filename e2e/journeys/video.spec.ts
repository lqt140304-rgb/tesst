import { expect, test } from '@playwright/test';
import { open } from '../helpers';

/** Journey 3 (adapted, R25): the seeded spa draft V3 → the doctor shares it after two checks → the owner plays it muted. */
test('a doctor shares the spa draft video and the owner plays it muted', async ({ page, context }) => {
  const customerTab = await context.newPage();
  await open(customerTab, '/khach-hang/noi-tru/stay-NT-0041', { as: 'lan_nguyen' });
  await customerTab.getByRole('tab', { name: /Video/ }).click();
  await expect(customerTab.locator('[data-video-card]')).toHaveCount(2);

  await open(page, '/nv/noi-tru/stay-NT-0041', { as: 'bacsi_mai' });
  await page.getByRole('tab', { name: /Video/ }).click();
  const draft = page.locator('[data-staff-video]', { hasText: 'Miu chợp mắt sau bữa ăn' });
  await expect(draft.getByText('Bản nháp')).toBeVisible();
  await draft.getByRole('button', { name: 'Chia sẻ…' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Chia sẻ', exact: true }).click();
  await expect(dialog.getByText('Vui lòng kiểm tra đủ hai mục trước khi chia sẻ.')).toBeVisible();
  await dialog.getByLabel('Video không có người hay thú cưng của khách khác').check();
  await dialog.getByLabel('Không thấy tên thuốc, y lệnh hay giấy tờ nội bộ').check();
  await dialog.getByRole('button', { name: 'Chia sẻ', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Đã chia sẻ video với chủ nuôi.' })).toBeVisible();

  await expect(customerTab.locator('[data-video-card]')).toHaveCount(3);
  await customerTab.locator('[data-video-card]').first().getByRole('button').first().click();
  expect(await customerTab.getByRole('dialog').locator('video').evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
});
