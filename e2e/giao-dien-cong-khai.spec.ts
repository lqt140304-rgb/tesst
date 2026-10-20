import { expect, test, type Page } from '@playwright/test';
import { open, trackErrors } from './helpers';
import { fitsDevice } from './width';

/** Redesign part 2 — public site, booking page, login (spec 2026-10-20-phan-2). */
const form = (page: Page) => page.locator('#form-dat-lich');

test.describe('booking page #/dat-lich', () => {
  test('two columns: heading, three steps in order, hotline, the form', async ({ page }) => {
    await open(page, '/dat-lich');
    await expect(page.getByRole('heading', { name: 'Hẹn gặp tại Lê Sơn', level: 1 })).toBeVisible();
    await expect(page.locator('[data-book-step] h2, [data-book-step] h3')).toHaveText(['Gửi yêu cầu', 'Lê Sơn liên hệ', 'Xác nhận lịch hẹn']);
    await expect(page.locator('main a[href="tel:+84973555105"]').first()).toBeVisible();
    await expect(form(page)).toBeVisible();
  });

  test('?dich-vu preselects a known service and ignores an unknown one', async ({ page }) => {
    await open(page, '/dat-lich?dich-vu=noi_tru');
    await expect(form(page).getByRole('radio', { name: /Nội trú/ })).toHaveAttribute('aria-checked', 'true');
    await open(page, '/dat-lich?dich-vu=xyz');
    await expect(form(page).getByRole('radio', { checked: true })).toHaveCount(0);
    await expect(form(page).getByRole('button', { name: 'Gửi yêu cầu' })).toBeEnabled();
  });

  test('the hero and footer booking links open the booking page', async ({ page }) => {
    await open(page, '/');
    await page.locator('.ho').getByRole('link', { name: /Gửi yêu cầu đặt lịch/ }).click();
    await expect(page.getByRole('heading', { name: 'Hẹn gặp tại Lê Sơn', level: 1 })).toBeVisible();
    await open(page, '/');
    await page.locator('footer').getByRole('link', { name: 'Gửi yêu cầu đặt lịch' }).click();
    await expect(page.getByRole('heading', { name: 'Hẹn gặp tại Lê Sơn', level: 1 })).toBeVisible();
  });

  test('a guest sends a request from the page', async ({ page }) => {
    await open(page, '/dat-lich');
    const f = form(page);
    await f.getByLabel('Họ và tên').fill('Hoàng Minh');
    await f.getByLabel('Số điện thoại').fill('0987 654 321');
    await f.getByLabel('Tên bé').fill('Bánh Bao');
    await f.getByRole('radio', { name: 'Chó' }).click();
    await f.getByRole('radio', { name: /Spa & Grooming/ }).click();
    await f.getByLabel('Ngày bạn mong muốn').fill('2030-01-15');
    await f.getByRole('checkbox').check();
    await f.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(page.getByRole('heading', { name: 'Lê Sơn đã nhận yêu cầu của bạn' })).toBeVisible();
  });

  test('phones: the booking page fits the device width @narrow', async ({ page }) => {
    await open(page, '/dat-lich');
    await expect(form(page)).toBeVisible();
    await fitsDevice(page);
  });
});

test.describe('homepage — Giới thiệu', () => {
  test('mockup layout: heading, three points, the clinic photo; no pinned flight; hero runs without errors', async ({ page }) => {
    const errors = trackErrors(page);
    await open(page, '/gioi-thieu');
    const sec = page.locator('#gioi-thieu');
    await expect(sec.getByRole('heading', { name: 'Chăm sóc bằng chuyên môn, đồng hành bằng sự thấu hiểu.' })).toBeVisible();
    await expect(sec.locator('[data-about-point] h3')).toHaveText(['Lắng nghe', 'Chăm sóc', 'Đồng hành']);
    await expect(sec.getByRole('img', { name: 'Bé mèo trắng nằm nghỉ trên máy ở phòng khám' })).toBeVisible();
    await expect(page.locator('.gt-pin')).toHaveCount(0);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ho__frames .frame')).toHaveCount(9);
    expect(errors).toEqual([]);
  });

  test('reduced motion: Giới thiệu is simply in place @motion-reduced', async ({ page }) => {
    await open(page, '/gioi-thieu');
    await page.waitForTimeout(300);
    const t = await page.locator('#gioi-thieu [data-about-point]').first().evaluate((el) => getComputedStyle(el).transform);
    expect(t).toBe('none');
  });
});

test.describe('homepage — Dịch vụ', () => {
  test('three tabs; arrows switch them; the panel CTA books that service', async ({ page }) => {
    await open(page, '/dich-vu');
    const sec = page.locator('#dich-vu');
    const tabs = sec.getByRole('tablist', { name: 'Dịch vụ' }).getByRole('tab');
    await expect(tabs).toHaveText(['Khám & điều trị', 'Nội trú', 'Spa & grooming']);
    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    const panel = sec.getByRole('tabpanel', { name: 'Nội trú' });
    await expect(panel.getByText('Theo dõi hằng ngày')).toBeVisible();
    const cta = panel.getByRole('link', { name: /Gửi yêu cầu đặt lịch/ });
    await expect(cta).toHaveAttribute('href', /\/dat-lich\?dich-vu=noi_tru$/);
    await cta.click();
    await expect(page.locator('#form-dat-lich').getByRole('radio', { name: /Nội trú/ })).toHaveAttribute('aria-checked', 'true');
  });

  test('Cấp cứu 24/24 is its own strip with a call button and no booking link', async ({ page }) => {
    await open(page, '/dich-vu');
    const strip = page.getByRole('complementary', { name: 'Cấp cứu 24/24' });
    await expect(strip.getByRole('link', { name: 'Gọi ngay 097 355 51 05' })).toHaveAttribute('href', 'tel:+84973555105');
    await expect(strip.locator('a[href*="dat-lich"]')).toHaveCount(0);
  });

  test('phones: services fit the device width @narrow', async ({ page }) => {
    await open(page, '/dich-vu');
    await page.waitForTimeout(600);
    await fitsDevice(page);
  });
});

test.describe('homepage — order, team, booking band, flat cards', () => {
  test('sections in the new order; Đội ngũ shows the head doctor (real photo, no sample tag)', async ({ page }) => {
    await open(page, '/');
    const heads = await page.locator('main > section > :is(div, header) h2, main > section h2').evaluateAll((els) =>
      els.map((e) => (e.textContent ?? '').trim()).filter((t) => t.length > 0));
    const order = ['Chăm sóc bằng chuyên môn', 'Dịch vụ dành cho bé', 'Đội ngũ', 'Hẹn gặp tại Lê Sơn', 'Mọi thông tin của bé', 'Ghé thăm Lê Sơn'];
    const idx = order.map((t) => heads.findIndex((h) => h.startsWith(t)));
    expect(idx.every((i) => i >= 0), JSON.stringify(heads)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
    const team = page.locator('#doi-ngu');
    await expect(team.getByText('Bác sĩ trưởng', { exact: true })).toBeVisible();
    await expect(team.getByText('Lê Thái Sơn', { exact: true })).toBeVisible();
    await expect(team.getByText('Đồng hành cùng thú cưng mỗi ngày.')).toBeVisible();
    await expect(team.getByRole('img', { name: 'Bác sĩ trưởng Lê Thái Sơn' })).toBeVisible();
    await expect(team.getByText('Ảnh minh họa')).toHaveCount(0);
    await expect(page.locator('main [data-card]')).toHaveCount(0);
  });

  test('the booking band opens the booking page', async ({ page }) => {
    await open(page, '/');
    await page.locator('[data-book-cta]').getByRole('link', { name: 'Gửi yêu cầu đặt lịch' }).click();
    await expect(page.getByRole('heading', { name: 'Hẹn gặp tại Lê Sơn', level: 1 })).toBeVisible();
  });

  test('reduced motion: homepage sections are in place @motion-reduced', async ({ page }) => {
    await open(page, '/lien-he');
    await page.waitForTimeout(400);
    const moved = await page.locator('main section').evaluateAll((els) => els.flatMap((s) => [...s.querySelectorAll('*')])
      .filter((el) => !(el instanceof SVGElement) && !el.closest('.ho') && getComputedStyle(el).transform !== 'none').length);
    expect(moved).toBe(0);
  });

  test('phones: the homepage fits the device width @narrow', async ({ page }) => {
    await open(page, '/lien-he');
    await page.waitForTimeout(800);
    await fitsDevice(page);
  });
});

test.describe('login and sign-up shell', () => {
  test('photo panel with the caption on wide screens; card copy; sign-up link; no remember-me box until its data exists', async ({ page }) => {
    await open(page, '/dang-nhap');
    const wide = page.viewportSize()!.width >= 960;
    await expect(page.getByText('Luôn đồng hành cùng thú cưng của bạn')).toBeVisible({ visible: wide });
    await expect(page.getByRole('heading', { name: 'Đăng nhập', level: 1 })).toBeVisible();
    await expect(page.getByText('Đăng nhập để quản lý lịch hẹn và thông tin thú cưng dễ dàng hơn.')).toBeVisible();
    await expect(page.getByRole('link', { name: /Đăng ký ngay/ })).toHaveAttribute('href', /#\/dang-ky$/);
    await expect(page.getByRole('checkbox', { name: 'Ghi nhớ đăng nhập' })).toHaveCount(0);
    await page.getByRole('tab', { name: /Nhân viên/ }).click();
    await expect(page.getByRole('checkbox', { name: 'Ghi nhớ đăng nhập' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Về trang chủ/ })).toBeVisible();
  });

  test('header Đăng nhập from the homepage is a plain navigation (no view-transition morph)', async ({ page }) => {
    await open(page, '/');
    await page.locator('header').getByRole('link', { name: 'Đăng nhập' }).first().click();
    await expect(page.getByRole('heading', { name: 'Đăng nhập', level: 1 })).toBeVisible();
    expect(await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('*')].some((el) => !!el.style.viewTransitionName))).toBe(false);
  });

  test('a customer still signs in and lands in the customer zone', async ({ page }) => {
    await open(page, '/dang-nhap');
    await page.getByLabel(/Số điện thoại hoặc tên đăng nhập/).fill('lan_nguyen');
    await page.getByLabel('Mật khẩu').fill('leson-demo');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).toHaveURL(/#\/khach-hang/);
  });

  test('phones: login fits the device width @narrow', async ({ page }) => {
    await open(page, '/dang-nhap');
    await expect(page.getByRole('heading', { name: 'Đăng nhập', level: 1 })).toBeVisible();
    await fitsDevice(page);
  });
});
