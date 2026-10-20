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
