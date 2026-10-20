import { expect, test } from '@playwright/test';
import { open } from '../helpers';

/** Journey 4: a doctor issues an invoice → the manager records cash → the customer sees "Đã thanh toán" and opens the print preview. */
test('doctor issues, manager collects, customer sees it paid', async ({ page, context }) => {
  await open(page, '/nv/hoa-don/moi?khach=cus-01&be=pet-miu', { as: 'bacsi_duc' });
  await page.getByRole('button', { name: 'Tạo hóa đơn nháp' }).click();
  await page.getByRole('searchbox', { name: 'Tìm trong bảng giá' }).fill('tái khám');
  await page.getByRole('button', { name: /Thêm Tái khám/ }).click();
  await page.getByRole('button', { name: 'Phát hành hóa đơn' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Phát hành' }).click();
  const toast = page.getByRole('status').filter({ hasText: /Đã phát hành hóa đơn (HD-\d+)/ });
  await expect(toast).toBeVisible();
  const code = (await toast.innerText()).match(/HD-\d+/)![0];
  const route = new URL(page.url()).hash.slice(1);

  await open(page, route, { as: 'quanly_ha' });
  await page.getByRole('button', { name: 'Ghi nhận thanh toán' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận đã nhận tiền' }).click();
  await expect(page.getByRole('status').filter({ hasText: /Đã ghi nhận 100\.000\s₫ bằng tiền mặt\./ })).toBeVisible();

  const customerTab = await context.newPage();
  await open(customerTab, '/khach-hang/hoa-don', { as: 'lan_nguyen' });
  const row = customerTab.locator('[data-invoice-row]', { hasText: code });
  await expect(row.getByText('Đã thanh toán')).toBeVisible();
  await row.click();
  await customerTab.getByRole('link', { name: 'In hóa đơn' }).click();
  await expect(customerTab.locator('[data-sheet="a5"]')).toContainText(code);
});
