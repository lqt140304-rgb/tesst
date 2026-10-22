import { expect, test, type Page } from '@playwright/test';
import { openStaff, staffMain as main } from './helpers';
import { fitsDevice } from './width';

const toast = (page: Page, text: string | RegExp) => page.getByRole('status').filter({ hasText: text });

async function openAdd(page: Page, as = 'quanly_ha') {
  await openStaff(page, '/nv/bang-gia', as);
  await main(page).getByRole('button', { name: 'Thêm dịch vụ' }).click();
  return page.getByRole('dialog');
}
async function findRow(page: Page, query: string, text: string) {
  await main(page).getByRole('searchbox', { name: 'Tìm trong bảng giá' }).fill(query);
  return main(page).locator('[data-row]', { hasText: text });
}

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

test.describe('add and edit a service', () => {
  test('add a fixed-price service: it gets a code and shows in the table', async ({ page }) => {
    const dlg = await openAdd(page);
    await dlg.getByLabel('Nhóm', { exact: true }).selectOption({ label: 'Spa & Grooming' });
    await dlg.getByLabel('Tên', { exact: true }).fill('Tắm sấy thỏ');
    await dlg.getByLabel('Đơn vị', { exact: true }).fill('lần');
    await dlg.getByLabel('Giá (₫)').fill('120.000');
    await expect(dlg.getByText(/Tắm sấy thỏ · 120\.000\s₫ \/ lần/)).toBeVisible();
    await dlg.getByRole('button', { name: 'Lưu dịch vụ' }).click();
    await expect(toast(page, /Đã thêm dịch vụ [A-Z]{2}\d+\./)).toBeVisible();
    const row = await findRow(page, 'tam say tho', 'Tắm sấy thỏ');
    await expect(row).toContainText('120.000');
  });

  test('add an open-price service with a suggestion', async ({ page }) => {
    const dlg = await openAdd(page);
    await dlg.getByLabel('Nhóm', { exact: true }).selectOption({ label: 'Vật tư' });
    await dlg.getByLabel('Tên', { exact: true }).fill('Dây dắt');
    await dlg.getByLabel('Đơn vị', { exact: true }).fill('cái');
    await dlg.getByRole('radio', { name: 'Nhập khi lập hóa đơn' }).click();
    await expect(dlg.getByLabel('Giá (₫)')).toHaveCount(0);
    await dlg.getByLabel('Giá gợi ý (₫)').fill('50.000');
    await dlg.getByRole('button', { name: 'Lưu dịch vụ' }).click();
    await expect(toast(page, /Đã thêm dịch vụ/)).toBeVisible();
    const row = await findRow(page, 'day dat', 'Dây dắt');
    await expect(row).toContainText('Nhập khi lập hóa đơn');
    await expect(row).toContainText('gợi ý 50.000');
  });

  test('field errors stay under the field and keep what was typed', async ({ page }) => {
    const dlg = await openAdd(page);
    await dlg.getByLabel('Đơn vị', { exact: true }).fill('lần');
    await dlg.getByLabel('Giá (₫)').fill('abc');
    await dlg.getByRole('button', { name: 'Lưu dịch vụ' }).click();
    await expect(dlg.getByText('Vui lòng nhập tên mục.')).toBeVisible();
    await expect(dlg.getByText('Giá cần là số từ 1 ₫ trở lên.')).toBeVisible();
    await expect(dlg.getByLabel('Đơn vị', { exact: true })).toHaveValue('lần');
    await dlg.getByLabel('Tên', { exact: true }).fill('Dịch vụ thử');
    await dlg.getByLabel('Giá (₫)').fill('1.500.000');
    await dlg.getByRole('button', { name: 'Lưu dịch vụ' }).click();
    await expect(toast(page, /Đã thêm dịch vụ/)).toBeVisible();
  });

  test('edit a price: the group is fixed and the note says old invoices stay', async ({ page }) => {
    await openStaff(page, '/nv/bang-gia', 'quanly_ha');
    await main(page).getByRole('button', { name: 'Sửa Khám lâm sàng' }).click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.getByRole('heading', { name: 'Sửa dịch vụ' })).toBeVisible();
    await expect(dlg.getByText('Nhóm không đổi được')).toBeVisible();
    await expect(dlg.getByText('Giá mới chỉ áp dụng cho hóa đơn lập sau. Hóa đơn cũ giữ nguyên.')).toBeVisible();
    await expect(dlg.getByLabel('Giá (₫)')).toHaveValue('150.000');
    await dlg.getByLabel('Giá (₫)').fill('160.000');
    await dlg.getByRole('button', { name: 'Lưu dịch vụ' }).click();
    await expect(toast(page, 'Đã lưu dịch vụ KB01.')).toBeVisible();
    await expect(await findRow(page, 'kham lam sang', 'Khám lâm sàng')).toContainText('160.000');
  });

  test('group rules: medicine shows the fixed note, exam offers the choice', async ({ page }) => {
    const dlg = await openAdd(page);
    await dlg.getByLabel('Nhóm', { exact: true }).selectOption({ label: 'Thuốc' });
    await expect(dlg.getByText('Khách thấy gộp trong “Thuốc và vật tư điều trị”.')).toBeVisible();
    await expect(dlg.getByRole('radio', { name: 'Từng dòng' })).toHaveCount(0);
    await dlg.getByLabel('Nhóm', { exact: true }).selectOption({ label: 'Khám và điều trị' });
    await expect(dlg.getByRole('radio', { name: 'Từng dòng' })).toBeVisible();
    await expect(dlg.getByRole('radio', { name: 'Thuốc và vật tư điều trị' })).toBeVisible();
  });

  test('day items stay fixed-price', async ({ page }) => {
    await openStaff(page, '/nv/bang-gia', 'quanly_ha');
    await findRow(page, 'noi tru meo', 'Nội trú mèo');
    await main(page).getByRole('button', { name: 'Sửa Nội trú mèo' }).click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.getByText('Mục tính tiền nội trú không đổi sang nhập giá.')).toBeVisible();
    await expect(dlg.getByRole('radio', { name: 'Nhập khi lập hóa đơn' })).toHaveCount(0);
  });

  test('a stale form does not overwrite another change', async ({ page, context }) => {
    await openStaff(page, '/nv/bang-gia', 'quanly_ha');
    await main(page).getByRole('button', { name: 'Sửa Tái khám' }).click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.getByLabel('Giá (₫)')).toHaveValue('100.000');
    const other = await context.newPage();
    await openStaff(other, '/nv/bang-gia', 'quanly_ha');
    await other.locator('[data-zone="staff"] main').getByRole('button', { name: 'Sửa Tái khám' }).click();
    await other.getByRole('dialog').getByLabel('Giá (₫)').fill('110.000');
    await other.getByRole('dialog').getByRole('button', { name: 'Lưu dịch vụ' }).click();
    await expect(toast(other, 'Đã lưu dịch vụ KB02.')).toBeVisible();

    await dlg.getByLabel('Giá (₫)').fill('105.000');
    await dlg.getByRole('button', { name: 'Lưu dịch vụ' }).click();
    await expect(page.getByText(/vừa được người khác cập nhật/)).toBeVisible();
    await expect(dlg).toHaveCount(0);
    await expect(await findRow(page, 'tai kham', 'Tái khám')).toContainText('110.000');
  });

  test('an open dialog survives changes made elsewhere', async ({ page, context }) => {
    const dlg = await openAdd(page);
    await dlg.getByLabel('Tên', { exact: true }).fill('Dịch vụ đang gõ');
    const other = await openAdd(await context.newPage());
    await other.getByLabel('Tên', { exact: true }).fill('Dịch vụ của tab B');
    await other.getByLabel('Đơn vị', { exact: true }).fill('lần');
    await other.getByLabel('Giá (₫)').fill('10.000');
    await other.getByRole('button', { name: 'Lưu dịch vụ' }).click();
    await page.waitForTimeout(800);
    await expect(dlg.getByLabel('Tên', { exact: true })).toHaveValue('Dịch vụ đang gõ');
  });

  test('Spa and the doctor cannot add or edit', async ({ page }) => {
    await openStaff(page, '/nv/bang-gia', 'spa_ngocanh');
    await expect(main(page).locator('[data-row]').first()).toBeVisible();
    await expect(main(page).getByRole('button', { name: 'Thêm dịch vụ' })).toHaveCount(0);
    await expect(main(page).getByRole('button', { name: /^Sửa/ })).toHaveCount(0);
  });
});

test.describe('switch a service off and on', () => {
  test('ask first, then the service leaves the active list and can come back', async ({ page }) => {
    await openStaff(page, '/nv/bang-gia', 'quanly_ha');
    const row = await findRow(page, 'cham soc tang cuong', 'Chăm sóc tăng cường');
    await row.getByRole('button', { name: 'Ngừng dùng Chăm sóc tăng cường' }).click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.getByText(/Dịch vụ sẽ không thêm được vào hóa đơn mới/)).toBeVisible();
    await expect(dlg.getByText(/Hóa đơn nháp đang có dịch vụ này vẫn lưu được/)).toBeVisible();
    await dlg.getByRole('button', { name: 'Giữ lại' }).click();
    await expect(dlg).toHaveCount(0);
    await expect(row).toContainText('Đang dùng');

    await row.getByRole('button', { name: 'Ngừng dùng Chăm sóc tăng cường' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Ngừng dùng', exact: true }).click();
    await expect(toast(page, 'Đã ngừng dùng Chăm sóc tăng cường.')).toBeVisible();
    await expect(main(page).locator('[data-row]')).toHaveCount(0);
    await expect(main(page).getByRole('radio', { name: /^Ngừng dùng \(1\)/ })).toBeVisible();
    await main(page).getByRole('radio', { name: /^Ngừng dùng/ }).click();
    const off = main(page).locator('[data-row]', { hasText: 'Chăm sóc tăng cường' });
    await expect(off).toContainText('Ngừng dùng');
    await off.getByRole('button', { name: 'Dùng lại Chăm sóc tăng cường' }).click();
    await expect(toast(page, 'Đã dùng lại Chăm sóc tăng cường.')).toBeVisible();
    await expect(main(page).getByRole('radio', { name: /^Ngừng dùng \(0\)/ })).toBeVisible();
  });

  test('day items cannot be switched off and say why', async ({ page }) => {
    await openStaff(page, '/nv/bang-gia', 'quanly_ha');
    const row = await findRow(page, 'noi tru meo', 'Nội trú mèo');
    await expect(row.getByRole('button', { name: 'Ngừng dùng Nội trú mèo' })).toBeDisabled();
    await expect(row).toContainText('Mục tính tiền nội trú, không tắt được.');
  });

  test('a stale row does not overwrite another change', async ({ page, context }) => {
    await openStaff(page, '/nv/bang-gia', 'quanly_ha');
    await main(page).getByRole('button', { name: 'Ngừng dùng Tái khám' }).click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.getByRole('button', { name: 'Ngừng dùng', exact: true })).toBeVisible();
    const other = await context.newPage();
    await openStaff(other, '/nv/bang-gia', 'quanly_ha');
    await other.locator('[data-zone="staff"] main').getByRole('button', { name: 'Sửa Tái khám' }).click();
    await other.getByRole('dialog').getByLabel('Giá (₫)').fill('110.000');
    await other.getByRole('dialog').getByRole('button', { name: 'Lưu dịch vụ' }).click();
    await expect(toast(other, 'Đã lưu dịch vụ KB02.')).toBeVisible();
    await dlg.getByRole('button', { name: 'Ngừng dùng', exact: true }).click();
    await expect(page.getByText(/vừa được người khác cập nhật/)).toBeVisible();
    await expect(dlg).toHaveCount(0);
    await expect(main(page).locator('[data-row]', { hasText: 'Tái khám' })).toContainText('Đang dùng');
  });

  test('the edit dialog has the switch too', async ({ page }) => {
    await openStaff(page, '/nv/bang-gia', 'quanly_ha');
    await main(page).getByRole('button', { name: 'Sửa Tái khám' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Ngừng dùng dịch vụ này' }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Ngừng dùng Tái khám?' })).toBeVisible();
  });
});
