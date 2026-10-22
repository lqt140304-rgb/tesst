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

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const daysAgo = (n: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(Date.now() - n * 864e5));
const collected = (page: Page) => main(page).locator('[data-kpi="collected"]');
/** The big numbers count up once; read them only after they stop changing. */
async function settled(page: Page): Promise<string> {
  let last = '';
  await expect.poll(async () => { const now = await collected(page).innerText(); const same = now === last; last = now; return same; }, { intervals: [500], timeout: 10000 }).toBe(true);
  return last;
}
async function applyRange(page: Page, from: string, to: string) {
  await main(page).getByLabel('Từ ngày').fill(from);
  await main(page).getByLabel('Đến ngày').fill(to);
  await main(page).getByRole('button', { name: 'Xem', exact: true }).click();
}

test.describe('revenue period', () => {
  test('fixed periods change the numbers', async ({ page }) => {
    await openStaff(page, '/nv/doanh-thu', 'quanly_ha');
    await expect(main(page).getByRole('radio', { name: 'Tháng này' })).toBeChecked();
    const month = await settled(page);
    await main(page).getByRole('radio', { name: '7 ngày' }).click();
    await expect(main(page).getByRole('radio', { name: '7 ngày' })).toBeChecked();
    await expect(collected(page)).toContainText(/so với kỳ trước|Kỳ trước chưa có số liệu/);
    expect(await settled(page)).not.toBe(month);
    await main(page).getByRole('radio', { name: 'Hôm nay' }).click();
    await expect(main(page).getByText(/tính theo tiền đã thu/)).toContainText(new Date().getFullYear().toString());
  });

  test('a free range works and one that equals a fixed period gives the same figures', async ({ page }) => {
    await openStaff(page, '/nv/doanh-thu', 'quanly_ha');
    await main(page).getByRole('radio', { name: '7 ngày' }).click();
    await expect(main(page).getByRole('radio', { name: '7 ngày' })).toBeChecked();
    const week = await settled(page);
    await main(page).getByRole('radio', { name: 'Chọn ngày' }).click();
    await applyRange(page, daysAgo(6), today());
    expect(await settled(page)).toBe(week);
    await expect(page).toHaveURL(/tu=\d{4}-\d{2}-\d{2}&den=\d{4}-\d{2}-\d{2}/);
    await applyRange(page, `${today().slice(0, 8)}01`, daysAgo(1) < `${today().slice(0, 8)}01` ? today() : daysAgo(1));
    await expect(main(page).getByRole('radio', { name: 'Chọn ngày' })).toBeChecked();
  });

  test('a bad range shows the exact message and keeps the numbers', async ({ page }) => {
    await openStaff(page, '/nv/doanh-thu', 'quanly_ha');
    const before = await settled(page);
    await main(page).getByRole('radio', { name: 'Chọn ngày' }).click();
    await applyRange(page, '2026-10-20', '2026-10-01');
    await expect(main(page).getByText('Ngày kết thúc cần sau hoặc bằng ngày bắt đầu.')).toBeVisible();
    await applyRange(page, '2024-01-01', today());
    await expect(main(page).getByText('Khoảng ngày tối đa 366 ngày.')).toBeVisible();
    await applyRange(page, '1999-12-31', '2000-01-02');
    await expect(main(page).getByText('Chỉ chọn ngày trong các năm 2000–2100.')).toBeVisible();
    await main(page).getByLabel('Từ ngày').fill('');
    await main(page).getByLabel('Đến ngày').fill('');
    await main(page).getByRole('button', { name: 'Xem', exact: true }).click();
    await expect(main(page).getByText('Ngày cần đúng dạng năm-tháng-ngày, ví dụ 2026-10-19.').first()).toBeVisible();
    expect(await settled(page)).toBe(before);
  });

  test('the period survives a reload; a broken address falls back to this month', async ({ page }) => {
    await openStaff(page, '/nv/doanh-thu', 'quanly_ha');
    await main(page).getByRole('radio', { name: 'Chọn ngày' }).click();
    await applyRange(page, '2026-10-01', '2026-10-05');
    await expect(collected(page)).toBeVisible();
    const shown = await settled(page);
    await page.reload();
    await expect(main(page).getByRole('radio', { name: 'Chọn ngày' })).toBeChecked();
    await expect(main(page).getByLabel('Từ ngày')).toHaveValue('2026-10-01');
    await expect(main(page).getByLabel('Đến ngày')).toHaveValue('2026-10-05');
    expect(await settled(page)).toBe(shown);
    await openStaff(page, '/nv/doanh-thu?tu=abc&den=zzz', 'quanly_ha');
    await expect(main(page).getByRole('radio', { name: 'Tháng này' })).toBeChecked();
    await expect(collected(page)).toBeVisible();
  });

  test('how it is counted opens and explains the two bases', async ({ page }) => {
    await openStaff(page, '/nv/doanh-thu', 'quanly_ha');
    await main(page).getByText('Cách tính', { exact: true }).click();
    const note = main(page).locator('details');
    await expect(note.getByText(/sau giảm giá/)).toBeVisible();
    await expect(note.getByText(/không theo kỳ/)).toBeVisible();
  });

  test('a period without payments says so', async ({ page }) => {
    await openStaff(page, '/nv/doanh-thu', 'quanly_ha');
    await main(page).getByRole('radio', { name: 'Chọn ngày' }).click();
    await applyRange(page, '2020-01-01', '2020-01-07');
    await expect(collected(page)).toContainText('0 ₫');
    await expect(main(page).getByText('Chưa có khoản thu nào trong kỳ này.')).toBeVisible();
  });
});

const amount = (text: string) => Number((/([\d.]+)\s₫/.exec(text)?.[1] ?? '0').replace(/\./g, ''));

test.describe('revenue breakdowns', () => {
  test('the daily chart has a table twin that adds up to the collected money', async ({ page }) => {
    await openStaff(page, '/nv/doanh-thu', 'quanly_ha');
    await main(page).getByRole('radio', { name: '7 ngày' }).click();
    const total = amount(await settled(page));
    await main(page).getByRole('button', { name: 'Xem dạng bảng', exact: true }).click();
    const table = main(page).getByRole('table', { name: /tiền thu theo ngày/i });
    await expect(table.getByRole('columnheader', { name: 'Ngày' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Tiền đã thu' })).toBeVisible();
    const cells = await table.locator('[data-row] td:last-child').allInnerTexts();
    expect(cells).toHaveLength(7);
    expect(cells.reduce((n, c) => n + amount(c), 0)).toBe(total);
    await main(page).getByRole('button', { name: 'Xem biểu đồ', exact: true }).click();
    await expect(main(page).getByRole('figure', { name: /Biểu đồ tiền thu theo ngày/ })).toBeVisible();
  });

  test('a long range pages the table twin', async ({ page }) => {
    await openStaff(page, '/nv/doanh-thu', 'quanly_ha');
    await main(page).getByRole('radio', { name: 'Chọn ngày' }).click();
    await applyRange(page, daysAgo(59), today());
    await main(page).getByRole('button', { name: 'Xem dạng bảng', exact: true }).click();
    await expect(main(page).getByRole('navigation', { name: 'Phân trang' }).first()).toBeVisible();
  });

  test('category shares add up to 100 and the table twin totals match', async ({ page }) => {
    await openStaff(page, '/nv/doanh-thu', 'quanly_ha');
    await settled(page);
    const shares = await main(page).locator('[data-share]').allInnerTexts();
    expect(shares.length).toBeGreaterThan(1);
    expect(shares.reduce((n, t) => n + Number(/(\d+)%/.exec(t)?.[1] ?? 0), 0)).toBe(100);
    await main(page).getByRole('button', { name: 'Xem nhóm dạng bảng', exact: true }).click();
    const table = main(page).getByRole('table', { name: /nhóm dịch vụ/i });
    await expect(table.getByRole('columnheader', { name: 'Nhóm' })).toBeVisible();
    const body = await table.locator('tbody tr td:nth-child(2)').allInnerTexts();
    const totalRow = await table.getByRole('row', { name: /^Tổng/ }).innerText();
    expect(body.reduce((n, c) => n + amount(c), 0)).toBe(amount(totalRow));
  });

  test('the methods list shows three rows with their shares', async ({ page }) => {
    await openStaff(page, '/nv/doanh-thu', 'quanly_ha');
    await settled(page);
    const rows = main(page).locator('[data-method]');
    await expect(rows).toHaveCount(3);
    for (const text of await rows.allInnerTexts()) expect(text).toMatch(/\d+%/);
  });

  test('outstanding invoices are a table, oldest first, with Open links', async ({ page }) => {
    await openStaff(page, '/nv/doanh-thu', 'quanly_ha');
    await expect(main(page).locator('[data-kpi="outstanding"]')).toContainText(/2\.975\.000\s₫/);
    const count = Number(/(\d+) hóa đơn đang mở/.exec(await main(page).locator('[data-kpi="outstanding"]').innerText())?.[1]);
    expect(count).toBeLessThanOrEqual(10);
    const table = main(page).getByRole('table', { name: /hóa đơn còn nợ/i });
    const rows = table.locator('[data-row]');
    await expect(rows).toHaveCount(count);
    const ages = (await rows.locator('td[data-label="Đã qua"]').allInnerTexts()).map((x) => Number(/(\d+)/.exec(x)?.[1]));
    expect(ages).toEqual([...ages].sort((a, b) => b - a));
    const owed = (await rows.locator('td[data-label="Còn nợ"]').allInnerTexts()).reduce((n, c) => n + amount(c), 0);
    expect(owed).toBe(2975000);
    await rows.first().getByRole('link', { name: 'Mở' }).click();
    await expect(page).toHaveURL(/#\/nv\/hoa-don\//);
  });

  test('phones: charts and tables fit the width, also for a one-year range @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await openStaff(page, '/nv/doanh-thu', 'quanly_ha');
    await settled(page);
    await fitsDevice(page);
    await main(page).getByRole('radio', { name: 'Chọn ngày' }).click();
    await applyRange(page, daysAgo(364), today());
    await settled(page);
    await fitsDevice(page);
  });
});
