import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const KEY = 'leson:device';
const bar = (page: Page) => page.getByRole('toolbar', { name: 'Xem như' });
const frameEl = (page: Page) => page.locator('iframe[name="leson-device-frame"]');
const innerWidth = (page: Page) => page.frameLocator('iframe[name="leson-device-frame"]').locator('body').evaluate(() => window.innerWidth);

/** Remember a size (or none) and open a page; set once, so what the app itself writes afterwards is not overwritten by a reload. */
async function openAs(page: Page, preset: string | null, hash = '/') {
  await page.goto('./');
  await page.evaluate(([k, v]) => { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); }, [KEY, preset] as const);
  await page.goto(`./#${hash}`);
  await page.reload();
}

test.describe('xem như máy tính / điện thoại @desktop-only', () => {
  test('a phone size shows the app in a frame of exactly that width', async ({ page }) => {
    await openAs(page, 'm-390x844');
    await expect(bar(page)).toBeVisible();
    await expect(frameEl(page)).toHaveAttribute('title', /điện thoại 390 × 844/);
    await expect.poll(() => innerWidth(page)).toBe(390);
    await expect(bar(page).getByLabel('Cỡ màn hình')).toHaveValue('m-390x844');
    await expect(bar(page).getByRole('button', { name: 'Điện thoại' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('picking another phone size resizes the frame without reloading it', async ({ page }) => {
    await openAs(page, 'm-390x844');
    await expect.poll(() => innerWidth(page)).toBe(390);
    await page.evaluate(() => { (window as unknown as { __marker: number }).__marker = 1; });
    await bar(page).getByLabel('Cỡ màn hình').selectOption('m-320x568');
    await expect.poll(() => innerWidth(page)).toBe(320);
    expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(1); // the shell page was not reloaded
    expect(await page.evaluate(() => localStorage.getItem('leson:device'))).toBe('m-320x568');
  });

  test('switching to "Máy tính" gives the laptop default', async ({ page }) => {
    await openAs(page, 'm-390x844');
    await bar(page).getByRole('button', { name: 'Máy tính' }).click();
    await expect.poll(() => innerWidth(page)).toBe(1440);
    await expect(bar(page).getByLabel('Cỡ màn hình')).toHaveValue('pc-1440x900');
    await bar(page).getByLabel('Cỡ màn hình').selectOption('pc-1280x720');
    await expect.poll(() => innerWidth(page)).toBe(1280);
  });

  test('the frame shrinks to fit a smaller window and says so', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 700 });
    await openAs(page, 'pc-1920x1080');
    await expect(bar(page).getByText(/Thu nhỏ còn \d+%/)).toBeVisible();
    await expect.poll(() => innerWidth(page)).toBe(1920);
    const box = await frameEl(page).boundingBox();
    expect(box!.width).toBeLessThanOrEqual(1000);
  });

  test('"Xem bình thường" returns to the plain app on the same page', async ({ page }) => {
    await openAs(page, 'm-390x844', '/dat-lich');
    await expect.poll(() => innerWidth(page)).toBe(390);
    await bar(page).getByRole('button', { name: 'Xem bình thường' }).click();
    await expect(frameEl(page)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Hẹn gặp tại/ })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('leson:device'))).toBe('auto');
  });

  test('the demo chip offers both views and starts the preview', async ({ page }) => {
    await openAs(page, null);
    await page.getByRole('button', { name: /Bản demo/ }).click();
    const menu = page.getByRole('menu', { name: 'Bản demo' });
    await expect(menu.getByRole('menuitem', { name: 'Xem như máy tính' })).toBeVisible();
    await menu.getByRole('menuitem', { name: 'Xem như điện thoại' }).click();
    await expect(bar(page)).toBeVisible();
    await expect.poll(() => innerWidth(page)).toBe(390);
  });

  test('inside the frame the chip does not offer the views again, and a page change is remembered outside', async ({ page }) => {
    await openAs(page, 'm-390x844');
    const inner = page.frameLocator('iframe[name="leson-device-frame"]');
    await inner.getByRole('button', { name: /Bản demo/ }).click();
    await expect(inner.getByRole('menuitem', { name: 'Khôi phục dữ liệu mẫu' })).toBeVisible();
    await expect(inner.getByRole('menuitem', { name: /Xem như/ })).toHaveCount(0);
    await inner.getByRole('button', { name: /Bản demo/ }).click();
    await inner.locator('body').evaluate(() => { location.hash = '#/dat-lich'; });
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/dat-lich');
    await page.reload();
    await expect(inner.getByRole('heading', { name: /Hẹn gặp tại/ })).toBeVisible();
  });

  test('an unknown remembered size is ignored and the plain app opens', async ({ page }) => {
    await openAs(page, 'm-1x1');
    await expect(frameEl(page)).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Đăng nhập/ }).first()).toBeVisible();
  });

  test('the toolbar passes axe', async ({ page }) => {
    await openAs(page, 'm-390x844');
    await expect(bar(page)).toBeVisible();
    const res = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).include('[data-device-shell]').analyze();
    expect(res.violations.map((v) => v.id)).toEqual([]);
  });

  test('where the browser blocks storage (a sandboxed host), the chip still opens the phone view and closing returns to the app', async ({ page }) => {
    // The Artifact page runs in a frame with no storage: choosing a size must not depend on remembering it.
    await page.addInitScript(() => {
      for (const name of ['localStorage', 'sessionStorage'] as const) {
        Object.defineProperty(window, name, { get() { throw new DOMException('The operation is insecure.', 'SecurityError'); } });
      }
    });
    await page.goto('./#/dat-lich');
    await expect(page.getByRole('heading', { name: /Hẹn gặp tại/ })).toBeVisible();
    await page.getByRole('button', { name: /Bản demo/ }).click();
    await page.getByRole('menuitem', { name: 'Xem như điện thoại' }).click();
    await expect(bar(page)).toBeVisible();
    await expect.poll(() => innerWidth(page)).toBe(390);
    await bar(page).getByLabel('Cỡ màn hình').selectOption('m-320x568');
    await expect.poll(() => innerWidth(page)).toBe(320);
    await bar(page).getByRole('button', { name: 'Xem bình thường' }).click();
    await expect(bar(page)).toHaveCount(0);
    await expect(frameEl(page)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Hẹn gặp tại/ })).toBeVisible();
  });

  test('closing the view opened from the chip keeps the page you reached inside the frame', async ({ page }) => {
    await openAs(page, null, '/');
    await page.getByRole('button', { name: /Bản demo/ }).click();
    await page.getByRole('menuitem', { name: 'Xem như điện thoại' }).click();
    await expect.poll(() => innerWidth(page)).toBe(390);
    await page.frameLocator('iframe[name="leson-device-frame"]').locator('body').evaluate(() => { location.hash = '#/dat-lich'; });
    await bar(page).getByRole('button', { name: 'Xem bình thường' }).click();
    await expect(page.getByRole('heading', { name: /Hẹn gặp tại/ })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('leson:device'))).toBe('auto');
  });
});
