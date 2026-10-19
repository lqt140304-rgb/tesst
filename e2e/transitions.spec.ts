import { expect, test, type Page } from '@playwright/test';
import { open, trackErrors } from './helpers';

/** Scroll so the services stage's top sits at `frac` of the viewport height (1 = bottom edge). */
async function stageAt(page: Page, frac: number) {
  await page.evaluate(async (f) => {
    const stage = document.querySelector<HTMLElement>('[data-services-stage]')!;
    const y = stage.getBoundingClientRect().top + window.scrollY - window.innerHeight * f;
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 400));
  }, frac);
}
/** Drawn fraction of the orbit line (pathLength 1): the first dash length; no dash pattern at all = the whole line. */
const drawn = (page: Page) => page.locator('[data-orbit-line]').evaluate((el) => {
  const v = el.getAttribute('stroke-dasharray') || getComputedStyle(el).strokeDasharray;
  return !v || v === 'none' ? 1 : parseFloat(v.split(/[ ,]+/)[0] ?? '0');
});
const landed = (page: Page) => page.locator('[data-service-card]').evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)));

test.describe('Giới thiệu → Dịch vụ', () => {
  test('@desktop-only the orbit draws with the scroll and the cards land on it in order', async ({ page }) => {
    await open(page, '/');
    await page.waitForTimeout(1200);
    await stageAt(page, 0.7);
    const mid = await drawn(page);
    expect(mid).toBeGreaterThan(0.05);
    expect(mid).toBeLessThan(0.95);
    const midCards = await landed(page);
    expect(midCards[0]).toBeGreaterThan(0.95);
    expect(midCards[3]).toBeLessThan(0.5);
    await stageAt(page, 0.15);
    expect(await drawn(page)).toBeGreaterThan(0.99);
    expect((await landed(page)).every((o) => o > 0.99)).toBe(true);
    const paws = page.locator('[data-orbit-paw]');
    await expect(paws).toHaveCount(3);
    expect((await paws.evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)))).every((o) => o > 0.99)).toBe(true);
    await stageAt(page, 0.95);
    expect(await drawn(page)).toBeLessThan(0.05);
  });

  test('@motion-reduced reduced motion: the orbit and cards are simply in place', async ({ page }) => {
    await open(page, '/');
    await page.waitForTimeout(800);
    expect(await drawn(page)).toBeGreaterThan(0.99);
    expect((await landed(page)).every((o) => o > 0.99)).toBe(true);
  });
});

/** Scroll so the booking section's top sits at `frac` of the viewport height. */
async function bookingAt(page: Page, frac: number) {
  await page.evaluate(async (f) => {
    const sec = document.getElementById('dat-lich')!;
    window.scrollTo(0, sec.getBoundingClientRect().top + window.scrollY - window.innerHeight * f);
    await new Promise((r) => setTimeout(r, 400));
  }, frac);
}
const litDots = (page: Page) => page.locator('[data-step-dot][data-lit="true"]').count();

test.describe('Dịch vụ → Đặt lịch', () => {
  test('the line runs into the booking steps and lights them in order', async ({ page, isMobile }) => {
    await open(page, '/');
    await page.waitForTimeout(1000);
    await bookingAt(page, 1.05);
    expect(await litDots(page)).toBe(0);
    if (!isMobile) await expect(page.locator('[data-booking-connector]')).toBeAttached();
    await bookingAt(page, 0.1);
    await expect.poll(() => litDots(page)).toBe(3);
  });

  test('@desktop-only a service card sends its icon flying into the form and selects it', async ({ page }) => {
    await open(page, '/dich-vu');
    await page.waitForTimeout(600);
    const flight = page.locator('[data-service-flight]');
    await page.locator('[data-service-card="Spa & Grooming"]').getByRole('link', { name: /Gửi yêu cầu đặt lịch/ }).click();
    await expect(flight).toBeAttached({ timeout: 3000 });
    await expect(flight).toHaveCount(0, { timeout: 4000 });
    await expect(page.locator('#form-dat-lich').getByRole('radio', { name: /Spa & Grooming/ })).toHaveAttribute('aria-checked', 'true');
  });

  test('@motion-reduced reduced motion: steps lit, no flying icon', async ({ page }) => {
    await open(page, '/dich-vu');
    expect(await litDots(page)).toBe(3);
    await page.locator('[data-service-card="Nội trú"]').getByRole('link', { name: /Gửi yêu cầu đặt lịch/ }).click();
    await expect(page.locator('#form-dat-lich').getByRole('radio', { name: /Nội trú/ })).toHaveAttribute('aria-checked', 'true');
    expect(await page.locator('[data-service-flight]').count()).toBe(0);
  });
});

/** Count document.startViewTransition calls (the morph uses it where the browser supports it). */
async function spyViewTransitions(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __vt: number };
    w.__vt = 0;
    const orig = document.startViewTransition?.bind(document);
    if (orig) document.startViewTransition = ((cb: ViewTransitionUpdateCallback) => { w.__vt += 1; return orig(cb); }) as typeof document.startViewTransition;
  });
}
const vtCount = (page: Page) => page.evaluate(() => (window as unknown as { __vt: number }).__vt);

test.describe('Trang chủ → Đăng nhập', () => {
  test('@desktop-only the hero orbit and frames morph into the login portal window', async ({ page }) => {
    const errors = trackErrors(page);
    await spyViewTransitions(page);
    await open(page, '/');
    await page.waitForTimeout(1800);
    await page.getByRole('banner').getByRole('link', { name: 'Đăng nhập' }).first().click();
    await expect(page).toHaveURL(/#\/dang-nhap$/);
    await expect(page.locator('[data-auth-card]')).toBeVisible();
    expect(await vtCount(page)).toBe(1);
    const names = await page.locator('[data-portal-frame]').evaluateAll((els) => els.map((el) => getComputedStyle(el).viewTransitionName).sort());
    expect(names).toEqual(['lt-frame-1', 'lt-frame-2', 'lt-frame-3']);
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test('@desktop-only sign-up morphs the same way', async ({ page }) => {
    await spyViewTransitions(page);
    await open(page, '/');
    await page.waitForTimeout(1800);
    await page.getByRole('banner').getByRole('link', { name: 'Đăng ký' }).first().click();
    await expect(page.getByRole('heading', { name: 'Tạo tài khoản' })).toBeVisible();
    expect(await vtCount(page)).toBe(1);
  });

  test('@motion-reduced reduced motion: plain navigation, no morph', async ({ page }) => {
    await spyViewTransitions(page);
    await open(page, '/');
    await page.getByRole('banner').getByRole('link', { name: 'Đăng nhập' }).first().click();
    await expect(page.locator('[data-auth-card]')).toBeVisible();
    expect(await vtCount(page)).toBe(0);
  });
});
