import { expect, test, type Page } from '@playwright/test';
import { openStaff, staffMain as main } from './helpers';
import { fitsDevice } from './width';

test.describe('customer list', () => {
  test('a paged table with pet photos; accent-free search; a row opens the record', async ({ page }) => {
    await openStaff(page, '/nv/khach-hang', 'quanly_ha');
    await expect(main(page).getByRole('table')).toBeVisible();
    expect(await main(page).locator('[data-row]').count()).toBeLessThanOrEqual(10);
    await expect(main(page).getByRole('navigation', { name: 'Phân trang' })).toBeVisible();
    await main(page).getByRole('searchbox', { name: 'Tìm khách hàng' }).fill('nguyen thi lan');
    await expect(main(page).locator('[data-row]')).toHaveCount(1);
    await expect(main(page).locator('[data-row]').first().locator('[data-pet-avatar]').first()).toBeVisible();
    await main(page).locator('[data-row]').first().click();
    await expect(page).toHaveURL(/#\/nv\/khach-hang\/[^/]+$/);
  });

  test('the "Còn nợ" filter shows only customers with an amount owed', async ({ page }) => {
    await openStaff(page, '/nv/khach-hang', 'quanly_ha');
    await main(page).getByRole('radio', { name: 'Còn nợ' }).click();
    expect(await main(page).locator('[data-row]').count()).toBeGreaterThan(0);
    await expect(main(page).locator('[data-row]').filter({ hasNotText: '₫' })).toHaveCount(0);
  });

  test('phones: the table turns into cards and fits @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await openStaff(page, '/nv/khach-hang', 'quanly_ha');
    await expect(main(page).locator('[data-row]').first()).toBeVisible();
    await fitsDevice(page);
  });
});

async function openCustomer(page: Page, search: string, as = 'quanly_ha') {
  await openStaff(page, '/nv/khach-hang', as);
  await main(page).getByRole('searchbox', { name: 'Tìm khách hàng' }).fill(search);
  await main(page).locator('[data-row]').first().click();
  await expect(main(page).getByRole('heading', { level: 1 })).toBeVisible();
}

test.describe('pets on the record', () => {
  test('edit a pet: a bad weight shows at the field and keeps what was typed; a valid save shows on the card', async ({ page }) => {
    await openCustomer(page, 'nguyen thi lan');
    const card = main(page).locator('[data-pet-card]', { hasText: 'Miu' });
    await card.getByRole('button', { name: /Chỉnh sửa Miu/ }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByLabel('Cân nặng (kg)').fill('200');
    await dlg.getByRole('button', { name: 'Lưu thú cưng' }).click();
    await expect(dlg.getByText(/Cân nặng chưa đúng/)).toBeVisible();
    await expect(dlg.getByLabel('Cân nặng (kg)')).toHaveValue('200');
    await dlg.getByLabel('Cân nặng (kg)').fill('5,1');
    await dlg.getByLabel('Màu lông').fill('Tam thể');
    await dlg.getByRole('button', { name: 'Lưu thú cưng' }).click();
    await expect(dlg).toHaveCount(0);
    await expect(card).toContainText('5,1');
    await expect(card).toContainText('Tam thể');
  });

  test('alerts: left alone they stay, unticked they are cleared', async ({ page }) => {
    await openCustomer(page, 'Mập');
    const card = main(page).locator('[data-pet-card]', { hasText: 'Mập' });
    await expect(card).toContainText('Dễ hoảng sợ');
    await card.getByRole('button', { name: /Chỉnh sửa Mập/ }).click();
    let dlg = page.getByRole('dialog');
    await expect(dlg.getByRole('checkbox', { name: 'Dễ hoảng sợ' })).toBeChecked();
    await dlg.getByLabel('Màu lông').fill('Xám');
    await dlg.getByRole('button', { name: 'Lưu thú cưng' }).click();
    await expect(dlg).toHaveCount(0);
    await expect(card).toContainText('Xám');
    await expect(card).toContainText('Dễ hoảng sợ');
    await card.getByRole('button', { name: /Chỉnh sửa Mập/ }).click();
    dlg = page.getByRole('dialog');
    await expect(dlg.getByText(/Bỏ hết dấu tích sẽ xóa/)).toBeVisible();
    await dlg.getByRole('checkbox', { name: 'Dễ hoảng sợ' }).uncheck();
    await dlg.getByRole('button', { name: 'Lưu thú cưng' }).click();
    await expect(dlg).toHaveCount(0);
    await expect(card).not.toContainText('Dễ hoảng sợ');
  });

  test('an alert that is not in the usual list stays ticked, so saving does not drop it', async ({ page }) => {
    await openCustomer(page, 'Milo');
    const card = main(page).locator('[data-pet-card]', { hasText: 'Milo' });
    await card.getByRole('button', { name: /Chỉnh sửa Milo/ }).click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.getByRole('checkbox', { name: /Bệnh mãn tính: tim/ })).toBeChecked();
    await dlg.getByLabel('Màu lông').fill('Nâu');
    await dlg.getByRole('button', { name: 'Lưu thú cưng' }).click();
    await expect(dlg).toHaveCount(0);
    await expect(card).toContainText('Bệnh mãn tính: tim');
  });

  test('add a pet with the full form', async ({ page }) => {
    await openCustomer(page, 'nguyen thi lan');
    await main(page).getByRole('button', { name: 'Thêm thú cưng' }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByLabel('Tên', { exact: true }).fill('Kẹo');
    await dlg.getByLabel('Cân nặng (kg)').fill('3,5');
    await dlg.getByLabel('Màu lông').fill('Vàng kem');
    await dlg.getByRole('button', { name: 'Lưu thú cưng' }).click();
    await expect(dlg).toHaveCount(0);
    const card = main(page).locator('[data-pet-card]', { hasText: 'Kẹo' });
    await expect(card).toContainText('3,5');
    await expect(card).toContainText('Vàng kem');
  });

  test('a customer with no pets shows an empty state', async ({ page }) => {
    await openStaff(page, '/nv/khach-hang', 'quanly_ha');
    await main(page).getByRole('button', { name: 'Thêm khách hàng' }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByLabel('Họ tên').fill('Trần Văn Mới');
    await dlg.getByLabel('Số điện thoại').fill('0987 111 222');
    await dlg.getByRole('button', { name: 'Lưu hồ sơ' }).click();
    await expect(main(page).getByText('Hồ sơ chưa có thú cưng.')).toBeVisible();
  });

  test('Spa sees pets but no edit or add buttons', async ({ page }) => {
    await openCustomer(page, 'nguyen thi lan', 'spa_ngocanh');
    await expect(main(page).locator('[data-pet-card]', { hasText: 'Miu' })).toBeVisible();
    await expect(main(page).getByRole('button', { name: /Chỉnh sửa Miu/ })).toHaveCount(0);
    await expect(main(page).getByRole('button', { name: 'Thêm thú cưng' })).toHaveCount(0);
  });
});
