import { expect, test, type Page } from '@playwright/test';
import { open } from './helpers';

const main = (page: Page) => page.locator('[data-zone="customer"] main');

test.describe('customer zone: inpatient, invoices, account, locked states', () => {
  test('Lan sees Miu’s diary by part of day, never clock times', async ({ page }) => {
    await open(page, '/khach-hang/noi-tru', { as: 'lan_nguyen' });
    await expect(page.getByRole('heading', { name: /Miu/, level: 1 })).toBeVisible();
    const diary = main(page).locator('[data-diary]');
    await expect(diary.getByText(/^(Sáng|Chiều|Tối)$/).first()).toBeVisible();
    expect(await diary.innerText()).not.toMatch(/\b\d{1,2}:\d{2}\b/);
    await expect(main(page).locator('[data-card="together"]').getByText(/đừng ngần ngại liên hệ với Lê Sơn/)).toBeVisible();
  });

  test('videos play muted, say "Không có âm thanh" and show days left', async ({ page }) => {
    await open(page, '/khach-hang/noi-tru/stay-NT-0041', { as: 'lan_nguyen' });
    const box = main(page).locator('[data-video-main]');
    await expect(box.getByText('Không có âm thanh')).toBeVisible();
    await expect(box.getByText(/Còn \d+ ngày/)).toBeVisible();
    expect(await box.locator('video').evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
  });

  test('an inpatient invoice groups treatment into one line and states what remains', async ({ page }) => {
    await open(page, '/khach-hang/hoa-don', { as: 'ngoc_tran' });
    await main(page).locator('[data-invoice-row]', { hasText: 'Đã thanh toán một phần' }).first().click();
    await expect(main(page).getByText('Thuốc và vật tư điều trị')).toBeVisible();
    const text = await main(page).innerText();
    expect(text).not.toContain('Truyền dịch');
    expect(text).not.toContain('Tiêm thuốc');
    await expect(main(page).getByText(/Đã thanh toán 2\.000\.000\s₫ · còn lại .+ Bạn thanh toán phần còn lại tại quầy nhé\./)).toBeVisible();
    await expect(main(page).getByRole('heading', { name: 'Các lần thanh toán' })).toBeVisible();
  });

  test('print preview shows the A5 sheet with the thank-you footer', async ({ page }) => {
    await open(page, '/khach-hang/hoa-don', { as: 'lan_nguyen' });
    await main(page).locator('[data-invoice-row]').first().click();
    await page.getByRole('link', { name: 'In hóa đơn' }).click();
    await expect(page).toHaveURL(/\/ban-in$/);
    const sheet = page.locator('[data-sheet="a5"]');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText('Cảm ơn bạn đã tin tưởng gửi gắm bé cho Lê Sơn.')).toBeVisible();
  });

  test('an unlinked account sees the lock explainer with its link code', async ({ page }) => {
    await open(page, '/khach-hang/noi-tru', { as: 'minh_khoa' });
    await expect(page.getByRole('heading', { name: 'Nhật ký và video nội trú sẽ hiện ở đây sau khi liên kết hồ sơ' })).toBeVisible();
    await expect(main(page).getByText('LS-7K2Q')).toBeVisible();
    await page.evaluate(() => { location.hash = '/khach-hang/hoa-don'; });
    await expect(page.getByRole('heading', { name: 'Hóa đơn sẽ hiện ở đây sau khi liên kết hồ sơ' })).toBeVisible();
    await expect(main(page).getByText('LS-7K2Q')).toBeVisible();
  });

  test('another customer’s invoice is not found', async ({ page }) => {
    await open(page, '/khach-hang/hoa-don', { as: 'ngoc_tran' });
    await main(page).locator('[data-invoice-row]').first().click();
    await expect(page).toHaveURL(/hoa-don\/inv-/);
    const route = new URL(page.url()).hash.slice(1);
    await open(page, route, { as: 'lan_nguyen' });
    await expect(main(page).getByText('Không tìm thấy trang này')).toBeVisible();
  });

  test('account: a wrong current password is explained; a new name is saved', async ({ page }) => {
    await open(page, '/khach-hang/tai-khoan', { as: 'lan_nguyen' });
    await main(page).getByRole('button', { name: 'Đổi mật khẩu' }).click();
    await main(page).getByLabel('Mật khẩu hiện tại').fill('sai-mat-khau');
    await main(page).getByLabel('Mật khẩu mới', { exact: true }).fill('bong-va-miu-2026');
    await main(page).getByLabel('Nhập lại mật khẩu mới').fill('bong-va-miu-2026');
    await main(page).getByRole('button', { name: 'Lưu mật khẩu mới' }).click();
    await expect(main(page).getByText('Mật khẩu hiện tại chưa đúng.')).toBeVisible();
    await main(page).getByLabel('Họ và tên').fill('Nguyễn Thị Lan Anh');
    await main(page).getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page.getByText('Đã lưu thay đổi.')).toBeVisible();
    await expect(main(page).getByText(/Đã liên kết với hồ sơ khách hàng tại Lê Sơn từ \d{2}\/\d{2}\/\d{4}/)).toBeVisible();
  });
});
