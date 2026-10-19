import { expect, test } from '@playwright/test';
import { open } from './helpers';

test.describe('guards and routing', () => {
  test('guest opening the customer zone goes to login with tiep', async ({ page }) => {
    await open(page, '/khach-hang');
    await expect(page).toHaveURL(/#\/dang-nhap\?tiep=%2Fkhach-hang$/);
  });
  test('guest opening the staff zone goes to the staff login', async ({ page }) => {
    await open(page, '/nv/hoa-don');
    await expect(page).toHaveURL(/#\/dang-nhap\/nhan-vien\?tiep=%2Fnv%2Fhoa-don$/);
  });
  test('a customer opening the staff zone lands in the customer zone', async ({ page }) => {
    await open(page, '/nv', { as: 'lan_nguyen' });
    await expect(page).toHaveURL(/#\/khach-hang$/);
  });
  test('staff opening the customer zone lands in the staff zone', async ({ page }) => {
    await open(page, '/khach-hang', { as: 'quanly_ha' });
    await expect(page).toHaveURL(/#\/nv$/);
  });
  test('alias token resolves; unknown route shows not found', async ({ page }) => {
    await open(page, 'nv-noi-tru');
    await expect(page).toHaveURL(/#\/dang-nhap\/nhan-vien\?tiep=%2Fnv%2Fnoi-tru$/);
    await open(page, '/khong-co-trang-nay');
    await expect(page.getByRole('heading', { name: 'Không tìm thấy trang này' })).toBeVisible();
  });
});
