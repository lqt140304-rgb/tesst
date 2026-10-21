import { expect, test, type Page } from '@playwright/test';
import { open } from './helpers';

const main = (page: Page) => page.locator('[data-zone="staff"] main');
const card = (page: Page, code: string) => main(page).locator('[data-request-card]', { hasText: code });
const detail = (page: Page) => main(page).locator('[data-request-detail]');

test.describe('staff zone: intake, calendar, customers, linking', () => {
  test('quanly_ha: Cần xử lý shows YC-0234 flagged first', async ({ page }) => {
    await open(page, '/nv/yeu-cau', { as: 'quanly_ha' });
    await expect(main(page).getByRole('tab', { name: /Cần xử lý/ })).toHaveAttribute('aria-selected', 'true');
    const first = main(page).locator('[data-request-card]').first();
    await expect(first).toContainText('YC-0234');
    await expect(first.getByText('Khách vừa gửi lại — cần gọi lại')).toBeVisible();
  });

  test('start contact clears flag and moves to Đang liên hệ', async ({ page }) => {
    await open(page, '/nv/yeu-cau', { as: 'quanly_ha' });
    await card(page, 'YC-0234').click();
    await expect(detail(page).getByText('Khách vừa gửi lại — cần gọi lại')).toBeVisible();
    await detail(page).getByRole('button', { name: 'Liên hệ lại' }).click();
    await expect(detail(page).getByText('Đang liên hệ').first()).toBeVisible();
    await expect(detail(page).getByText('Khách vừa gửi lại — cần gọi lại')).toHaveCount(0);
    await expect(card(page, 'YC-0234').getByText('Khách vừa gửi lại — cần gọi lại')).toHaveCount(0);
  });

  test('confirm dialog requires date and time then shows toast "Đã xác nhận lịch hẹn lúc …" and appointment on calendar', async ({ page }) => {
    await open(page, '/nv/yeu-cau', { as: 'quanly_ha' });
    await card(page, 'YC-0234').click();
    await detail(page).getByRole('button', { name: 'Liên hệ lại' }).click();
    await detail(page).getByRole('button', { name: 'Xác nhận lịch hẹn…' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Ngày hẹn').fill('');
    await dialog.getByRole('button', { name: 'Xác nhận và đưa vào lịch' }).click();
    await expect(dialog.getByText('Vui lòng chọn đủ ngày và giờ hẹn.').first()).toBeVisible();
    const tomorrow = await page.evaluate(() => {
      const d = new Date(Date.now() + 864e5);
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d);
    });
    await dialog.getByLabel('Ngày hẹn').fill(tomorrow);
    await dialog.getByLabel('Giờ hẹn').fill('10:00');
    await dialog.getByRole('button', { name: 'Xác nhận và đưa vào lịch' }).click();
    await expect(page.getByRole('status').filter({ hasText: /Đã xác nhận lịch hẹn lúc 10:00, Thứ .+ \d{2}\/\d{2}\./ })).toBeVisible();
    await expect(detail(page).getByText('Đã xác nhận').first()).toBeVisible();
    await detail(page).getByRole('link', { name: 'Xem trên lịch' }).click();
    await expect(page).toHaveURL(new RegExp(`lich-hen\\?view=ngay&date=${tomorrow}`));
    // Wide: the block on the grid; phones: the link opens that appointment as its own page.
    const where = (page.viewportSize()?.width ?? 0) < 1024 ? main(page).locator('[data-detail]') : main(page).locator('[data-appointment]', { hasText: 'Đậu' });
    await expect(where.filter({ hasText: 'Đậu' }).filter({ hasText: '10:00', visible: true })).toBeVisible();
  });

  test('link minh_khoa by LS-7K2Q then customer tab sees Gạo diary', async ({ page, context }) => {
    const customerTab = await context.newPage();
    await open(customerTab, '/khach-hang/noi-tru', { as: 'minh_khoa' });
    await expect(customerTab.getByText(/sau khi liên kết hồ sơ/).first()).toBeVisible();

    await open(page, '/nv/tai-khoan-web', { as: 'quanly_ha' });
    await main(page).getByRole('button', { name: 'Liên kết bằng mã…' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Mã kết nối khách đưa cho bạn').fill('LS-0000');
    await dialog.getByRole('button', { name: 'Tìm tài khoản' }).click();
    await expect(dialog.getByText('Không tìm thấy tài khoản với mã này. Vui lòng kiểm tra lại với khách.')).toBeVisible();
    await dialog.getByLabel('Mã kết nối khách đưa cho bạn').fill('ls-7k2q');
    await dialog.getByRole('button', { name: 'Tìm tài khoản' }).click();
    await expect(dialog.getByText('minh_khoa')).toBeVisible();
    await dialog.getByRole('radio', { name: /Đỗ Minh Khoa · KH-0006/ }).check();
    await expect(dialog.getByLabel('Gạo (khách tự thêm)')).toHaveValue(/.+/);
    await dialog.getByRole('button', { name: 'Liên kết tài khoản' }).click();
    await expect(dialog.getByText('Vui lòng xác nhận đã đối chiếu người đến quầy.')).toBeVisible();
    await dialog.getByLabel('Tôi đã đối chiếu người đến quầy đúng là chủ của hồ sơ này.').check();
    await dialog.getByRole('button', { name: 'Liên kết tài khoản' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã liên kết tài khoản minh_khoa với hồ sơ KH-0006.' })).toBeVisible();
    await expect(main(page).locator('tr, li', { hasText: 'minh_khoa' }).getByText('Đã liên kết với KH-0006').filter({ visible: true })).toBeVisible();

    // The customer tab picks the link up without a reload (shared data, per-tab session).
    await expect(customerTab.locator('[data-zone="customer"] main').getByText(/Gạo/).first()).toBeVisible();
    await customerTab.goto('./#/khach-hang/noi-tru');
    await expect(customerTab.getByRole('heading', { name: /Gạo/, level: 1 })).toBeVisible();
    const seen = customerTab.getByText('Gạo đã quen phòng', { exact: false });
    // Step back day by day until the entry shows; each retry re-reads the page, so a page still settling cannot race the click.
    await expect(async () => {
      if (!(await seen.isVisible())) await customerTab.getByRole('button', { name: 'Ngày trước' }).click({ timeout: 1000 });
      await expect(seen).toBeVisible({ timeout: 500 });
    }).toPass({ timeout: 15_000 });
    await expect(seen).toBeVisible();
  });

  test('minh_khoa asks for a call back; the staff queue shows the flag', async ({ page, context }) => {
    await open(page, '/nv/yeu-cau', { as: 'quanly_ha' });
    await expect(card(page, 'YC-0245')).toBeVisible();
    await expect(card(page, 'YC-0245').getByText('Khách vừa gửi lại — cần gọi lại')).toHaveCount(0);
    const customerTab = await context.newPage();
    await open(customerTab, '/khach-hang/lich-hen', { as: 'minh_khoa' });
    await customerTab.getByRole('tab', { name: /Đang xử lý/ }).click();
    await customerTab.locator('[data-booking-row]').first().click();
    await customerTab.getByRole('button', { name: 'Nhờ Lê Sơn gọi lại' }).click();
    await expect(customerTab.getByRole('button', { name: 'Đã gửi lời nhắc' })).toBeDisabled();
    await expect(card(page, 'YC-0245').getByText('Khách vừa gửi lại — cần gọi lại')).toBeVisible();
  });

  test('spa_ngocanh: no Yêu cầu nav item; #/nv/yeu-cau shows Forbidden copy', async ({ page }) => {
    await open(page, '/nv', { as: 'spa_ngocanh' });
    await expect(page.getByRole('heading', { name: /Chào buổi/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Yêu cầu/ })).toHaveCount(0);
    await page.evaluate(() => { location.hash = '/nv/yeu-cau'; });
    await expect(page.getByRole('heading', { name: 'Mục này dành cho người có quyền phù hợp' })).toBeVisible();
    await expect(page.getByText('Nếu bạn cần dùng, hãy nhờ quản lý cấp quyền.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Về Tổng quan' })).toBeVisible();
  });

  test('Quyền của tôi lists Tiếp nhận yêu cầu đặt lịch for bacsi_duc', async ({ page }) => {
    await open(page, '/nv', { as: 'bacsi_duc' });
    await page.getByRole('button', { name: /Tài khoản của BS\. Trần Minh Đức/ }).first().click();
    await page.getByRole('menuitem', { name: 'Quyền của tôi' }).click();
    const dialog = page.getByRole('dialog', { name: 'Quyền của tôi' });
    await expect(dialog.getByText('Tiếp nhận yêu cầu đặt lịch')).toBeVisible();
    await expect(dialog.getByText('Xem doanh thu')).toHaveCount(0);
  });

  test('dashboard tiles follow capabilities and never show check-in (R8)', async ({ page }) => {
    await open(page, '/nv', { as: 'quanly_ha' });
    await expect(main(page).locator('[data-tile]', { hasText: 'Yêu cầu cần xử lý' })).toBeVisible();
    await expect(main(page).locator('[data-tile]', { hasText: 'Thu hôm nay' })).toBeVisible();
    await expect(main(page).getByText('Khách đã đến')).toHaveCount(0);
    await open(page, '/nv', { as: 'bacsi_mai' });
    await expect(main(page).locator('[data-tile]', { hasText: 'Lịch hẹn hôm nay' })).toBeVisible();
    await expect(main(page).locator('[data-tile]', { hasText: 'Yêu cầu cần xử lý' })).toHaveCount(0);
    await expect(main(page).locator('[data-tile]', { hasText: 'Thu hôm nay' })).toHaveCount(0);
  });

  test('customers: search by phone, open the record, see pets and the web-account state', async ({ page }) => {
    await open(page, '/nv/khach-hang', { as: 'quanly_ha' });
    await main(page).getByRole('searchbox', { name: /Tìm khách hàng/ }).fill('Nguyễn Thị Lan');
    await main(page).getByRole('link', { name: /Nguyễn Thị Lan/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Nguyễn Thị Lan', level: 1 })).toBeVisible();
    await expect(main(page).getByText('KH-0001').first()).toBeVisible();
    await expect(main(page).getByText('Miu').first()).toBeVisible();
    await main(page).getByRole('tab', { name: /Tài khoản web/ }).click();
    await expect(main(page).getByText(/lan_nguyen/)).toBeVisible();
  });
});
