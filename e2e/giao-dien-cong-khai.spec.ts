import { expect, test, type Page } from '@playwright/test';
import { open, openDuringHours } from './helpers';
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

  test('one card on the page: the form sits flat inside it, its own title kept only for screen readers', async ({ page }) => {
    await open(page, '/dat-lich');
    const frame = await form(page).evaluate((el) => { const c = getComputedStyle(el); return { border: c.borderTopWidth, shadow: c.boxShadow }; });
    expect(frame).toEqual({ border: '0px', shadow: 'none' });
    await expect(form(page).getByRole('heading', { name: 'Thông tin đặt lịch' })).toHaveClass(/sr-only/);
    await expect(page.getByRole('heading', { name: 'Gửi yêu cầu đặt lịch', level: 2 })).toBeVisible();
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

test.describe('homepage — Dịch vụ', () => {
  test('phones: services fit the device width @narrow', async ({ page }) => {
    await open(page, '/dich-vu');
    await page.waitForTimeout(600);
    await fitsDevice(page);
  });
});

test.describe('homepage — order, team, booking band, flat cards', () => {
  test('sections in the new order; Đội ngũ shows the head doctor (real photo, no sample tag)', async ({ page }) => {
    await open(page, '/');
    const heads = await page.locator('main section h2').evaluateAll((els) =>
      els.map((e) => (e.textContent ?? '').trim()).filter((t) => t.length > 0));
    const order = ['An tâm gửi gắm', 'Những người ở bên bé', 'Mỗi hành trình', 'Nơi bé thấy dễ chịu', 'Dịch vụ dành cho bé', 'Chăm sóc tiếp nối tại nhà', 'Bốn bước nhẹ nhàng', 'Bạn hay hỏi', 'Sẵn sàng đón bé'];
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

  test('booking buttons far down the homepage open the booking page at its top, and back again', async ({ page }) => {
    await openDuringHours(page, '/');
    await page.locator('#lien-he [data-contact-cta]').scrollIntoViewIfNeeded();
    await page.locator('#lien-he [data-contact-cta]').getByRole('link', { name: 'Đặt lịch khám' }).click();
    await expect(page.getByRole('heading', { name: 'Hẹn gặp tại Lê Sơn', level: 1 })).toBeInViewport();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(40);
    // The header does not claim "Trang chủ" while on the booking page.
    await expect(page.locator('header [aria-current]')).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.locator('header').getByRole('link', { name: /Về trang chủ/ }).click();
    await expect(page.locator('#doi-ngu')).toBeAttached();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(40);
  });

  test('the booking button at the end of the page opens the booking page', async ({ page }) => {
    await openDuringHours(page, '/');
    await page.locator('#lien-he [data-contact-cta]').getByRole('link', { name: 'Đặt lịch khám' }).click();
    await expect(page.getByRole('heading', { name: 'Hẹn gặp tại Lê Sơn', level: 1 })).toBeVisible();
  });

  test('reduced motion: homepage sections are in place @motion-reduced', async ({ page }) => {
    await open(page, '/lien-he');
    await page.waitForTimeout(400);
    const moved = await page.locator('main section').evaluateAll((els) => els.flatMap((s) => [...s.querySelectorAll('*')])
      .filter((el) => !(el instanceof SVGElement) && !el.closest('.ho') && !['none', 'matrix(1, 0, 0, 1, 0, 0)'].includes(getComputedStyle(el).transform)).length); // identity (the already-full line) is not movement
    expect(moved).toBe(0);
  });

  test('phones: the homepage fits the device width @narrow', async ({ page }) => {
    await open(page, '/lien-he');
    await page.waitForTimeout(800);
    await fitsDevice(page);
  });
});

test.describe('login and sign-up shell', () => {
  test('photo panel with the caption on wide screens; card copy; sign-up link; remember-me only on the customer tab', async ({ page }) => {
    await open(page, '/dang-nhap');
    const wide = page.viewportSize()!.width >= 960;
    await expect(page.getByText('Luôn đồng hành cùng thú cưng của bạn')).toBeVisible({ visible: wide });
    await expect(page.getByRole('heading', { name: 'Đăng nhập', level: 1 })).toBeVisible();
    await expect(page.getByText('Đăng nhập để quản lý lịch hẹn và thông tin thú cưng dễ dàng hơn.')).toBeVisible();
    await expect(page.getByRole('link', { name: /Đăng ký ngay/ })).toHaveAttribute('href', /#\/dang-ky$/);
    await expect(page.getByRole('checkbox', { name: 'Ghi nhớ đăng nhập' })).toHaveCount(1);
    await page.getByRole('tab', { name: /Nhân viên/ }).click();
    await expect(page.getByRole('checkbox', { name: 'Ghi nhớ đăng nhập' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Về trang chủ/ })).toBeVisible();
  });

  test('wide screens: "Về trang chủ" lines up with the login card', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 960, 'photo column only from 960px');
    await open(page, '/dang-nhap');
    const back = await page.getByRole('link', { name: 'Về trang chủ', exact: true }).boundingBox();
    const card = await page.locator('[data-auth-card]').boundingBox();
    expect(Math.abs(back!.x - card!.x)).toBeLessThanOrEqual(2);
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

test.describe('data wired from the data branch (part 2 §4)', () => {
  test('a guest picks a time slot; staff sees it on the request', async ({ page, context }) => {
    await open(page, '/dat-lich');
    const f = form(page);
    await f.getByLabel('Họ và tên').fill('Trịnh Khung');
    await f.getByLabel('Số điện thoại').fill('0987 111 222');
    await f.getByLabel('Tên bé').fill('Khung Giờ');
    await f.getByRole('radio', { name: 'Mèo' }).click();
    await f.getByRole('radio', { name: /Khám và điều trị/ }).click();
    await f.getByLabel('Ngày bạn mong muốn').fill('2030-03-12');
    await f.getByLabel(/Khung giờ/).selectOption({ label: '10:00–12:00' });
    await f.getByRole('checkbox').check();
    await f.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(page.getByRole('heading', { name: 'Lê Sơn đã nhận yêu cầu của bạn' })).toBeVisible();

    const staff = await context.newPage();
    await open(staff, '/nv/yeu-cau', { as: 'quanly_ha' });
    const nv = staff.locator('[data-zone="staff"] main');
    await nv.getByRole('searchbox', { name: 'Tìm yêu cầu' }).fill('Khung Giờ');
    await nv.locator('[data-request-card]').first().click();
    const detail = nv.locator('[data-request-detail]');
    await expect(detail.getByText('Khung giờ mong muốn')).toBeVisible();
    await expect(detail.getByText('10:00–12:00')).toBeVisible();
  });

  test('a customer sees the chosen slot on the bookings list', async ({ page }) => {
    await open(page, '/khach-hang/dat-lich', { as: 'lan_nguyen' });
    const f = form(page);
    await f.getByRole('radio', { name: /Miu/ }).click();
    await f.getByRole('radio', { name: /Spa & Grooming/ }).click();
    await f.getByLabel('Ngày bạn mong muốn').fill('2030-02-11');
    await f.getByLabel(/Khung giờ/).selectOption({ label: '16:00–18:00' });
    await f.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(page.getByRole('heading', { name: 'Lê Sơn đã nhận yêu cầu của bạn' })).toBeVisible();
    await page.evaluate(() => { location.hash = '/khach-hang/lich-hen'; });
    const kh = page.locator('[data-zone="customer"] main');
    await kh.getByRole('tab', { name: /Đang xử lý/ }).click();
    const row = kh.locator('[data-booking-row]', { hasText: '16:00–18:00' }).first();
    await expect(row).toContainText('Mong muốn');
    // The request detail lists everything they sent, the slot included.
    await row.click();
    const sent = kh.locator('[data-detail] dl').filter({ hasText: 'Ngày mong muốn' });
    await expect(sent.getByText('Khung giờ mong muốn')).toBeVisible();
    await expect(sent.getByText('16:00–18:00')).toBeVisible();
  });

  for (const remember of [true, false]) {
    test(`remember-me ${remember ? 'keeps' : 'does not keep'} the customer signed in for a new tab`, async ({ page, context }) => {
      await open(page, '/dang-nhap');
      await page.getByLabel(/Số điện thoại hoặc tên đăng nhập/).fill('lan_nguyen');
      await page.getByLabel('Mật khẩu').fill('leson-demo');
      if (remember) await page.getByRole('checkbox', { name: 'Ghi nhớ đăng nhập' }).check();
      await page.getByRole('button', { name: 'Đăng nhập' }).click();
      await expect(page).toHaveURL(/#\/khach-hang/);
      const tab = await context.newPage();
      await tab.goto('./#/khach-hang');
      if (remember) await expect(tab).toHaveURL(/#\/khach-hang/, { timeout: 5000 });
      else await expect(tab).toHaveURL(/#\/dang-nhap/, { timeout: 5000 });
    });
  }
});
