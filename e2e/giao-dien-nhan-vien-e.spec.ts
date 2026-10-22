import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openStaff, staffMain as main, tenRowsPerPage } from './helpers';
import { fitsDevice } from './width';

const toast = (page: Page, text: string | RegExp) => page.getByRole('status').filter({ hasText: text });
const rows = (page: Page) => main(page).locator('[data-row]');
const nav = (page: Page) => page.getByRole('navigation', { name: 'Khu nhân viên' });

test.describe('stock list', () => {
  test('the manager sees the sample stock, worst first, with four summary tiles', async ({ page }) => {
    await tenRowsPerPage(page, 'quanly_ha');
    await openStaff(page, '/nv/kho', 'quanly_ha');
    await expect(main(page).getByRole('heading', { level: 1, name: 'Kho' })).toBeVisible();
    for (const name of ['Sắp hết: 3 món', 'Hết hàng: 1 món', 'Sắp hết hạn: 1 món', 'Đã hết hạn: 1 món']) {
      await expect(main(page).getByRole('button', { name })).toBeVisible();
    }
    await expect(rows(page).first()).toContainText('Thuốc nhỏ mắt (mẫu)');
    await expect(rows(page).first()).toContainText('Hết hàng');
    await expect(rows(page)).toHaveCount(10);
    await expect(main(page).getByRole('navigation', { name: 'Phân trang' })).toBeVisible();
    await expect(main(page).getByText('Vitamin tổng hợp')).toHaveCount(0);
    await expect(main(page).getByText('Dữ liệu kho trong bản demo là dữ liệu mẫu.')).toBeVisible();
  });

  test('a summary tile filters the list and a second press clears it', async ({ page }) => {
    await tenRowsPerPage(page, 'quanly_ha');
    await openStaff(page, '/nv/kho', 'quanly_ha');
    const low = main(page).getByRole('button', { name: 'Sắp hết: 3 món' });
    await low.click();
    await expect(low).toHaveAttribute('aria-pressed', 'true');
    await expect(rows(page)).toHaveCount(3);
    await low.click();
    await expect(low).toHaveAttribute('aria-pressed', 'false');
    await expect(rows(page)).toHaveCount(10);
  });

  test('both expiry tiles turn on the one expiry filter', async ({ page }) => {
    await openStaff(page, '/nv/kho', 'quanly_ha');
    await main(page).getByRole('button', { name: 'Sắp hết hạn: 1 món' }).click();
    await expect(rows(page)).toHaveCount(2);
    await expect(rows(page).filter({ hasText: 'Thuốc tẩy giun (mẫu)' })).toContainText('Sắp hết hạn');
    await expect(rows(page).filter({ hasText: 'Dung dịch sát khuẩn' })).toContainText('Đã hết hạn');
    await expect(main(page).getByRole('button', { name: 'Đã hết hạn: 1 món' })).toHaveAttribute('aria-pressed', 'true');
    await expect(main(page).getByRole('radio', { name: 'Sắp hoặc đã hết hạn' })).toBeChecked();
  });

  test('search without accents, kind filter, inactive items and an empty result', async ({ page }) => {
    await tenRowsPerPage(page, 'quanly_ha');
    await openStaff(page, '/nv/kho', 'quanly_ha');
    const search = main(page).getByRole('searchbox', { name: 'Tìm trong kho' });
    await search.fill('nuoc muoi');
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText('Nước muối sinh lý 0,9 %');
    await expect(rows(page).first()).toContainText('25 chai');
    await expect(rows(page).first()).toContainText('Ổn');
    await search.fill('');
    await main(page).getByRole('radio', { name: 'Thuốc', exact: true }).click();
    await expect(rows(page)).toHaveCount(6);
    await main(page).getByRole('radio', { name: 'Vật tư', exact: true }).click();
    await expect(rows(page)).toHaveCount(7);
    await main(page).getByRole('radio', { name: 'Tất cả', exact: true }).first().click();
    await main(page).getByRole('checkbox', { name: 'Hiện cả món đã ngừng dùng' }).click(); // the address changes a beat later, so `.check()` would judge too early
    await expect(main(page).getByRole('checkbox', { name: 'Hiện cả món đã ngừng dùng' })).toBeChecked();
    await search.fill('vitamin');
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText('Ngừng dùng');
    await search.fill('xyz');
    await expect(main(page).getByText('Chưa có món nào khớp.')).toBeVisible();
    await main(page).getByRole('button', { name: 'Bỏ lọc' }).click();
    await expect(search).toHaveValue('');
    await expect(rows(page)).toHaveCount(10);
  });

  test('the filters live in the address: a reload keeps them and a broken address falls back', async ({ page }) => {
    await tenRowsPerPage(page, 'quanly_ha');
    await openStaff(page, '/nv/kho', 'quanly_ha');
    await main(page).getByRole('button', { name: 'Hết hàng: 1 món' }).click();
    await expect(rows(page)).toHaveCount(1);
    await page.reload();
    await expect(rows(page)).toHaveCount(1);
    await expect(main(page).getByRole('button', { name: 'Hết hàng: 1 món' })).toHaveAttribute('aria-pressed', 'true');
    await openStaff(page, '/nv/kho?tt=abc&loai=x', 'quanly_ha');
    await expect(rows(page)).toHaveCount(10);
  });

  test('everyone on staff sees the Kho menu entry in the right place; only people with the write rights get the buttons (owner, 22/10)', async ({ page }) => {
    await openStaff(page, '/nv/kho', 'quanly_ha');
    if ((page.viewportSize()?.width ?? 0) >= 768) { // phones fold the menu into tabs and a "more" sheet
      const names = (await nav(page).getByRole('link').allInnerTexts()).map((t) => t.trim());
      expect(names.indexOf('Kho')).toBeGreaterThan(names.indexOf('Hóa đơn'));
      expect(names.indexOf('Kho')).toBeLessThan(names.indexOf('Bảng giá'));
    }
    await expect(main(page).getByRole('button', { name: 'Thêm món' })).toBeVisible();
    for (const as of ['bacsi_mai', 'spa_ngocanh']) {
      await openStaff(page, '/nv/kho', as);
      await expect(page.getByRole('heading', { level: 1, name: 'Kho' })).toBeVisible();
      await expect(rows(page).first()).toBeVisible();
      await expect(main(page).getByRole('button', { name: 'Thêm món' })).toHaveCount(0);
    }
  });

  test('phones: the table turns into cards and the tiles fit the width @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await openStaff(page, '/nv/kho', 'quanly_ha');
    await expect(rows(page).first()).toBeVisible();
    await fitsDevice(page);
  });

  test('no accessibility violations on the list', async ({ page }) => {
    await openStaff(page, '/nv/kho', 'quanly_ha');
    await expect(rows(page).first()).toBeVisible();
    const r = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical').map((x) => x.id)).toEqual([]);
  });
});

test.describe('stock item', () => {
  test('shows the item, its numbers and the movement history, newest first', async ({ page }) => {
    await openStaff(page, '/nv/kho/stock-1', 'quanly_ha');
    await expect(main(page).getByRole('heading', { level: 1, name: 'Nước muối sinh lý 0,9 %' })).toBeVisible();
    await expect(main(page).getByText('KHO-0001').first()).toBeVisible();
    await expect(main(page).getByLabel('Tồn hiện tại')).toContainText('25 chai');
    await expect(main(page).getByText('Ổn', { exact: true })).toBeVisible();
    const history = main(page).getByRole('table', { name: 'Lịch sử nhập xuất' });
    for (const h of ['Ngày giờ', 'Loại', 'Thay đổi', 'Tồn sau', 'Lý do', 'Ghi chú', 'Người làm']) await expect(history.getByRole('columnheader', { name: h })).toBeVisible();
    const lines = history.locator('[data-row]');
    await expect(lines).toHaveCount(4);
    await expect(lines.first()).toContainText('−8');
    await expect(lines.first()).toContainText('Dùng tại phòng khám');
    await expect(lines.last()).toContainText('+60');
    await expect(lines.last()).toContainText('Nhập hàng');
    await expect(lines.last()).toContainText('Nhà cung cấp mẫu');
  });

  test('says in plain words what is wrong with an item', async ({ page }) => {
    await openStaff(page, '/nv/kho/stock-5', 'quanly_ha');
    await expect(main(page).getByText('Đã hết hàng.')).toBeVisible();
    await openStaff(page, '/nv/kho/stock-4', 'quanly_ha');
    await expect(main(page).getByText(/^Hết hạn từ \d{2}\/\d{2}\/\d{4}\.$/)).toBeVisible();
    await openStaff(page, '/nv/kho/stock-3', 'quanly_ha');
    await expect(main(page).getByText(/^Còn \d+ ngày nữa hết hạn\.$/)).toBeVisible();
    await openStaff(page, '/nv/kho/stock-2', 'quanly_ha');
    await expect(main(page).getByText('Còn 5 túi, thấp hơn mức báo hết 10.')).toBeVisible();
  });

  test('opens from the list and goes back with the filter still on', async ({ page }) => {
    await openStaff(page, '/nv/kho', 'quanly_ha');
    await main(page).getByRole('button', { name: 'Sắp hết: 3 món' }).click();
    await expect(rows(page)).toHaveCount(3);
    await rows(page).filter({ hasText: 'Băng cuộn' }).getByRole('link', { name: 'Băng cuộn' }).click();
    await expect(main(page).getByRole('heading', { level: 1, name: 'Băng cuộn' })).toBeVisible();
    await page.goBack();
    await expect(rows(page)).toHaveCount(3);
    await main(page).getByRole('link', { name: 'Băng cuộn' }).click();
    await main(page).getByRole('navigation', { name: 'Đường dẫn' }).getByRole('link', { name: 'Kho' }).click();
    await expect(main(page).getByRole('heading', { level: 1, name: 'Kho' })).toBeVisible();
  });

  test('an unknown item gets a clear page with a way back', async ({ page }) => {
    await openStaff(page, '/nv/kho/khong-co', 'quanly_ha');
    await expect(main(page).getByText('Không tìm thấy món này')).toBeVisible();
    await main(page).getByRole('link', { name: 'Về danh sách Kho' }).click();
    await expect(main(page).getByRole('heading', { level: 1, name: 'Kho' })).toBeVisible();
  });

  test('doctor and Spa open an item by its address and see its history, with none of the write buttons (owner, 22/10)', async ({ page }) => {
    for (const as of ['bacsi_duc', 'spa_ngocanh']) {
      await openStaff(page, '/nv/kho/stock-1', as);
      await expect(main(page).getByRole('heading', { name: 'Lịch sử nhập xuất' })).toBeVisible();
      for (const name of ['Nhập thêm', 'Xuất ra', 'Kiểm kê', 'Sửa thông tin']) await expect(main(page).getByRole('button', { name })).toHaveCount(0);
    }
  });

  test('phones: the history turns into cards and fits the width @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await openStaff(page, '/nv/kho/stock-1', 'quanly_ha');
    await expect(main(page).locator('[data-row]').first()).toBeVisible();
    await fitsDevice(page);
  });
});

async function openAdd(page: Page) {
  await openStaff(page, '/nv/kho', 'quanly_ha');
  await main(page).getByRole('button', { name: 'Thêm món' }).click();
  return page.getByRole('dialog', { name: 'Thêm món' });
}
async function openEdit(page: Page, id: string) {
  await openStaff(page, `/nv/kho/${id}`, 'quanly_ha');
  await main(page).getByRole('button', { name: 'Sửa thông tin' }).click();
  return page.getByRole('dialog', { name: 'Sửa món' });
}
/** A box by its label, with or without the "(không bắt buộc)" the form adds to optional ones. */
const field = (dlg: ReturnType<Page['locator']>, label: string) => dlg.getByLabel(new RegExp(`^${label}( \\(không bắt buộc\\))?\\s*$`));

test.describe('stock add and edit', () => {
  test('adds an item: the box for the warning level starts at 5, and the new item opens', async ({ page }) => {
    const dlg = await openAdd(page);
    await expect(field(dlg, 'Mức báo hết')).toHaveValue('5');
    await field(dlg, 'Tên món').fill('Kim lấy máu (mẫu)');
    await dlg.getByRole('radio', { name: 'Vật tư' }).click();
    await field(dlg, 'Đơn vị').fill('cái');
    await field(dlg, 'Số lượng ban đầu').fill('40');
    await field(dlg, 'Mức báo hết').fill('10');
    await dlg.getByRole('button', { name: 'Lưu món' }).click();
    await expect(toast(page, 'Đã thêm món KHO-0015.')).toBeVisible();
    await expect(main(page).getByRole('heading', { level: 1, name: 'Kim lấy máu (mẫu)' })).toBeVisible();
    await expect(main(page).getByLabel('Tồn hiện tại')).toContainText('40 cái');
    await expect(main(page).getByText('Ổn', { exact: true })).toBeVisible();
  });

  test('each wrong box says what is wrong, in the rules\' own words', async ({ page }) => {
    const dlg = await openAdd(page);
    await dlg.getByRole('button', { name: 'Lưu món' }).click();
    await expect(dlg.getByText('Vui lòng nhập tên món.')).toBeVisible();
    await expect(dlg.getByText('Vui lòng nhập đơn vị, ví dụ: viên, ống, hộp.')).toBeVisible();
    await field(dlg, 'Số lượng ban đầu').fill('2,5');
    await field(dlg, 'Hạn dùng').fill('31/03/2027');
    await dlg.getByRole('button', { name: 'Lưu món' }).click();
    await expect(dlg.getByText('Số tồn cần là số nguyên từ 0 đến 1.000.000.')).toBeVisible();
    await expect(dlg.getByText('Hạn dùng cần đúng dạng năm-tháng-ngày, ví dụ 2027-03-31.')).toBeVisible();
    await field(dlg, 'Tên món').fill('Găng tay y tế');
    await field(dlg, 'Đơn vị').fill('hộp');
    await dlg.getByRole('radio', { name: 'Vật tư' }).click();
    await field(dlg, 'Số lượng ban đầu').fill('3');
    await field(dlg, 'Hạn dùng').fill('');
    await dlg.getByRole('button', { name: 'Lưu món' }).click();
    await expect(dlg.getByText('Món này đã có trong kho.')).toBeVisible();
  });

  test('edits an item: the kind is locked, there is no quantity box, and the level follows the warning level', async ({ page }) => {
    const dlg = await openEdit(page, 'stock-12'); // Băng cuộn: 10 cuộn, warns at 15
    await expect(dlg.getByText('Không đổi được loại của món này.')).toBeVisible();
    await expect(dlg.getByLabel('Số lượng ban đầu')).toHaveCount(0);
    await expect(dlg.getByText('Muốn đổi số tồn, dùng Nhập thêm, Xuất ra hoặc Kiểm kê.')).toBeVisible();
    await expect(main(page).getByText('Sắp hết', { exact: true })).toBeVisible();
    await field(dlg, 'Mức báo hết').fill('5');
    await dlg.getByRole('button', { name: 'Lưu món' }).click();
    await expect(toast(page, 'Đã lưu món KHO-0012.')).toBeVisible();
    await expect(main(page).getByText('Ổn', { exact: true })).toBeVisible();
    await main(page).getByRole('button', { name: 'Sửa thông tin' }).click();
    await field(page.getByRole('dialog', { name: 'Sửa món' }), 'Mức báo hết').fill('0');
    await page.getByRole('dialog', { name: 'Sửa món' }).getByRole('button', { name: 'Lưu món' }).click();
    await expect(main(page).getByText('Ổn', { exact: true })).toBeVisible();
    await expect(main(page).getByText('Không đặt')).toBeVisible();
  });

  test('a second tab that saved first wins: the late save is refused, not overwritten', async ({ page, context }) => {
    const dlg = await openEdit(page, 'stock-12');
    const other = await context.newPage();
    const dlgB = await openEdit(other, 'stock-12');
    await field(dlgB, 'Mức báo hết').fill('8');
    await dlgB.getByRole('button', { name: 'Lưu món' }).click();
    await expect(toast(other, 'Đã lưu món KHO-0012.')).toBeVisible();
    await field(dlg, 'Mức báo hết').fill('9');
    await dlg.getByRole('button', { name: 'Lưu món' }).click();
    await expect(toast(page, /vừa được người khác cập nhật/)).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(main(page).getByText('8 cuộn', { exact: true })).toBeVisible(); // the other tab's value, not the 9 typed late
  });

  test('the dialog opens and closes from the keyboard and gives the focus back', async ({ page }) => {
    await openStaff(page, '/nv/kho', 'quanly_ha');
    const add = main(page).getByRole('button', { name: 'Thêm món' });
    await add.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Thêm món' })).toBeVisible();
    await page.waitForTimeout(150);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(add).toBeFocused();
  });

  test('phones: the dialog fits the device width @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await openAdd(page);
    await fitsDevice(page);
  });
});

async function openMove(page: Page, button: string, id = 'stock-1', as = 'quanly_ha') {
  await openStaff(page, `/nv/kho/${id}`, as);
  await main(page).getByRole('button', { name: button, exact: true }).click();
  return page.getByRole('dialog', { name: button });
}
const history = (page: Page) => main(page).getByRole('table', { name: 'Lịch sử nhập xuất' }).locator('[data-row]');
const onHand = (page: Page) => main(page).getByLabel('Tồn hiện tại');

test.describe('stock movements', () => {
  test('receiving adds to the stock, shows the result first and keeps the nearest expiry', async ({ page }) => {
    const dlg = await openMove(page, 'Nhập thêm');
    await field(dlg, 'Số lượng').fill('30');
    await expect(dlg.getByText('Tồn sau khi nhập: 55 chai')).toBeVisible();
    await field(dlg, 'Nhà cung cấp').fill('Công ty mẫu');
    await field(dlg, 'Hạn dùng lô mới').fill('2030-01-01');
    await field(dlg, 'Ghi chú').fill('Đợt 2');
    await dlg.getByRole('button', { name: 'Nhập vào kho' }).click();
    await expect(toast(page, 'Đã nhập thêm 30 chai vào Nước muối sinh lý 0,9 %.')).toBeVisible();
    await expect(onHand(page)).toContainText('55 chai');
    const first = history(page).first();
    await expect(first).toContainText('Nhập');
    await expect(first).toContainText('+30');
    await expect(first).toContainText('55');
    await expect(first).toContainText('Nhập hàng');
    await expect(first).toContainText('Công ty mẫu');
    await expect(main(page).getByText('01/01/2030')).toHaveCount(0); // the older expiry is nearer, so it stays
  });

  test('bad quantities are refused with the rules\' sentences and nothing is written', async ({ page }) => {
    const dlg = await openMove(page, 'Nhập thêm');
    const save = dlg.getByRole('button', { name: 'Nhập vào kho' });
    for (const bad of ['abc', '0', '2,5', '-3']) {
      await field(dlg, 'Số lượng').fill(bad);
      await save.click();
      await expect(dlg.getByText('Số lượng cần là số nguyên từ 1 đến 1.000.000.')).toBeVisible();
    }
    await field(dlg, 'Số lượng').fill('999.999');
    await save.click();
    await expect(dlg.getByText('Số tồn sau khi nhập vượt 1.000.000.')).toBeVisible();
    await dlg.getByRole('button', { name: 'Để sau' }).click();
    await expect(onHand(page)).toContainText('25 chai');
    await expect(history(page)).toHaveCount(4);
  });

  test('issuing: more than on hand says how much is left; the exact amount empties the item', async ({ page }) => {
    const dlg = await openMove(page, 'Xuất ra');
    const save = dlg.getByRole('button', { name: 'Xuất khỏi kho' });
    await field(dlg, 'Số lượng').fill('30');
    await save.click();
    await expect(dlg.getByText('Kho chỉ còn 25 chai.')).toBeVisible();
    await field(dlg, 'Số lượng').fill('8');
    await expect(dlg.getByText('Tồn sau khi xuất: 17 chai')).toBeVisible();
    await dlg.getByRole('radio', { name: 'Hư hỏng' }).click();
    await save.click();
    await expect(toast(page, 'Đã xuất 8 chai khỏi Nước muối sinh lý 0,9 %.')).toBeVisible();
    await expect(onHand(page)).toContainText('17 chai');
    const first = history(page).first();
    await expect(first).toContainText('Xuất');
    await expect(first).toContainText('−8');
    await expect(first).toContainText('Hư hỏng');
    await main(page).getByRole('button', { name: 'Xuất ra', exact: true }).click();
    const all = page.getByRole('dialog', { name: 'Xuất ra' });
    await field(all, 'Số lượng').fill('17');
    await all.getByRole('button', { name: 'Xuất khỏi kho' }).click();
    await expect(onHand(page)).toContainText('0 chai');
    await expect(main(page).getByText('Hết hàng', { exact: true })).toBeVisible();
    await expect(main(page).getByText('Đã hết hàng.')).toBeVisible();
  });

  test('a stock-take shows the difference as you type and writes a Kiểm kê line', async ({ page }) => {
    const dlg = await openMove(page, 'Kiểm kê');
    await expect(dlg.getByText('Tồn trên sổ: 25 chai')).toBeVisible();
    const save = dlg.getByRole('button', { name: 'Lưu kiểm kê' });
    await field(dlg, 'Số đếm được').fill('23');
    await expect(dlg.getByText('Lệch −2 chai so với sổ.')).toBeVisible();
    await field(dlg, 'Số đếm được').fill('25');
    await expect(dlg.getByText('Khớp sổ.')).toBeVisible();
    await save.click();
    await expect(dlg.getByText('Số đếm trùng số tồn, chưa có gì để điều chỉnh.')).toBeVisible();
    await field(dlg, 'Số đếm được').fill('abc');
    await save.click();
    await expect(dlg.getByText('Số đếm cần là số nguyên từ 0 đến 1.000.000.')).toBeVisible();
    await field(dlg, 'Số đếm được').fill('23');
    await save.click();
    await expect(onHand(page)).toContainText('23 chai');
    const first = history(page).first();
    await expect(first).toContainText('Kiểm kê');
    await expect(first).toContainText('−2');
    await main(page).getByRole('button', { name: 'Kiểm kê', exact: true }).click();
    await field(page.getByRole('dialog', { name: 'Kiểm kê' }), 'Số đếm được').fill('0');
    await page.getByRole('dialog', { name: 'Kiểm kê' }).getByRole('button', { name: 'Lưu kiểm kê' }).click();
    await expect(onHand(page)).toContainText('0 chai');
    await expect(main(page).getByText('Hết hàng', { exact: true })).toBeVisible();
  });

  test('a second tab that changed the stock first wins: the late receive is refused', async ({ page, context }) => {
    const dlg = await openMove(page, 'Nhập thêm');
    const other = await context.newPage();
    const dlgB = await openMove(other, 'Xuất ra');
    await field(dlgB, 'Số lượng').fill('5');
    await dlgB.getByRole('button', { name: 'Xuất khỏi kho' }).click();
    await expect(toast(other, 'Đã xuất 5 chai')).toBeVisible();
    await field(dlg, 'Số lượng').fill('3');
    await dlg.getByRole('button', { name: 'Nhập vào kho' }).click();
    await expect(toast(page, /vừa được người khác cập nhật/)).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(onHand(page)).toContainText('20 chai');
  });

  test('an item that is switched off cannot be received, issued or counted, and says why', async ({ page }) => {
    await openStaff(page, '/nv/kho/stock-7', 'quanly_ha'); // Vitamin tổng hợp (mẫu), switched off in the sample data
    for (const name of ['Nhập thêm', 'Xuất ra', 'Kiểm kê']) await expect(main(page).getByRole('button', { name, exact: true })).toBeDisabled();
    await expect(main(page).getByText('Món đã ngừng dùng. Bật lại trước khi nhập hoặc xuất.')).toBeVisible();
  });

  test('a dialog with the form open has no accessibility violations', async ({ page }) => {
    const dlg = await openMove(page, 'Xuất ra');
    await expect(dlg).toBeVisible();
    await page.waitForTimeout(500);
    const r = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical').map((x) => x.id)).toEqual([]);
  });

  test('phones: the three dialogs fit the device width @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    for (const name of ['Nhập thêm', 'Xuất ra', 'Kiểm kê']) {
      const dlg = await openMove(page, name);
      await expect(dlg).toBeVisible();
      await fitsDevice(page);
      await dlg.getByRole('button', { name: 'Để sau' }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
  });
});

test.describe('stock on and off', () => {
  test('switching off asks first and says what happens; switching back on is immediate', async ({ page }) => {
    await openStaff(page, '/nv/kho/stock-14', 'quanly_ha'); // Khẩu trang y tế
    await main(page).getByRole('button', { name: 'Ngừng dùng', exact: true }).click();
    const dlg = page.getByRole('dialog', { name: 'Ngừng dùng món này?' });
    await expect(dlg.getByText('Món sẽ ẩn khỏi danh sách mặc định và không nhập hay xuất được. Lịch sử và số tồn được giữ.')).toBeVisible();
    await dlg.getByRole('button', { name: 'Ngừng dùng món này' }).click();
    await expect(toast(page, 'Đã ngừng dùng Khẩu trang y tế.')).toBeVisible();
    await expect(main(page).getByText('Ngừng dùng', { exact: true })).toBeVisible();
    for (const name of ['Nhập thêm', 'Xuất ra', 'Kiểm kê']) await expect(main(page).getByRole('button', { name, exact: true })).toBeDisabled();
    await expect(main(page).getByText('Món đã ngừng dùng. Bật lại trước khi nhập hoặc xuất.')).toBeVisible();
    await expect(onHand(page)).toContainText('13 hộp'); // the stock is kept

    await openStaff(page, '/nv/kho', 'quanly_ha');
    await main(page).getByRole('searchbox', { name: 'Tìm trong kho' }).fill('khau trang');
    await expect(main(page).getByText('Chưa có món nào khớp.')).toBeVisible();
    await main(page).getByRole('checkbox', { name: 'Hiện cả món đã ngừng dùng' }).click();
    await expect(rows(page)).toHaveCount(1);

    await rows(page).first().getByRole('link', { name: 'Khẩu trang y tế' }).click();
    await main(page).getByRole('button', { name: 'Dùng lại', exact: true }).click();
    await expect(toast(page, 'Đã dùng lại Khẩu trang y tế.')).toBeVisible();
    await expect(main(page).getByRole('button', { name: 'Nhập thêm', exact: true })).toBeEnabled();
  });

  test('switching off a low item takes it out of the "Sắp hết" count, and back on returns it', async ({ page }) => {
    await openStaff(page, '/nv/kho/stock-12', 'quanly_ha'); // Băng cuộn, low
    await main(page).getByRole('button', { name: 'Ngừng dùng', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Ngừng dùng món này' }).click();
    await expect(toast(page, 'Đã ngừng dùng Băng cuộn.')).toBeVisible();
    await openStaff(page, '/nv/kho', 'quanly_ha');
    await expect(main(page).getByRole('button', { name: 'Sắp hết: 2 món' })).toBeVisible();
    await openStaff(page, '/nv/kho/stock-12', 'quanly_ha');
    await main(page).getByRole('button', { name: 'Dùng lại', exact: true }).click();
    await expect(toast(page, 'Đã dùng lại Băng cuộn.')).toBeVisible();
    await openStaff(page, '/nv/kho', 'quanly_ha');
    await expect(main(page).getByRole('button', { name: 'Sắp hết: 3 món' })).toBeVisible();
  });

  test('a second tab that edited first wins: the late switch-off is refused', async ({ page, context }) => {
    await openStaff(page, '/nv/kho/stock-14', 'quanly_ha');
    await main(page).getByRole('button', { name: 'Ngừng dùng', exact: true }).click();
    const dlg = page.getByRole('dialog', { name: 'Ngừng dùng món này?' });
    const other = await context.newPage();
    const dlgB = await openEdit(other, 'stock-14');
    await field(dlgB, 'Mức báo hết').fill('7');
    await dlgB.getByRole('button', { name: 'Lưu món' }).click();
    await expect(toast(other, 'Đã lưu món KHO-0014.')).toBeVisible();
    await dlg.getByRole('button', { name: 'Ngừng dùng món này' }).click();
    await expect(toast(page, /vừa được người khác cập nhật/)).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(main(page).getByRole('button', { name: 'Nhập thêm', exact: true })).toBeEnabled(); // still in use
  });

  test('the summary tiles work from the keyboard', async ({ page }) => {
    await openStaff(page, '/nv/kho', 'quanly_ha');
    const low = main(page).getByRole('button', { name: 'Sắp hết: 3 món' });
    await low.focus();
    await page.keyboard.press('Space');
    await expect(low).toHaveAttribute('aria-pressed', 'true');
    await expect(rows(page)).toHaveCount(3);
    await page.keyboard.press('Space');
    await expect(low).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('stock accessibility', () => {
  test('axe finds nothing serious or critical on the list, an item and its dialogs', async ({ page }) => {
    const scan = async (label: string) => {
      await page.waitForTimeout(500);
      const r = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      const bad = r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical');
      expect(bad.map((x) => `${label}: ${x.id}: ${x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    };
    await openStaff(page, '/nv/kho', 'quanly_ha');
    await expect(rows(page).first()).toBeVisible();
    await scan('list');
    await main(page).getByRole('button', { name: 'Thêm món' }).click();
    await expect(page.getByRole('dialog', { name: 'Thêm món' })).toBeVisible();
    await scan('add dialog');
    await page.keyboard.press('Escape');
    await openStaff(page, '/nv/kho/stock-4', 'quanly_ha'); // expired: the rose tags
    await expect(onHand(page)).toBeVisible();
    await scan('item');
    await main(page).getByRole('button', { name: 'Ngừng dùng', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Ngừng dùng món này?' })).toBeVisible();
    await scan('switch-off dialog');
    await page.keyboard.press('Escape');
    await main(page).getByRole('button', { name: 'Kiểm kê', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Kiểm kê' })).toBeVisible();
    await scan('stock-take dialog');
  });

  test('phones: the list and an item fit even with every filter chip on @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await openStaff(page, '/nv/kho?tt=han&loai=thuoc&ngung=1', 'quanly_ha');
    await expect(rows(page).first()).toBeVisible();
    await fitsDevice(page);
    await openStaff(page, '/nv/kho/stock-4', 'quanly_ha');
    await expect(onHand(page)).toBeVisible();
    await fitsDevice(page);
  });
});

test.describe('stock review fixes', () => {
  test('typing in the search box keeps every character, also when editing in the middle', async ({ page }) => {
    await openStaff(page, '/nv/kho', 'quanly_ha');
    const search = main(page).getByRole('searchbox', { name: 'Tìm trong kho' });
    await search.click();
    await page.keyboard.type('nuc muoi', { delay: 15 });
    for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowLeft');
    await page.keyboard.type('o', { delay: 15 });
    await page.waitForTimeout(600);
    await expect(search).toHaveValue('nuoc muoi');
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText('Nước muối sinh lý 0,9 %');
  });

  test('the box that got corrected loses its old message at once', async ({ page }) => {
    const dlg = await openMove(page, 'Xuất ra');
    await field(dlg, 'Số lượng').fill('30');
    await dlg.getByRole('button', { name: 'Xuất khỏi kho' }).click();
    await expect(dlg.getByText('Kho chỉ còn 25 chai.')).toBeVisible();
    await field(dlg, 'Số lượng').fill('8');
    await expect(dlg.getByText('Tồn sau khi xuất: 17 chai')).toBeVisible();
    await expect(dlg.getByText('Kho chỉ còn 25 chai.')).toHaveCount(0);
  });

  test('while saving, the button says so', async ({ page }) => {
    const dlg = await openMove(page, 'Nhập thêm');
    await field(dlg, 'Số lượng').fill('3');
    await page.evaluate(() => (window as unknown as { __lesonDemo: { setLatency(ms: number): void } }).__lesonDemo.setLatency(700));
    await dlg.getByRole('button', { name: 'Nhập vào kho' }).click();
    await expect(dlg.getByRole('button', { name: 'Đang lưu…' })).toBeDisabled();
    await expect(toast(page, 'Đã nhập thêm 3 chai')).toBeVisible();
  });

  test('the quantity has a visible caption', async ({ page }) => {
    await openStaff(page, '/nv/kho/stock-1', 'quanly_ha');
    await expect(main(page).getByText('Tồn hiện tại', { exact: true })).toBeVisible();
  });

  test('"Dùng lại" pressed twice does not report a conflict with yourself', async ({ page }) => {
    await openStaff(page, '/nv/kho/stock-7', 'quanly_ha');
    await page.evaluate(() => (window as unknown as { __lesonDemo: { setLatency(ms: number): void } }).__lesonDemo.setLatency(400));
    await main(page).getByRole('button', { name: 'Dùng lại', exact: true }).dblclick();
    await expect(toast(page, 'Đã dùng lại Vitamin tổng hợp (mẫu).')).toBeVisible();
    await page.waitForTimeout(900);
    await expect(toast(page, /người khác/)).toHaveCount(0);
  });

  test('a warning level of 0 on an item that was low turns it healthy and never "Sắp hết"', async ({ page }) => {
    const dlg = await openEdit(page, 'stock-2'); // Dịch truyền Ringer lactat: 5 túi, warns at 10
    await expect(main(page).getByText('Sắp hết', { exact: true })).toBeVisible();
    await field(dlg, 'Mức báo hết').fill('0');
    await dlg.getByRole('button', { name: 'Lưu món' }).click();
    await expect(toast(page, 'Đã lưu món KHO-0002.')).toBeVisible();
    await expect(main(page).getByText('Ổn', { exact: true })).toBeVisible();
    await expect(main(page).getByText('Sắp hết', { exact: true })).toHaveCount(0);
  });
});
