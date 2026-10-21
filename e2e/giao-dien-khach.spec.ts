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
