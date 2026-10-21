import { expect, test, type Page } from '@playwright/test';
import { createAppointment, open, openStaff, staffMain as main } from './helpers';

/**
 * Business-flow gaps from the owner's completion plan (docs/tham-khao/bang-kiem-thu-nghiep-vu-2026-10-21.md):
 * only cases that are not covered by another spec and can be driven through the interface.
 */

const failNextWrite = (page: Page) => page.evaluate(() => (window as unknown as { __lesonDemo: { failNextWrite(): void } }).__lesonDemo.failNextWrite());

async function bookAsLan(page: Page, date: string) {
  await open(page, '/khach-hang/dat-lich', { as: 'lan_nguyen' });
  const form = page.locator('#form-dat-lich');
  await form.getByRole('radio', { name: /Miu/ }).click();
  await form.getByRole('radio', { name: /Spa & Grooming/ }).click();
  await form.getByLabel('Ngày bạn mong muốn').fill(date);
  const consent = form.getByRole('checkbox', { name: /Tôi đồng ý/ });
  if (await consent.count()) await consent.check();
  await form.getByRole('button', { name: 'Gửi yêu cầu' }).click();
  await expect(page.getByRole('heading', { name: 'Lê Sơn đã nhận yêu cầu của bạn' })).toBeVisible();
}

async function firstPendingMiu(staffTab: Page) {
  const nv = main(staffTab);
  await nv.getByRole('searchbox', { name: 'Tìm yêu cầu' }).fill('Miu');
  await nv.locator('[data-request-card]', { hasText: 'Chờ xác nhận' }).first().click();
  return nv.locator('[data-request-detail]');
}

test.describe('booking request', () => {
  test('a failed save can be retried and creates exactly one request', async ({ page, context }) => {
    await open(page, '/dat-lich');
    const form = page.locator('#form-dat-lich');
    await form.getByLabel('Họ và tên').fill('Hoàng Minh');
    await form.getByLabel('Số điện thoại').fill('0987 654 321');
    await form.getByLabel('Tên bé').fill('Bánh Bao');
    await form.getByRole('radio', { name: 'Chó' }).click();
    await form.getByRole('radio', { name: /Spa & Grooming/ }).click();
    await form.getByLabel('Ngày bạn mong muốn').fill('2030-01-15');
    await form.getByRole('checkbox').check();
    await failNextWrite(page);
    await form.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(page.getByRole('heading', { name: 'Chưa gửi được yêu cầu' })).toBeVisible();
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await page.locator('#form-dat-lich').getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(page.getByRole('heading', { name: 'Lê Sơn đã nhận yêu cầu của bạn' })).toBeVisible();

    const staffTab = await context.newPage();
    await open(staffTab, '/nv/yeu-cau', { as: 'quanly_ha' });
    await main(staffTab).getByRole('searchbox', { name: 'Tìm yêu cầu' }).fill('Bánh Bao');
    await expect(main(staffTab).locator('[data-request-card]')).toHaveCount(1);
  });

  test('a rejected request reads "Từ chối" for the customer, without a reason or a staff name', async ({ page, context }) => {
    await bookAsLan(page, '2030-03-01');
    const staffTab = await context.newPage();
    await open(staffTab, '/nv/yeu-cau', { as: 'quanly_ha' });
    const detail = await firstPendingMiu(staffTab);
    await detail.getByRole('button', { name: 'Từ chối…' }).click();
    await staffTab.getByRole('dialog').getByRole('radio').first().check();
    await staffTab.getByRole('dialog').getByRole('button', { name: 'Từ chối yêu cầu' }).click();
    await expect(staffTab.getByRole('dialog')).toHaveCount(0);

    await open(page, '/khach-hang/lich-hen?tab=lich-su', { as: 'lan_nguyen' });
    await expect(page.locator('[data-zone="customer"] main [data-booking-row] [data-pill]', { hasText: 'Từ chối' }).first()).toBeVisible();
    expect(await page.locator('[data-zone="customer"] main').innerText()).not.toMatch(/Nguyễn Thu Hà|Trần Minh Đức|Phạm Thanh Mai|Lê Ngọc Anh/);
  });

  test('an unreachable request reads "Không liên lạc được" for the customer', async ({ page, context }) => {
    await bookAsLan(page, '2030-03-02');
    const staffTab = await context.newPage();
    await open(staffTab, '/nv/yeu-cau', { as: 'quanly_ha' });
    const detail = await firstPendingMiu(staffTab);
    await detail.getByRole('button', { name: 'Bắt đầu liên hệ' }).click();
    await detail.getByRole('button', { name: 'Không liên lạc được' }).click();
    await expect(detail.getByText('Không liên lạc được').first()).toBeVisible();

    // It stays under "Đang xử lý": the customer can still ask Lê Sơn to call again.
    await open(page, '/khach-hang/lich-hen?tab=dang-xu-ly', { as: 'lan_nguyen' });
    await expect(page.locator('[data-zone="customer"] main [data-booking-row] [data-pill]', { hasText: 'Không liên lạc được' }).first()).toBeVisible();
  });
});

test.describe('appointments', () => {
  test('a cancelled appointment stays readable but cannot be changed again', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, 'side by side from 1024px');
    await openStaff(page, '/nv/lich-hen', 'quanly_ha');
    const day = await createAppointment(page, { customer: 'Lan', pet: 'Miu', time: '13:00' });
    await openStaff(page, `/nv/lich-hen?view=ngay&date=${day}`, 'quanly_ha');
    await main(page).getByRole('checkbox', { name: 'Hiện lịch đã hủy' }).check();
    await main(page).locator('[data-appointment]', { hasText: 'Miu' }).filter({ hasText: '13:00', visible: true }).click();
    const panel = main(page).locator('[data-detail]');
    await panel.getByRole('button', { name: 'Hủy lịch', exact: true }).click();
    await panel.getByLabel('Lý do hủy').fill('Khách báo bận');
    await panel.getByRole('button', { name: 'Hủy lịch hẹn' }).click();
    await expect(panel.getByText('Đã hủy').first()).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Đổi lịch', exact: true })).toHaveCount(0);
    await expect(panel.getByRole('button', { name: 'Hủy lịch', exact: true })).toHaveCount(0);
  });
});

test.describe('accounts and access', () => {
  test('after logging out, going Back never shows the customer\'s invoices', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, 'logout through the header on wide screens');
    await open(page, '/khach-hang/hoa-don', { as: 'lan_nguyen' });
    await expect(page.locator('[data-zone="customer"] main').getByText(/HD-10\d\d/).first()).toBeVisible();
    await page.evaluate(() => { location.hash = '/'; });
    await page.getByRole('button', { name: /Tài khoản của Nguyễn Thị Lan/ }).click();
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await expect(page).toHaveURL(/#\/$/);
    await page.goBack();
    await expect(page.locator('[data-zone="customer"]')).toHaveCount(0); // Back reaches no customer page (the homepage's own sample teaser is labelled "Dữ liệu mẫu")
    await page.evaluate(() => { location.hash = '/khach-hang/hoa-don'; });
    await expect(page).toHaveURL(/dang-nhap/);
    await expect(page.locator('[data-zone="customer"]')).toHaveCount(0);
  });

  test('a customer opening another customer\'s pet gets "not found"', async ({ page }) => {
    await open(page, '/khach-hang/thu-cung/pet-bin', { as: 'lan_nguyen' }); // Bin belongs to someone else
    await expect(page.locator('[data-zone="customer"] main').getByText('Không tìm thấy trang này')).toBeVisible();
    expect(await page.locator('body').innerText()).not.toContain('Bin');
  });

  test('an issued invoice cannot be edited from its page', async ({ page }) => {
    await open(page, '/nv/hoa-don/inv-27', { as: 'quanly_ha' });
    await expect(main(page).getByRole('link', { name: 'In hóa đơn' })).toBeVisible();
    await expect(main(page).getByRole('button', { name: 'Lưu nháp', exact: true })).toHaveCount(0);
    await expect(main(page).getByRole('button', { name: 'Thêm dịch vụ', exact: true })).toHaveCount(0);
    await expect(main(page).getByRole('textbox', { name: /^Đơn giá / })).toHaveCount(0);
  });
});
