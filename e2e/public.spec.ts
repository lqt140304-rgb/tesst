import { expect, test } from '@playwright/test';
import { noHorizontalScroll, open, trackErrors } from './helpers';

test.describe('public homepage', () => {
  test('@header header shows both auth buttons ≥ 44 px without overlap', async ({ page }) => {
    await open(page, '/');
    const login = page.getByRole('banner').getByRole('link', { name: 'Đăng nhập' }).first();
    const signup = page.getByRole('banner').getByRole('link', { name: 'Đăng ký' }).first();
    await expect(login).toBeVisible();
    await expect(signup).toBeVisible();
    const boxes = await Promise.all([login.boundingBox(), signup.boundingBox(), page.getByRole('link', { name: /Về trang chủ/ }).boundingBox()]);
    for (const b of boxes.slice(0, 2)) expect(b!.height).toBeGreaterThanOrEqual(44);
    const [a, b, logo] = boxes as { x: number; y: number; width: number; height: number }[];
    expect(a!.x + a!.width).toBeLessThanOrEqual(b!.x + 0.5);
    expect(logo!.x + logo!.width).toBeLessThanOrEqual(a!.x + 0.5);
    const menu = page.getByRole('button', { name: 'Mở danh mục điều hướng' });
    if (await menu.isVisible()) {
      const m = (await menu.boundingBox())!;
      expect(b!.x + b!.width).toBeLessThanOrEqual(m.x + 0.5);
    }
    await noHorizontalScroll(page);
  });

  test('@header mobile menu: controls, label swap, Esc returns focus, outside click closes', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile menu only');
    await open(page, '/');
    const btn = page.getByRole('button', { name: 'Mở danh mục điều hướng' });
    await expect(btn).toHaveAttribute('aria-controls', 'mobileMenu');
    await btn.click();
    await expect(page.locator('#mobileMenu')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đóng danh mục điều hướng' })).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobileMenu')).toBeHidden();
    await expect(btn).toBeFocused();
    await btn.click();
    await page.mouse.click(10, 500);
    await expect(page.locator('#mobileMenu')).toBeHidden();
    await btn.click();
    await page.locator('#mobileMenu').getByRole('link', { name: 'Liên hệ' }).click();
    await expect(page.locator('#mobileMenu')).toBeHidden();
  });

  test('hero has exactly 9 frames after load and after navigating away and back', async ({ page }) => {
    const errors = trackErrors(page);
    await open(page, '/');
    await expect(page.locator('.ho__frames .frame')).toHaveCount(9);
    await page.evaluate(() => { location.hash = '/dang-nhap'; });
    await expect(page.locator('h1').first()).toBeVisible();
    await page.evaluate(() => { location.hash = '/'; });
    await expect(page.locator('.ho__frames .frame')).toHaveCount(9);
    expect(errors).toEqual([]);
  });

  test('pause button toggles aria-pressed and its label', async ({ page }) => {
    await open(page, '/');
    const toggle = page.locator('.motion-toggle');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toContainText('Tiếp tục chuyển động');
  });

  test('emergency card calls the hotline and has no booking button', async ({ page }) => {
    await open(page, '/dich-vu');
    const card = page.locator('[data-service-card="Cấp cứu 24/24"]');
    await expect(card.getByRole('link', { name: /Gọi 097 355 51 05/ })).toHaveAttribute('href', 'tel:+84973555105');
    await expect(card.getByText('Gửi yêu cầu đặt lịch')).toHaveCount(0);
  });

  test('services are in the locked order with locked names', async ({ page }) => {
    await open(page, '/');
    const titles = await page.locator('[data-service-card] h3').allTextContents();
    expect(titles).toEqual(['Khám và điều trị', 'Spa & Grooming', 'Nội trú', 'Cấp cứu 24/24']);
  });

  test('no unconfirmed facts on the homepage', async ({ page }) => {
    await open(page, '/');
    const text = (await page.locator('body').innerText()).toLowerCase();
    for (const banned of ['giờ làm việc', 'bảng giá', 'x-quang', 'siêu âm', 'quý khách', 'lễ tân']) expect(text).not.toContain(banned);
    await expect(page.getByText('101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội').first()).toBeVisible();
  });

  test('external links open safely in a new tab', async ({ page }) => {
    await open(page, '/lien-he');
    const fb = page.getByRole('link', { name: 'Mở trang Facebook' });
    await expect(fb).toHaveAttribute('href', 'https://www.facebook.com/benhvienthuyleson');
    await expect(fb).toHaveAttribute('target', '_blank');
    await expect(fb).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('icon sheet renders every icon with no console errors', async ({ page }) => {
    const errors = trackErrors(page);
    await open(page, '/_bo-icon');
    await expect(page.getByRole('heading', { name: 'Bộ icon Lê Sơn' })).toBeVisible();
    expect(await page.locator('[data-icon-cell]').count()).toBeGreaterThan(100);
    expect(errors).toEqual([]);
  });
});
