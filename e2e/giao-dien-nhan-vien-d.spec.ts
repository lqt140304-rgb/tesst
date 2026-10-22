import { expect, test } from '@playwright/test';
import { openStaff, staffMain as main } from './helpers';
import { fitsDevice } from './width';

test.describe('price list', () => {
  test('a paged table filtered to the active items by default, read-only for a doctor', async ({ page }) => {
    await openStaff(page, '/nv/bang-gia', 'bacsi_mai');
    await expect(main(page).getByText('Giá trong bản demo là giá minh họa, chưa phải giá thật của bệnh viện.')).toBeVisible();
    await expect(main(page).getByRole('table')).toBeVisible();
    expect(await main(page).locator('[data-row]').count()).toBeLessThanOrEqual(10);
    await expect(main(page).getByRole('navigation', { name: 'Phân trang' })).toBeVisible();
    await expect(main(page).getByRole('radio', { name: /^Đang dùng/ })).toBeChecked();
    await expect(main(page).getByRole('radio', { name: /^Ngừng dùng \(0\)/ })).toBeVisible();
    await expect(main(page).getByRole('button', { name: /^Sửa/ })).toHaveCount(0);
    await expect(main(page).getByRole('button', { name: 'Thêm dịch vụ' })).toHaveCount(0);
    const row = main(page).locator('[data-row]', { hasText: 'Khám lâm sàng' });
    await expect(row).toBeVisible();
    await expect(row).toContainText('150.000');
  });

  test('search and category filters combine; an empty result can be cleared', async ({ page }) => {
    await openStaff(page, '/nv/bang-gia', 'bacsi_mai');
    const search = main(page).getByRole('searchbox', { name: 'Tìm trong bảng giá' });
    await search.fill('tam say');
    const rows = main(page).locator('[data-row]');
    await expect(rows.first()).toContainText('Tắm sấy');
    for (const text of await rows.allInnerTexts()) expect(text).toContain('Tắm sấy');
    await search.fill('');
    await main(page).getByRole('radio', { name: /^Nội trú/ }).click();
    await expect(main(page).locator('[data-row]')).toHaveCount(4);
    await main(page).getByLabel('Lọc theo nhóm dịch vụ').getByRole('radio', { name: /^Tất cả/ }).click();
    await search.fill('xyz');
    await expect(main(page).getByText('Không tìm thấy dịch vụ phù hợp.')).toBeVisible();
    await main(page).getByRole('button', { name: 'Xóa bộ lọc' }).click();
    await expect(search).toHaveValue('');
    await expect(main(page).locator('[data-row]').first()).toBeVisible();
  });

  test('open-price items show their hint and day items say what they are for', async ({ page }) => {
    await openStaff(page, '/nv/bang-gia', 'bacsi_mai');
    await main(page).getByRole('searchbox', { name: 'Tìm trong bảng giá' }).fill('thu thuat');
    const open = main(page).locator('[data-row]', { hasText: 'Thủ thuật theo chỉ định' });
    await expect(open).toContainText('Nhập khi lập hóa đơn');
    await expect(open).toContainText('gợi ý 200.000');
    await main(page).getByRole('searchbox', { name: 'Tìm trong bảng giá' }).fill('noi tru meo');
    await expect(main(page).locator('[data-row]', { hasText: 'Nội trú mèo' })).toContainText('Dùng để tính tiền nội trú');
  });

  test('phones: the table turns into cards and fits the width @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await openStaff(page, '/nv/bang-gia', 'bacsi_mai');
    await expect(main(page).locator('[data-row]').first()).toBeVisible();
    await fitsDevice(page);
  });
});
