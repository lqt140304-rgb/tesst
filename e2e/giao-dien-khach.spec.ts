import { expect, test, type Page } from '@playwright/test';
import { open } from './helpers';
import { fitsDevice } from './width';

/** Redesign part 3 — customer zone (spec 2026-10-21-phan-3-khu-khach-design.md). Lan = lan_nguyen (linked), Khoa = minh_khoa (unlinked, LS-7K2Q). */
const main = (page: Page) => page.locator('[data-zone="customer"] main');
const sidebar = (page: Page) => page.getByRole('navigation', { name: 'Khu khách hàng', exact: true });

test.describe('customer shell', () => {
  test('wide screens: left sidebar with the sections, account, hotline and the signed-in name; the current one marked', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 993, 'sidebar only from 993px');
    await open(page, '/khach-hang/thu-cung', { as: 'lan_nguyen' });
    const nav = sidebar(page);
    await expect(nav.getByRole('link')).toHaveText(['Tổng quan', 'Thú cưng', 'Lịch hẹn', 'Nội trú', 'Hóa đơn', 'Tài khoản']);
    const box = (await nav.boundingBox())!;
    expect(box.x).toBeLessThan(40);
    const side = page.locator('[data-customer-sidebar]');
    expect((await side.boundingBox())!.height).toBeGreaterThan(500);
    await expect(nav.getByRole('link', { name: 'Thú cưng' })).toHaveAttribute('aria-current', 'page');
    await expect(side.locator('a[href="tel:+84973555105"]')).toBeVisible();
    await expect(side.getByText('Nguyễn Thị Lan')).toBeVisible();
    await expect(side.getByRole('button', { name: 'Đăng xuất' })).toBeVisible();
    await expect(side.getByRole('link', { name: /Trang chủ Lê Sơn/ })).toBeVisible();
    // Lighter than the staff sidebar (plum-900 = rgb(66, 18, 71)), so the two zones do not look alike.
    expect(await side.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe('rgb(66, 18, 71)');
    await expect(page.locator('[data-bell-slot]:visible')).toHaveCount(1);
  });

  test('phones: top bar with logo, bell slot and the account menu; bottom bar with five items @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 993, 'phone layout only');
    await open(page, '/khach-hang', { as: 'lan_nguyen' });
    await expect(page.locator('[data-bottom-bar]').getByRole('link')).toHaveCount(5);
    await expect(page.locator('[data-customer-sidebar]')).toBeHidden();
    await expect(page.locator('[data-bell-slot]:visible')).toHaveCount(1);
    const button = page.getByRole('button', { name: /Tài khoản của/ });
    await button.click();
    await expect(page.getByRole('link', { name: 'Tài khoản', exact: true }).last()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeHidden();
    await expect(button).toBeFocused();
    await fitsDevice(page);
  });

  test('unlinked: Nội trú and Hóa đơn are marked locked', async ({ page }) => {
    await open(page, '/khach-hang', { as: 'minh_khoa' });
    await expect(page.getByRole('link', { name: /Hóa đơn \(mở sau khi liên kết hồ sơ\)/ }).first()).toBeAttached();
    await expect(page.getByRole('link', { name: /Nội trú \(mở sau khi liên kết hồ sơ\)/ }).first()).toBeAttached();
  });
});

test.describe('overview', () => {
  test('greeting band, then the four blocks', async ({ page }) => {
    await open(page, '/khach-hang', { as: 'lan_nguyen' });
    await expect(page.getByRole('heading', { name: 'Chào chị Lan.', level: 1 })).toBeVisible();
    if ((page.viewportSize()?.width ?? 0) >= 720) await expect(main(page).getByText('Ảnh minh họa').first()).toBeVisible(); // the photo pair is wide-screen only
    const today = main(page).locator('[data-card="pet-today"]');
    await expect(today.getByRole('heading', { name: 'Bé Miu hôm nay' })).toBeVisible();
    await expect(today.getByRole('link', { name: /Xem nhật ký/ })).toHaveAttribute('href', /\/khach-hang\/noi-tru\//);
    const next = main(page).locator('[data-card="next-appointment"]');
    await expect(next.getByRole('heading', { name: 'Lịch hẹn sắp tới' })).toBeVisible();
    await expect(next.getByText('Bông')).toBeVisible();
    await expect(next.getByText(/^(Đã hẹn|Đã xác nhận)$/)).toBeVisible();
    await expect(next.getByRole('link', { name: 'Đặt lịch mới' })).toBeVisible();
    const pets = main(page).locator('[data-card="pets"]');
    await expect(pets.getByRole('heading', { name: 'Thú cưng của bạn' })).toBeVisible();
    expect(await pets.getByRole('link', { name: /Xem hồ sơ|Miu|Bông/ }).count()).toBeLessThanOrEqual(3);
    await expect(pets.getByRole('link', { name: /Thêm thú cưng/ })).toBeVisible();
    const inv = main(page).locator('[data-card="invoices"]');
    await expect(inv.getByRole('heading', { name: 'Hóa đơn gần đây' })).toBeVisible();
    expect(await inv.locator('[data-invoice-row]').count()).toBeLessThanOrEqual(3);
    expect(await inv.locator('[data-invoice-row]').count()).toBeGreaterThan(0);
    await expect(inv.getByText('Thanh toán tại quầy')).toBeVisible();
  });

  test('no inpatient stay: no "hôm nay" card', async ({ page }) => {
    await open(page, '/khach-hang', { as: 'minh_khoa' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(main(page).locator('[data-card="pet-today"]')).toHaveCount(0);
  });

  test('unlinked: the invoices card asks to link and shows the code, no invoice data', async ({ page }) => {
    await open(page, '/khach-hang', { as: 'minh_khoa' });
    const inv = main(page).locator('[data-card="invoices"]');
    await expect(inv).toContainText('LS-7K2Q');
    await expect(inv.locator('[data-invoice-row]')).toHaveCount(0);
    expect(await inv.innerText()).not.toMatch(/HD-\d/);
  });

  test('wording: never "Hoàn thành" or "quý khách"', async ({ page }) => {
    await open(page, '/khach-hang', { as: 'lan_nguyen' });
    await expect(main(page).locator('[data-card="pets"]')).toBeVisible();
    expect(await main(page).innerText()).not.toMatch(/Hoàn thành|[Qq]uý khách/);
  });
});

test.describe('pets', () => {
  test('title, breadcrumb, rows with "Xem hồ sơ", add card', async ({ page }) => {
    await open(page, '/khach-hang/thu-cung', { as: 'lan_nguyen' });
    await expect(page.getByRole('heading', { name: 'Thú cưng của bạn', level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Đường dẫn' }).getByText('Thú cưng')).toBeVisible();
    const rows = main(page).locator('[data-pet-row]');
    await expect(rows).toHaveCount(2);
    await expect(rows.first().getByRole('link', { name: /Xem hồ sơ/ })).toHaveAttribute('href', /\/khach-hang\/thu-cung\/pet-/);
    await expect(main(page).locator('[data-add-pet]').getByRole('button', { name: /Thêm thú cưng/ })).toBeVisible();
    await expect(main(page).getByRole('button', { name: /Thêm thú cưng/ }).first()).toBeVisible();
  });

  test('search ignores diacritics and case; no match offers to clear', async ({ page }) => {
    await open(page, '/khach-hang/thu-cung', { as: 'lan_nguyen' });
    const search = main(page).getByRole('searchbox', { name: 'Tìm thú cưng' });
    await search.fill('bong');
    await expect(main(page).locator('[data-pet-row]')).toHaveCount(1);
    await expect(main(page).locator('[data-pet-row]').first()).toContainText('Bông');
    await search.fill('xyz');
    await expect(main(page).getByText('Không có bé nào khớp với “xyz”.')).toBeVisible();
    await main(page).getByRole('button', { name: 'Xóa tìm kiếm' }).click();
    await expect(main(page).locator('[data-pet-row]')).toHaveCount(2);
    await expect(search).toHaveValue('');
  });
});

test.describe('pet profile', () => {
  test('Miu: title, info card, past appointments, read-only note', async ({ page }) => {
    await open(page, '/khach-hang/thu-cung/pet-miu', { as: 'lan_nguyen' });
    await expect(page.getByRole('heading', { name: 'Hồ sơ của Miu', level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Đường dẫn' })).toContainText('Hồ sơ của Miu');
    const info = main(page).locator('[data-block="info"]');
    for (const label of ['Tên', 'Loài', 'Giống', 'Giới tính', 'Năm sinh']) await expect(info.getByText(label, { exact: true })).toBeVisible();
    await expect(main(page).getByRole('button', { name: /Chỉnh sửa/ })).toHaveCount(0);
    await expect(main(page).getByText(/Thông tin này do Lê Sơn cập nhật/)).toBeVisible();
    await expect(main(page).locator('a[href="tel:+84973555105"]').first()).toBeVisible();
    const past = main(page).locator('[data-block="past"]');
    await expect(past.getByRole('heading', { name: 'Lịch hẹn đã qua' })).toBeVisible();
    const statuses = await past.locator('tbody tr td:last-child').allInnerTexts();
    expect(statuses.length).toBeGreaterThan(0);
    for (const t of statuses) expect(t.trim()).toMatch(/^(Đã qua|Đã hủy|Từ chối|Không liên lạc được)$/);
    expect(await main(page).innerText()).not.toMatch(/Hoàn thành/);
  });

  test('a pet the customer added can be edited', async ({ page }) => {
    await open(page, '/khach-hang/thu-cung', { as: 'minh_khoa' });
    await main(page).locator('[data-pet-row]').first().getByRole('link', { name: /Xem hồ sơ/ }).click();
    await main(page).getByRole('button', { name: /Chỉnh sửa/ }).click();
    await expect(page.getByRole('dialog')).toContainText('Sửa thông tin bé');
  });

  test('"Đặt lịch cho Miu" opens the booking form with Miu chosen', async ({ page }) => {
    await open(page, '/khach-hang/thu-cung/pet-miu', { as: 'lan_nguyen' });
    await main(page).getByRole('link', { name: 'Đặt lịch cho Miu' }).click();
    await expect(page).toHaveURL(/\/khach-hang\/dat-lich\?thu-cung=/);
    await expect(page.locator('#form-dat-lich').getByRole('radio', { name: /Miu/ })).toHaveAttribute('aria-checked', 'true');
  });

  test('weight and general condition come from the hospital record and the shared diary', async ({ page }) => {
    await open(page, '/khach-hang/thu-cung/pet-miu', { as: 'lan_nguyen' });
    await expect(main(page).locator('[data-block="info"]').getByText('Cân nặng')).toBeVisible();
    await expect(main(page).locator('[data-block="info"]')).toContainText('4,2\u00A0kg');
    const cond = main(page).locator('[data-block="condition"]');
    await expect(cond.getByRole('heading', { name: 'Tình trạng chung của Miu' })).toBeVisible();
    const titles = await cond.locator('li > span:last-child > span:first-child').allInnerTexts();
    expect(titles.length).toBeGreaterThanOrEqual(2);
    for (const t of titles) expect(t).toMatch(/^(Ăn uống|Nghỉ ngơi|Tinh thần|Vận động|Cân nặng)/);
    expect(await cond.innerText()).not.toMatch(/\b\d{1,2}:\d{2}\b/);
    expect(await cond.innerText()).not.toMatch(/Lời nhắn/);
  });

  test('a pet with no diary and no hospital weight has no condition block', async ({ page }) => {
    await open(page, '/khach-hang/thu-cung', { as: 'minh_khoa' });
    await main(page).locator('[data-pet-row]').first().getByRole('link', { name: /Xem hồ sơ/ }).click();
    await expect(main(page).locator('[data-block="info"]')).toBeVisible();
    await expect(main(page).locator('[data-block="condition"]')).toHaveCount(0);
  });
});

test.describe('appointments', () => {
  test('three tabs; on wide screens the first row opens its detail beside the list', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, 'side-by-side from 1024px');
    await open(page, '/khach-hang/lich-hen', { as: 'lan_nguyen' });
    await expect(main(page).getByRole('tab')).toHaveText([/Sắp tới/, /Đang xử lý/, /Lịch sử/]);
    const detail = main(page).locator('[data-detail]');
    await expect(detail.getByText('Bông').first()).toBeVisible();
    await expect(main(page).locator('[data-booking-row]').first()).toHaveAttribute('aria-current', 'true');
    await expect(main(page).locator('[data-booking-row]').first()).toBeVisible();
  });

  test('?tab=lich-su opens the history; every status reads Đã qua, Đã hủy or the request outcome', async ({ page }) => {
    await open(page, '/khach-hang/lich-hen?tab=lich-su', { as: 'lan_nguyen' });
    await expect(main(page).getByRole('tab', { name: /Lịch sử/ })).toHaveAttribute('aria-selected', 'true');
    const rows = main(page).locator('[data-booking-row]');
    expect(await rows.count()).toBeGreaterThan(0);
    for (const t of await rows.locator('[data-pill]').allInnerTexts()) expect(t.trim()).toMatch(/^(Đã qua|Đã hủy|Từ chối|Không liên lạc được)$/);
    expect(await main(page).innerText()).not.toMatch(/Hoàn thành/);
  });

  test('phones: a tapped row opens its detail, Back returns to the same tab @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, 'phone flow');
    await open(page, '/khach-hang/lich-hen', { as: 'lan_nguyen' });
    await main(page).getByRole('tab', { name: /Đang xử lý/ }).click();
    await main(page).locator('[data-booking-row]').first().click();
    await expect(main(page).locator('[data-detail] h2').first()).toBeVisible();
    await main(page).getByRole('button', { name: 'Danh sách lịch hẹn' }).click();
    await expect(main(page).getByRole('tab', { name: /Đang xử lý/ })).toHaveAttribute('aria-selected', 'true');
    await expect(main(page).locator('[data-booking-row]').first()).toBeVisible();
  });

  test('deep link to a phone-booked appointment opens its detail; an unknown id says so', async ({ page }) => {
    await open(page, '/khach-hang/lich-hen', { as: 'ngoc_tran' });
    const href = await main(page).locator('[data-booking-row]').first().getAttribute('href');
    expect(href).toBeTruthy();
    await open(page, href!.replace(/^#/, ''), { as: 'ngoc_tran' });
    await expect(main(page).locator('[data-detail]').getByText('Đặt qua điện thoại')).toBeVisible();
    await open(page, '/khach-hang/lich-hen/khong-co', { as: 'lan_nguyen' });
    await expect(main(page).getByText('Không tìm thấy lịch hẹn này.')).toBeVisible();
  });
});

test.describe('inpatient — "Hôm nay của bé"', () => {
  test('title, pickers, today\'s diary by part of day without clock times, muted video, hotline card', async ({ page }) => {
    await open(page, '/khach-hang/noi-tru', { as: 'lan_nguyen' });
    await expect(page.getByRole('heading', { name: 'Hôm nay của Miu', level: 1 })).toBeVisible();
    await expect(main(page).getByLabel('Chọn thú cưng')).toContainText('Miu');
    await expect(main(page).getByLabel('Chọn ngày')).toBeVisible();
    const diary = main(page).locator('[data-diary]');
    await expect(diary.getByRole('heading', { name: 'Nhật ký hôm nay' })).toBeVisible();
    await expect(diary.getByText(/^(Sáng|Chiều|Tối)$/).first()).toBeVisible();
    expect(await diary.innerText()).not.toMatch(/\b\d{1,2}:\d{2}\b/);
    const video = main(page).locator('[data-video-main] video');
    expect(await video.evaluate((v: HTMLVideoElement) => ({ muted: v.muted, autoplay: v.autoplay }))).toEqual({ muted: true, autoplay: false });
    await expect(main(page).getByRole('button', { name: /âm thanh|loa|Bật tiếng/i })).toHaveCount(0);
    await expect(main(page).getByText(/Video được lưu trong 60 ngày/)).toBeVisible();
    await expect(main(page).getByText('Không có âm thanh').first()).toBeVisible();
    const care = main(page).locator('[data-card="together"]');
    await expect(care.getByRole('heading', { name: 'Luôn đồng hành cùng bé' })).toBeVisible();
    await expect(care.getByRole('link', { name: 'Liên hệ bệnh viện' })).toHaveAttribute('href', 'tel:+84973555105');
  });

  test('the day arrows and the date field move through the stay; the day is kept in the address', async ({ page }) => {
    await open(page, '/khach-hang/noi-tru', { as: 'lan_nguyen' });
    const day = main(page).getByLabel('Chọn ngày');
    const last = await day.inputValue();
    await main(page).getByRole('button', { name: 'Ngày trước' }).click();
    await expect(day).not.toHaveValue(last);
    await expect(page).toHaveURL(/ngay=\d{4}-\d{2}-\d{2}/);
    await expect(main(page).locator('[data-diary]').getByRole('heading', { name: /^Nhật ký ngày \d{2}\/\d{2}\/\d{4}$/ })).toBeVisible();
    const chosen = await day.inputValue();
    await page.reload();
    await expect(main(page).getByLabel('Chọn ngày')).toHaveValue(chosen);
    await main(page).getByRole('button', { name: 'Ngày sau' }).click();
    await expect(main(page).getByLabel('Chọn ngày')).toHaveValue(last);
    await expect(main(page).getByRole('button', { name: 'Ngày sau' })).toBeDisabled();
  });

  test('a day outside the stay falls back to the last day', async ({ page }) => {
    await open(page, '/khach-hang/noi-tru', { as: 'lan_nguyen' });
    const last = await main(page).getByLabel('Chọn ngày').inputValue();
    await open(page, '/khach-hang/noi-tru?ngay=2030-01-01', { as: 'lan_nguyen' });
    await expect(main(page).getByLabel('Chọn ngày')).toHaveValue(last);
  });

  test('phones: the page fits the device @narrow', async ({ page }) => {
    await open(page, '/khach-hang/noi-tru', { as: 'lan_nguyen' });
    await expect(page.getByRole('heading', { name: 'Hôm nay của Miu', level: 1 })).toBeVisible();
    await fitsDevice(page);
  });
});

test.describe('invoices', () => {
  test('wide: the first invoice opens beside the list; another row swaps the detail and the total area stays put', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, 'side-by-side from 1024px');
    await open(page, '/khach-hang/hoa-don', { as: 'lan_nguyen' });
    const rows = main(page).locator('[data-invoice-row]');
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThan(1);
    await expect(rows.first()).toHaveAttribute('aria-current', 'true');
    const detail = main(page).locator('[data-detail]');
    const total = detail.locator('[data-invoice-total]');
    await expect(total).toBeVisible();
    const code = (await detail.getByRole('heading', { level: 2 }).first().innerText()).trim();
    const y = (await total.boundingBox())!.y;
    await rows.nth(1).click();
    await expect(detail.getByRole('heading', { level: 2 }).first()).not.toHaveText(code);
    expect(Math.abs((await total.boundingBox())!.y - y)).toBeLessThanOrEqual(2);
  });

  test('"Tải hóa đơn" opens the print sheet; payment is at the counter', async ({ page }) => {
    await open(page, '/khach-hang/hoa-don', { as: 'lan_nguyen' });
    if ((page.viewportSize()?.width ?? 0) < 1024) await main(page).locator('[data-invoice-row]').first().click();
    await expect(main(page).getByText(/Thanh toán tại quầy/).first()).toBeVisible();
    const link = main(page).getByRole('link', { name: 'Tải hóa đơn' });
    await expect(link).toHaveAttribute('href', /\/khach-hang\/hoa-don\/inv-[^/]+\/ban-in$/);
  });

  test('phones: a row opens the detail, Back returns to the list @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, 'phone flow');
    await open(page, '/khach-hang/hoa-don', { as: 'lan_nguyen' });
    await main(page).locator('[data-invoice-row]').first().click();
    await expect(main(page).locator('[data-invoice-total]')).toBeVisible();
    await main(page).getByRole('button', { name: 'Danh sách hóa đơn' }).click();
    await expect(main(page).locator('[data-invoice-row]').first()).toBeVisible();
  });

  test('a link to another customer\'s invoice is not found', async ({ page }) => {
    await open(page, '/khach-hang/hoa-don/inv-khong-co', { as: 'lan_nguyen' });
    await expect(main(page).getByText('Không tìm thấy trang này')).toBeVisible();
  });
});
