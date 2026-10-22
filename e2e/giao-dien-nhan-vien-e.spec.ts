import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openStaff, staffMain as main } from './helpers';
import { fitsDevice } from './width';

const rows = (page: Page) => main(page).locator('[data-row]');
const nav = (page: Page) => page.getByRole('navigation', { name: 'Khu nhân viên' });

test.describe('stock list', () => {
  test('the manager sees the sample stock, worst first, with four summary tiles', async ({ page }) => {
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
    await openStaff(page, '/nv/kho', 'quanly_ha');
    await main(page).getByRole('button', { name: 'Hết hàng: 1 món' }).click();
    await expect(rows(page)).toHaveCount(1);
    await page.reload();
    await expect(rows(page)).toHaveCount(1);
    await expect(main(page).getByRole('button', { name: 'Hết hàng: 1 món' })).toHaveAttribute('aria-pressed', 'true');
    await openStaff(page, '/nv/kho?tt=abc&loai=x', 'quanly_ha');
    await expect(rows(page)).toHaveCount(10);
  });

  test('only people with the stock capability get the menu entry, in the right place', async ({ page }) => {
    await openStaff(page, '/nv/kho', 'quanly_ha');
    if ((page.viewportSize()?.width ?? 0) >= 768) { // phones fold the menu into tabs and a "more" sheet
      const names = (await nav(page).getByRole('link').allInnerTexts()).map((t) => t.trim());
      expect(names.indexOf('Kho')).toBeGreaterThan(names.indexOf('Hóa đơn'));
      expect(names.indexOf('Kho')).toBeLessThan(names.indexOf('Bảng giá'));
    }
    for (const as of ['bacsi_mai', 'spa_ngocanh']) {
      await openStaff(page, '/nv/kho', as);
      await expect(nav(page).getByRole('link', { name: 'Kho' })).toHaveCount(0);
      await expect(page.getByRole('heading', { level: 1, name: 'Mục này dành cho người có quyền phù hợp' })).toBeVisible();
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

  test('doctor and Spa cannot open an item by its address', async ({ page }) => {
    for (const as of ['bacsi_duc', 'spa_ngocanh']) {
      await openStaff(page, '/nv/kho/stock-1', as);
      await expect(page.getByRole('heading', { level: 1, name: 'Mục này dành cho người có quyền phù hợp' })).toBeVisible();
    }
  });

  test('phones: the history turns into cards and fits the width @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await openStaff(page, '/nv/kho/stock-1', 'quanly_ha');
    await expect(main(page).locator('[data-row]').first()).toBeVisible();
    await fitsDevice(page);
  });
});
