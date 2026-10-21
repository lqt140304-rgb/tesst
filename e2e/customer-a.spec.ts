import { expect, test } from '@playwright/test';
import { open } from './helpers';

const STAFF_NAMES = ['Nguyễn Thu Hà', 'Trần Minh Đức', 'Phạm Thanh Mai', 'Lê Ngọc Anh', 'BS.'];
const main = (page: import('@playwright/test').Page) => page.locator('[data-zone="customer"] main');

test.describe('customer zone: overview, pets, appointments', () => {
  test('overview greets Lan and shows Miu in inpatient care and the next appointment', async ({ page }) => {
    await open(page, '/khach-hang', { as: 'lan_nguyen' });
    await expect(page.getByRole('heading', { name: 'Chào chị Lan' })).toBeVisible();
    await expect(main(page).getByRole('heading', { name: 'Bé Miu hôm nay' })).toBeVisible();
    const next = main(page).locator('[data-card="next-appointment"]');
    await expect(next.getByText(/Bé Bông · Spa & Grooming/)).toBeVisible();
    await expect(next.getByText('Cần đổi hoặc hủy lịch? Gọi 097 355 51 05.')).toBeVisible();
  });

  test('an unlinked account sees the link-code banner', async ({ page }) => {
    await open(page, '/khach-hang', { as: 'minh_khoa' });
    await expect(main(page).getByText('Tài khoản của bạn chưa liên kết với hồ sơ tại Lê Sơn')).toBeVisible();
    await expect(main(page).getByText('LS-7K2Q').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Hóa đơn \(mở sau khi liên kết hồ sơ\)/ }).first()).toBeAttached();
  });

  test('adding pet "Na" shows it in the list', async ({ page }) => {
    await open(page, '/khach-hang/thu-cung', { as: 'lan_nguyen' });
    await main(page).getByRole('button', { name: 'Thêm thú cưng' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Tên bé').fill('Na');
    await dialog.getByRole('radio', { name: 'Mèo' }).click();
    await dialog.getByRole('button', { name: 'Lưu hồ sơ bé' }).click();
    await expect(page.getByText('Đã thêm bé Na.')).toBeVisible();
    await expect(main(page).getByRole('heading', { name: 'Na', exact: true })).toBeVisible();
  });

  test('a hospital pet shows its record tag and read-only note', async ({ page }) => {
    await open(page, '/khach-hang/thu-cung', { as: 'lan_nguyen' });
    await main(page).getByRole('link', { name: /Miu/ }).click();
    await expect(page.getByRole('heading', { name: 'Miu', level: 1 })).toBeVisible();
    await expect(main(page).getByText('Hồ sơ tại Lê Sơn')).toBeVisible();
    await expect(main(page).getByText(/Thông tin này do Lê Sơn cập nhật/)).toBeVisible();
  });

  test('requests show the locked chip with its reassuring sentence in each tab', async ({ page }) => {
    await open(page, '/khach-hang/lich-hen', { as: 'lan_nguyen' });
    const openFirst = async () => { await main(page).locator('[data-booking-row]').first().click(); return main(page).locator('[data-detail]'); };
    let detail = await openFirst();
    await expect(detail.getByText('Đã xác nhận').first()).toBeVisible();
    await expect(detail.getByText(/Lịch hẹn đã được chốt\. Hẹn gặp bạn và bé Bông lúc 15:00/)).toBeVisible();
    await main(page).getByRole('tab', { name: /Đang xử lý/ }).click();
    detail = await openFirst();
    await expect(detail.getByText('Chờ xác nhận').first()).toBeVisible();
    await expect(detail.getByText('Lê Sơn đã nhận yêu cầu. Nhân viên sẽ gọi cho bạn để trao đổi và chốt thời gian.')).toBeVisible();
    await main(page).getByRole('tab', { name: /Lịch sử/ }).click();
    await expect(main(page).locator('[data-booking-row] [data-pill]').first()).toHaveText(/Đã qua|Đã hủy|Từ chối|Không liên lạc được/);
  });

  test('a phone-booked appointment shows "Đặt qua điện thoại"', async ({ page }) => {
    await open(page, '/khach-hang/lich-hen', { as: 'ngoc_tran' });
    await expect(main(page).locator('[data-booking-row]').getByText('Đặt qua điện thoại').first()).toBeVisible();
  });

  test('request detail shows the timeline and what the customer sent', async ({ page }) => {
    await open(page, '/khach-hang/lich-hen/req-YC-0235', { as: 'lan_nguyen' });
    await expect(page.getByRole('heading', { name: /Yêu cầu YC-0235/ })).toBeVisible();
    await expect(main(page).getByText('Bạn gửi yêu cầu')).toBeVisible();
    await expect(main(page).getByRole('heading', { name: 'Thông tin bạn đã gửi' })).toBeVisible();
    await expect(main(page).getByText('101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội')).toBeVisible();
  });

  test('Khoa asks Lê Sơn to call back once', async ({ page }) => {
    await open(page, '/khach-hang/lich-hen', { as: 'minh_khoa' });
    await main(page).getByRole('tab', { name: /Đang xử lý/ }).click();
    await main(page).locator('[data-booking-row]').first().click();
    await expect(main(page).locator('[data-detail]').getByText('Không liên lạc được').first()).toBeVisible();
    await main(page).getByRole('button', { name: 'Nhờ Lê Sơn gọi lại' }).click();
    await expect(main(page).getByRole('button', { name: 'Đã gửi lời nhắc' })).toBeDisabled();
    await expect(main(page).getByText(/Lê Sơn đã nhận lời nhắc của bạn lúc \d{2}:\d{2}/)).toBeVisible();
  });

  test('the customer booking page uses the logged-in form', async ({ page }) => {
    await open(page, '/khach-hang/dat-lich', { as: 'lan_nguyen' });
    await expect(main(page).locator('#form-dat-lich').getByText('Gửi với tài khoản')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gửi yêu cầu đặt lịch', level: 1 })).toBeVisible();
  });

  test('no staff name appears anywhere in the customer zone', async ({ page }) => {
    await open(page, '/khach-hang', { as: 'lan_nguyen' });
    for (const route of ['/khach-hang', '/khach-hang/thu-cung', '/khach-hang/thu-cung/pet-miu', '/khach-hang/lich-hen', '/khach-hang/lich-hen/req-YC-0228']) {
      await page.evaluate((r) => { location.hash = r; }, route);
      await page.waitForTimeout(700);
      const text = await page.locator('body').innerText();
      for (const name of STAFF_NAMES) expect(text, `${route} shows ${name}`).not.toContain(name);
    }
  });

  test('"Chỉ đường" in the customer zone uses the hospital Maps link', async ({ page }) => {
    await open(page, '/khach-hang/lich-hen/req-YC-0235', { as: 'lan_nguyen' });
    const link = main(page).getByRole('link', { name: 'Chỉ đường' }).first();
    await expect(link).toHaveAttribute('href', 'https://maps.app.goo.gl/xFbQ4BjKtGVa3rp86');
  });
});
