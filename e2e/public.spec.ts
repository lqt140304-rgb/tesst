import { expect, test } from '@playwright/test';
import { noHorizontalScroll, open, trackErrors } from './helpers';
import { fitsDevice } from './width';

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

  test('services continue the hero: orbit arc, tilted glass frames, orange "bé" accent', async ({ page, isMobile }) => {
    await open(page, '/dich-vu');
    const section = page.locator('#dich-vu');
    await expect(section.locator('h2 em')).toHaveText('bé');
    await expect(section.locator('[data-orbit]')).toBeAttached();
    const frames = section.locator('[data-service-card] [data-frame]');
    await expect(frames).toHaveCount(4);
    if (!isMobile) {
      const angles = await frames.evaluateAll((els) => els.map((el) => {
        const t = getComputedStyle(el).transform;
        if (t === 'none') return 0;
        const [a, b] = t.slice(7, -1).split(',').map(Number);
        return Math.round(Math.atan2(b!, a!) * 180 / Math.PI * 10) / 10;
      }));
      expect(angles.every((a) => Math.abs(a) >= 1.5 && Math.abs(a) <= 4)).toBe(true);
      expect(angles.some((a) => a < 0) && angles.some((a) => a > 0)).toBe(true);
    }
  });

  test('@narrow services fit narrow phones without sideways scroll', async ({ page }) => {
    await open(page, '/dich-vu');
    await page.waitForTimeout(800);
    await noHorizontalScroll(page);
    await expect(page.locator('[data-service-card="Cấp cứu 24/24"]').getByRole('link', { name: /Gọi 097 355 51 05/ })).toBeVisible();
  });

  test('homepage order: hero, Giới thiệu, Dịch vụ, Đặt lịch, Tài khoản, Liên hệ; the menu follows it', async ({ page }) => {
    await open(page, '/');
    const ids = await page.evaluate(() => [...document.querySelectorAll('#noi-dung section[id]')].map((s) => s.id));
    expect(ids).toEqual(['hero-main', 'gioi-thieu', 'dich-vu', 'dat-lich', 'tai-khoan-khach-hang', 'lien-he']);
    const nav = await page.locator('nav[aria-label="Menu chính"]').first().locator('a').allTextContents();
    expect(nav.map((t) => t.trim())).toEqual(['Trang chủ', 'Giới thiệu', 'Dịch vụ', 'Liên hệ']);
  });

  test('Giới thiệu keeps the facts: 24/24 emergency, hotline, directions, sample photo tag', async ({ page }) => {
    await open(page, '/gioi-thieu');
    const intro = page.locator('#gioi-thieu');
    await expect(intro.getByText('Nhận cấp cứu 24/24')).toBeVisible();
    await expect(intro.getByRole('link', { name: /097 355 51 05/ })).toHaveAttribute('href', 'tel:+84973555105');
    await expect(intro.getByRole('link', { name: 'Chỉ đường' })).toBeVisible();
    await expect(intro.getByText('Ảnh minh họa')).toBeVisible();
  });

  test('@narrow Giới thiệu fits narrow phones without sideways scroll', async ({ page }) => {
    await open(page, '/gioi-thieu');
    await page.waitForTimeout(1500);
    await fitsDevice(page);
    await expect(page.locator('#gioi-thieu').getByRole('link', { name: 'Chỉ đường' })).toBeVisible();
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

  test('cards have their own shapes and tinted shadows (R32)', async ({ page }) => {
    await open(page, '/');
    const read = (sel: string) => page.locator(sel).evaluateAll((els) => els.map((el) => {
      const c = getComputedStyle(el);
      return { radius: [c.borderTopLeftRadius, c.borderTopRightRadius, c.borderBottomRightRadius, c.borderBottomLeftRadius].join(' '), shadow: c.boxShadow };
    }));
    const groups = { service: await read('[data-card="service"]'), booking: await read('[data-card="booking"]'), tile: await read('[data-card="tile"]'), contact: await read('[data-card="contact"]') };
    for (const [name, list] of Object.entries(groups)) {
      expect(list.length, name).toBeGreaterThan(0);
      // Not uniformly rounded: every card has at least two different corner radii.
      for (const c of list) expect(new Set(c.radius.split(' ')).size, `${name}: ${c.radius}`).toBeGreaterThan(1);
    }
    // Each group has its own signature.
    expect(new Set(Object.values(groups).map((l) => l[0]!.radius)).size).toBe(4);
    // Neighbouring cards alternate within the services and account groups.
    expect(groups.service[0]!.radius).not.toBe(groups.service[1]!.radius);
    expect(groups.tile[0]!.radius).not.toBe(groups.tile[1]!.radius);
    // Service shadows carry the service's own tint, so the four cards' shadows differ.
    expect(new Set(groups.service.map((c) => c.shadow)).size).toBe(4);
  });
});
