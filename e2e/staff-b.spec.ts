import { expect, test, type Page } from '@playwright/test';
import { open } from './helpers';

const main = (page: Page) => page.locator('[data-zone="staff"] main');
const toast = (page: Page, text: string | RegExp) => page.getByRole('status').filter({ hasText: text });

test.describe('staff zone: inpatient, invoices, price list, revenue', () => {
  test('bacsi_mai shares a diary draft and customer tab shows it', async ({ page, context }) => {
    const customerTab = await context.newPage();
    await open(customerTab, '/khach-hang/noi-tru/stay-NT-0041', { as: 'lan_nguyen' });
    await expect(customerTab.getByRole('heading', { name: /Bé Miu/, level: 1 })).toBeVisible();

    await open(page, '/nv/noi-tru', { as: 'bacsi_mai' });
    await main(page).locator('[data-cage]', { hasText: 'Miu' }).click();
    await main(page).getByRole('tab', { name: /Nhật ký cho chủ nuôi/ }).click();
    const text = 'Miu vừa được chải lông, bé lim dim rất thích thú.';
    await main(page).getByLabel('Buổi').selectOption('chieu');
    await main(page).getByLabel('Loại').selectOption('tinh_than');
    await main(page).getByLabel('Nội dung').fill(text);
    await main(page).getByRole('button', { name: 'Lưu nháp' }).click();
    await expect(toast(page, 'Đã lưu nháp nhật ký.')).toBeVisible();
    const entry = main(page).locator('[data-diary-entry]', { hasText: text });
    await expect(entry.getByText('Bản nháp')).toBeVisible();
    await entry.getByRole('button', { name: 'Chia sẻ với chủ nuôi' }).click();
    await expect(toast(page, 'Đã chia sẻ nhật ký với chủ nuôi.')).toBeVisible();
    await expect(entry.getByText('Đã chia sẻ')).toBeVisible();

    await expect(customerTab.locator('[data-zone="customer"] main').getByText(text)).toBeVisible();
  });

  test('diary text with "0,5 ml" shows soft warning', async ({ page }) => {
    await open(page, '/nv/noi-tru/stay-NT-0041', { as: 'bacsi_mai' });
    await main(page).getByRole('tab', { name: /Nhật ký cho chủ nuôi/ }).click();
    await main(page).getByLabel('Nội dung').fill('Miu đã uống 0,5 ml nước đường.');
    await expect(main(page).getByText('Nội dung có thể chứa thông tin thuốc hoặc liều dùng. Vui lòng kiểm tra lại trước khi chia sẻ.')).toBeVisible();
    await expect(main(page).getByRole('button', { name: 'Lưu nháp' })).toBeEnabled();
  });

  test('spa_ngocanh stay page has no Hồ sơ nội bộ tab, but can share drafts', async ({ page }) => {
    await open(page, '/nv/noi-tru', { as: 'spa_ngocanh' });
    await expect(main(page).getByRole('heading', { name: 'Khu mèo' })).toBeVisible();
    await expect(main(page).locator('[data-cage]', { hasText: 'Trống' }).first()).toBeVisible();
    await main(page).locator('[data-cage]', { hasText: 'Miu' }).click();
    await expect(page.getByRole('heading', { name: /Miu/, level: 1 })).toBeVisible();
    await expect(main(page).getByRole('tab', { name: /Nhật ký cho chủ nuôi/ })).toBeVisible();
    await expect(main(page).getByRole('tab', { name: /Hồ sơ nội bộ/ })).toHaveCount(0);
    await expect(main(page).getByText('Ringer')).toHaveCount(0);
    // Spa may share since the inpatient design (Mochi has Ngọc Anh's seeded draft).
    await open(page, '/nv/noi-tru/stay-NT-0039', { as: 'spa_ngocanh' });
    await main(page).getByRole('tab', { name: /Nhật ký cho chủ nuôi/ }).click();
    await expect(main(page).getByRole('button', { name: 'Chia sẻ với chủ nuôi' })).toBeVisible();
  });

  test('bacsi_mai sees the internal record as a care log', async ({ page }) => {
    await open(page, '/nv/noi-tru/stay-NT-0040', { as: 'bacsi_mai' });
    await expect(main(page).getByText('Thông tin nội bộ — không bao giờ hiển thị cho khách hàng.')).toBeVisible();
    await expect(main(page).getByText('Dịch truyền Ringer lactat').first()).toBeVisible();
    await main(page).getByRole('button', { name: /Ghi đã thực hiện/ }).first().click();
    await expect(toast(page, /Đã ghi nhận/)).toBeVisible();
  });

  test('an order with an impossible time shows which part is wrong and is not saved (F03)', async ({ page }) => {
    await open(page, '/nv/noi-tru/stay-NT-0041', { as: 'bacsi_mai' });
    await main(page).getByRole('button', { name: /Thêm y lệnh/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Thuốc / chỉ định').fill('Đo nhiệt độ');
    await dialog.getByLabel(/Giờ thực hiện/).fill('08:00, 25:99');
    await dialog.getByRole('button', { name: 'Lưu y lệnh' }).click();
    await expect(dialog.getByText('Giờ "25:99" không hợp lệ. Bạn nhập theo dạng giờ:phút (giờ 00–23, phút 00–59), ví dụ 08:00.')).toBeVisible();
    await expect(toast(page, /Đã thêm y lệnh/)).toHaveCount(0);
  });

  test('bacsi_duc issues invoice from price list; quanly_ha records 100.000 cash with given 200.000 → change 100.000; state "Đã thanh toán một phần"', async ({ page }) => {
    await open(page, '/nv/hoa-don/moi?khach=cus-05', { as: 'bacsi_duc' });
    await expect(main(page).getByText('Hoàng Văn Nam')).toBeVisible();
    await main(page).getByRole('button', { name: 'Tạo hóa đơn nháp' }).click();
    await main(page).getByRole('searchbox', { name: 'Tìm trong bảng giá' }).fill('khám lâm sàng');
    await main(page).getByRole('button', { name: /Thêm Khám lâm sàng/ }).click();
    await expect(main(page).locator('[data-line]', { hasText: 'Khám lâm sàng' })).toBeVisible();
    await expect(main(page).locator('[data-total]')).toHaveText(/150\.000\s₫/);
    await main(page).getByRole('button', { name: 'Phát hành hóa đơn' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Phát hành' }).click();
    await expect(toast(page, /Đã phát hành hóa đơn/)).toBeVisible();
    await expect(main(page).getByText('Chưa thanh toán').first()).toBeVisible();
    await expect(main(page).getByRole('button', { name: 'Ghi nhận thanh toán' })).toHaveCount(0);
    const url = page.url();

    await open(page, new URL(url).hash.slice(1), { as: 'quanly_ha' });
    await main(page).getByRole('button', { name: 'Ghi nhận thanh toán' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Số tiền').fill('100000');
    await dialog.getByLabel('Khách đưa').fill('200000');
    await expect(dialog.locator('[data-change]')).toHaveText(/100\.000\s₫/);
    await dialog.getByRole('button', { name: 'Xác nhận đã nhận tiền' }).click();
    await expect(toast(page, /Đã ghi nhận 100\.000\s₫ bằng tiền mặt\./)).toBeVisible();
    await expect(main(page).getByText('Đã thanh toán một phần').first()).toBeVisible();
    await expect(main(page).getByText(/Còn lại/).first()).toBeVisible();
  });

  test('revenue page visible only for quanly_ha and outstanding matches seed', async ({ page }) => {
    await open(page, '/nv/doanh-thu', { as: 'quanly_ha' });
    await expect(page.getByRole('heading', { name: 'Doanh thu', level: 1 })).toBeVisible();
    await expect(main(page).locator('[data-kpi="outstanding"]')).toContainText(/2\.975\.000\s₫/);
    await expect(main(page).getByText('Số liệu được tính từ dữ liệu mẫu.')).toBeVisible();
    await open(page, '/nv/hoa-don', { as: 'quanly_ha' });
    await expect(main(page).locator('[data-summary="outstanding"]')).toContainText(/2\.975\.000\s₫/);

    await open(page, '/nv', { as: 'bacsi_mai' });
    await expect(page.getByRole('link', { name: /Doanh thu/ })).toHaveCount(0);
    await page.evaluate(() => { location.hash = '/nv/doanh-thu'; });
    await expect(page.getByRole('heading', { name: 'Mục này dành cho người có quyền phù hợp' })).toBeVisible();
  });

  test('QR panel shows illustration label', async ({ page }) => {
    await open(page, '/nv/hoa-don', { as: 'quanly_ha' });
    await main(page).getByRole('radio', { name: 'Chưa thanh toán' }).click();
    await main(page).locator('[data-invoice-row]').filter({ visible: true }).first().getByRole('link').first().click();
    await main(page).getByRole('button', { name: 'Ghi nhận thanh toán' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('radio', { name: 'QR ngân hàng' }).click();
    await dialog.getByRole('button', { name: 'Hiện mã QR cho khách' }).click();
    const panel = page.locator('[data-qr-panel]');
    await expect(panel.getByText('Mã QR minh họa – không dùng để chuyển tiền')).toBeVisible();
    await expect(panel.getByText('MẪU — KHÔNG CHUYỂN TIỀN')).toBeVisible();
    await panel.getByRole('button', { name: 'Đóng' }).click();
    await expect(panel).toHaveCount(0);
  });

  test('price list is read-only with the illustrative-price banner; print preview shows the A5 sheet', async ({ page }) => {
    await open(page, '/nv/bang-gia', { as: 'bacsi_mai' });
    await expect(main(page).getByText('Giá trong bản demo là giá minh họa, chưa phải giá thật của bệnh viện.')).toBeVisible();
    await expect(main(page).getByText('Khám lâm sàng')).toBeVisible();
    await expect(main(page).getByRole('button', { name: /Sửa/ })).toHaveCount(0);

    await open(page, '/nv/hoa-don', { as: 'quanly_ha' });
    await main(page).getByRole('radio', { name: 'Đã thanh toán', exact: true }).click();
    await main(page).locator('[data-invoice-row]').filter({ visible: true }).first().getByRole('link').first().click();
    await main(page).getByRole('link', { name: 'In hóa đơn' }).click();
    const sheet = page.locator('[data-sheet="a5"]');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText('Cảm ơn bạn đã tin tưởng gửi gắm bé cho Lê Sơn.')).toBeVisible();
    await expect(sheet.getByText('Chứng từ nội bộ, không thay thế hóa đơn điện tử.')).toBeVisible();
  });

  test('an open-price line can still be edited after the draft is reopened (F01)', async ({ page }) => {
    await open(page, '/nv/hoa-don/inv-28', { as: 'bacsi_duc' });
    await main(page).getByRole('searchbox', { name: 'Tìm trong bảng giá' }).fill('thủ thuật');
    await main(page).getByRole('button', { name: /Thêm Thủ thuật theo chỉ định/ }).click();
    await main(page).getByLabel('Đơn giá Thủ thuật theo chỉ định').fill('123000');
    await main(page).getByRole('button', { name: 'Lưu nháp' }).click();
    await expect(toast(page, 'Đã lưu hóa đơn nháp.')).toBeVisible();
    await page.reload();
    const price = main(page).getByLabel('Đơn giá Thủ thuật theo chỉ định');
    await expect(price).toHaveValue('123000');
    await price.fill('150000');
    await main(page).getByRole('button', { name: 'Lưu nháp' }).click();
    await expect(toast(page, 'Đã lưu hóa đơn nháp.')).toBeVisible();
    await page.reload();
    await expect(main(page).getByLabel('Đơn giá Thủ thuật theo chỉ định')).toHaveValue('150000');
  });

  test('the customer note on an invoice gets the same drug/dose warning as the diary (R7)', async ({ page }) => {
    await open(page, '/nv/hoa-don/inv-28', { as: 'bacsi_duc' });
    await page.getByLabel(/Ghi chú trên hóa đơn/).fill('Uống 0,5 ml mỗi tối');
    await expect(page.getByText('Nội dung có thể chứa thông tin thuốc hoặc liều dùng. Vui lòng kiểm tra lại trước khi chia sẻ.')).toBeVisible();
  });
});
