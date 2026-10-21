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
    await dlg.getByLabel('Cân nặng (kg)').fill('0');
    await dlg.getByRole('button', { name: 'Lưu thú cưng' }).click();
    await expect(dlg.getByText(/Cân nặng chưa đúng/)).toBeVisible();
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

test.describe('customer info card and edit', () => {
  test('the record shows an info card and edits it', async ({ page }) => {
    await openCustomer(page, 'nguyen thi lan');
    const info = main(page).locator('[data-customer-info]');
    await expect(info).toContainText('Nguyễn Thị Lan');
    await info.getByRole('button', { name: 'Chỉnh sửa' }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByLabel('Địa chỉ').fill('12 Phố Mới, Hà Nội');
    await dlg.getByRole('button', { name: 'Lưu hồ sơ' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã lưu hồ sơ.' })).toBeVisible();
    await expect(info).toContainText('12 Phố Mới');
  });

  test('editing with a stale version says so and shows the newer data', async ({ page, context }) => {
    await openCustomer(page, 'nguyen thi lan');
    await main(page).locator('[data-customer-info]').getByRole('button', { name: 'Chỉnh sửa' }).click();
    const dlgA = page.getByRole('dialog');
    await expect(dlgA.getByLabel('Địa chỉ')).toBeVisible();

    const other = await context.newPage();
    await openCustomer(other, 'nguyen thi lan');
    await main(other).locator('[data-customer-info]').getByRole('button', { name: 'Chỉnh sửa' }).click();
    await other.getByRole('dialog').getByLabel('Địa chỉ').fill('Địa chỉ của tab B');
    await other.getByRole('dialog').getByRole('button', { name: 'Lưu hồ sơ' }).click();
    await expect(other.getByRole('status').filter({ hasText: 'Đã lưu hồ sơ.' })).toBeVisible();

    await dlgA.getByLabel('Địa chỉ').fill('Địa chỉ của tab A');
    await dlgA.getByRole('button', { name: 'Lưu hồ sơ' }).click();
    await expect(page.getByText(/vừa được người khác cập nhật/)).toBeVisible();
    await expect(main(page).locator('[data-customer-info]')).toContainText('Địa chỉ của tab B');
    await expect(main(page).locator('[data-customer-info]')).not.toContainText('Địa chỉ của tab A');
  });

  test("a phone used by another customer warns and still saves; the customer's own number does not warn", async ({ page }) => {
    await openStaff(page, '/nv/khach-hang', 'quanly_ha');
    await main(page).getByRole('searchbox', { name: 'Tìm khách hàng' }).fill('pham thu thuy');
    const otherPhone = (await main(page).locator('[data-row]').first().locator('.num').first().innerText()).trim();
    await main(page).getByRole('searchbox', { name: 'Tìm khách hàng' }).fill('nguyen thi lan');
    await main(page).locator('[data-row]').first().click();
    await main(page).locator('[data-customer-info]').getByRole('button', { name: 'Chỉnh sửa' }).click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.getByLabel('Số điện thoại')).toBeVisible();
    await expect(dlg.getByText('Đã có hồ sơ dùng số này')).toHaveCount(0);
    await dlg.getByLabel('Số điện thoại').fill(otherPhone);
    await expect(dlg.getByText('Đã có hồ sơ dùng số này')).toBeVisible();
    await expect(dlg.getByRole('link', { name: /Phạm Thu Thủy/ })).toBeVisible();
    await dlg.getByRole('button', { name: 'Lưu hồ sơ' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã lưu hồ sơ.' })).toBeVisible();
    await expect(main(page).locator('[data-customer-info]')).toContainText(otherPhone);
  });

  test('a bad phone shows the field error and keeps what was typed', async ({ page }) => {
    await openCustomer(page, 'nguyen thi lan');
    await main(page).locator('[data-customer-info]').getByRole('button', { name: 'Chỉnh sửa' }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByLabel('Số điện thoại').fill('abc');
    await dlg.getByRole('button', { name: 'Lưu hồ sơ' }).click();
    await expect(dlg.getByLabel('Số điện thoại')).toHaveAttribute('aria-invalid', 'true');
    await expect(dlg.getByLabel('Số điện thoại')).toHaveValue('abc');
    await expect(dlg).toBeVisible();
  });

  test('Spa has no edit button on the card', async ({ page }) => {
    await openCustomer(page, 'nguyen thi lan', 'spa_ngocanh');
    const info = main(page).locator('[data-customer-info]');
    await expect(info).toContainText('Nguyễn Thị Lan');
    await expect(info.getByRole('button', { name: 'Chỉnh sửa' })).toHaveCount(0);
  });

  test('phones: the record fits and the info card sits above the tabs @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await openCustomer(page, 'nguyen thi lan');
    const info = await main(page).locator('[data-customer-info]').boundingBox();
    const tabs = await main(page).getByRole('tablist').boundingBox();
    expect(info && tabs && info.y < tabs.y).toBe(true);
    await fitsDevice(page);
  });

  test('desktop: the info card sits beside the tabs in two columns', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1100, 'wide screens only');
    await openCustomer(page, 'nguyen thi lan');
    const info = await main(page).locator('[data-customer-info]').boundingBox();
    const tabs = await main(page).getByRole('tablist').boundingBox();
    expect(info && tabs && info.x < tabs.x && Math.abs(info.y - tabs.y) < 80).toBe(true);
  });
});

test.describe('interaction history', () => {
  test('the history tab lists contacts newest first with their icons and links', async ({ page }) => {
    await openCustomer(page, 'nguyen thi lan');
    await main(page).getByRole('tab', { name: /Lịch sử tương tác/ }).click();
    const rows = main(page).locator('[data-interaction]');
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThan(1);
    expect(await rows.count()).toBeLessThanOrEqual(50);
    const times = await rows.evaluateAll((els) => els.map((e) => Date.parse((e.querySelector('time') as HTMLTimeElement).dateTime)));
    expect(times).toEqual([...times].sort((a, b) => b - a));
    await expect(rows.filter({ hasText: /HD-\d+/ }).first().getByRole('link')).toBeVisible();
  });

  test('Spa sees no invoice or payment rows in the history', async ({ page }) => {
    await openCustomer(page, 'nguyen thi lan', 'spa_ngocanh');
    await main(page).getByRole('tab', { name: /Lịch sử tương tác/ }).click();
    const rows = main(page).locator('[data-interaction]');
    await expect(rows.filter({ hasText: 'Tạo hồ sơ' })).toHaveCount(1);
    await expect(rows.filter({ hasText: /HD-\d+/ })).toHaveCount(0);
    await expect(rows.filter({ hasText: /^Thu / })).toHaveCount(0);
  });

  test('a brand-new customer shows exactly one line: the record being created', async ({ page }) => {
    await openStaff(page, '/nv/khach-hang', 'quanly_ha');
    await main(page).getByRole('button', { name: 'Thêm khách hàng' }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByLabel('Họ tên').fill('Lê Văn Lịch');
    await dlg.getByLabel('Số điện thoại').fill('0987 222 333');
    await dlg.getByRole('button', { name: 'Lưu hồ sơ' }).click();
    await expect(main(page).getByRole('heading', { level: 1, name: 'Lê Văn Lịch' })).toBeVisible();
    await main(page).getByRole('tab', { name: /Lịch sử tương tác/ }).click();
    const rows = main(page).locator('[data-interaction]');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Tạo hồ sơ');
  });
});

test.describe('final review fixes', () => {
  test('every tab stays reachable at 1100 px, where the record has two columns', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1100, 'wide screens only');
    await page.setViewportSize({ width: 1100, height: 900 });
    await openCustomer(page, 'nguyen thi lan');
    const list = main(page).getByRole('tablist');
    const last = main(page).getByRole('tab', { name: /Lịch sử tương tác/ });
    await expect(last).toBeVisible();
    const [l, t] = [await list.boundingBox(), await last.boundingBox()];
    expect(l && t && t.x + t.width <= l.x + l.width + 1).toBe(true);
  });

  test('the open tab is a labelled tab panel', async ({ page }) => {
    await openCustomer(page, 'nguyen thi lan');
    await main(page).getByRole('tab', { name: /Lịch sử tương tác/ }).click();
    await expect(main(page).getByRole('tabpanel', { name: /Lịch sử tương tác/ })).toBeVisible();
  });

  test('an appointment row in the history opens that day on the calendar', async ({ page }) => {
    await openCustomer(page, 'nguyen thi lan');
    await main(page).getByRole('tab', { name: /Lịch sử tương tác/ }).click();
    const link = main(page).locator('[data-interaction][data-kind="appointment"]').first().getByRole('link');
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/#\/nv\/lich-hen\?.*lich=/);
  });

  test('adding a customer with a phone that is already used warns and still saves', async ({ page }) => {
    await openStaff(page, '/nv/khach-hang', 'quanly_ha');
    await main(page).getByRole('searchbox', { name: 'Tìm khách hàng' }).fill('pham thu thuy');
    const phone = (await main(page).locator('[data-row]').first().locator('.num').first().innerText()).trim();
    await main(page).getByRole('button', { name: 'Thêm khách hàng' }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByLabel('Họ tên').fill('Hoàng Trùng Số');
    await dlg.getByLabel('Số điện thoại').fill(phone);
    await expect(dlg.getByText('Đã có hồ sơ dùng số này')).toBeVisible();
    await dlg.getByRole('button', { name: 'Lưu hồ sơ' }).click();
    await expect(main(page).getByRole('heading', { level: 1, name: 'Hoàng Trùng Số' })).toBeVisible();
  });
});
