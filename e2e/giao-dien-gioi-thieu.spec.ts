import { expect, test } from '@playwright/test';
import { open } from './helpers';
import { fitsDevice } from './width';

/** Part 6A: the intro page below the hero (spec 2026-10-22-phan-6). */
test.describe('khung trang', () => {
  test('the scroll thread is drawn along the page on wide screens and grows with the scroll @desktop-only', async ({ page }) => {
    await open(page, '/');
    const thread = page.locator('[data-thread]');
    await expect(thread).toBeAttached();
    const scale = () => thread.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).d);
    const before = await scale();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(400);
    expect(await scale()).toBeGreaterThan(before);
  });

  test('phones under 640 px do not draw it', async ({ page }) => {
    await open(page, '/');
    const w = page.viewportSize()!.width;
    const shown = await page.locator('[data-thread]').evaluate((el) => getComputedStyle(el).display !== 'none');
    expect(shown).toBe(w >= 640);
  });

  test('reduced motion: the thread is already full @motion-reduced', async ({ page }) => {
    await open(page, '/');
    const d = await page.locator('[data-thread]').evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).d);
    expect(d).toBe(1);
  });

  test('the menu follows the section: straight to /dich-vu and /lien-he', async ({ page }) => {
    for (const [route, name] of [['/dich-vu', 'Dịch vụ'], ['/lien-he', 'Liên hệ']] as const) {
      await open(page, route);
      await page.waitForTimeout(600);
      await expect(page.locator('nav[aria-label="Menu chính"]').first().getByRole('link', { name, includeHidden: true })).toHaveAttribute('aria-current', 'true');
    }
  });
});

test.describe('Giới thiệu', () => {
  test('heading, label, short text, the button to Dịch vụ, two labelled photos, sample tag, facts', async ({ page }) => {
    await open(page, '/gioi-thieu');
    const sec = page.locator('#gioi-thieu');
    await expect(sec.getByRole('heading', { name: 'An tâm gửi gắm', level: 2 })).toBeVisible();
    await expect(sec.locator('h2 em')).toHaveText('gửi gắm');
    await expect(sec.getByText('VỀ LÊ SƠN', { exact: true })).toBeVisible();
    await expect(sec.getByText('Nội dung mẫu')).toBeVisible();
    const photos = sec.getByRole('img');
    const shown = page.viewportSize()!.width >= 640 ? 2 : 1; // the side photo is left out on phones to keep the page short
    await expect(photos).toHaveCount(shown);
    const alts = await photos.evaluateAll((els) => els.map((e) => e.getAttribute('alt')));
    expect(new Set(alts).size).toBe(shown);
    await expect(sec.getByText('Ảnh minh họa').filter({ visible: true })).toHaveCount(shown);
    await expect(sec.getByText('Nhận cấp cứu 24/24')).toBeVisible();
    await expect(sec.getByRole('link', { name: /097 355 51 05/ })).toHaveAttribute('href', 'tel:+84973555105');
    await expect(sec.getByRole('link', { name: 'Chỉ đường' })).toBeVisible();
    await sec.getByRole('link', { name: /Tìm hiểu Lê Sơn/ }).click();
    await expect(page.locator('#dich-vu')).toBeInViewport();
  });

  test('phones: text first, then the button, then the photos; no sideways scroll @narrow', async ({ page }) => {
    test.skip(page.viewportSize()!.width >= 900, 'the two columns sit side by side on wide screens');
    await open(page, '/gioi-thieu');
    await page.waitForTimeout(600);
    const order = await page.locator('#gioi-thieu').evaluate((sec) => {
      const y = (el: Element | null) => (el ? el.getBoundingClientRect().top : Infinity);
      return { title: y(sec.querySelector('h2')), button: y([...sec.querySelectorAll('a')].find((a) => /Tìm hiểu/.test(a.textContent ?? '')) ?? null), photo: y(sec.querySelector('img')) };
    });
    expect(order.title).toBeLessThan(order.button);
    expect(order.button).toBeLessThan(order.photo);
    await fitsDevice(page);
  });

  test('reduced motion: the text block is simply in place @motion-reduced', async ({ page }) => {
    await open(page, '/gioi-thieu');
    await page.waitForTimeout(300);
    expect(await page.locator('#gioi-thieu h2').evaluate((el) => getComputedStyle(el.parentElement!).transform)).toBe('none');
    expect(await page.locator('#gioi-thieu [data-glow]').evaluate((el) => getComputedStyle(el).transform)).toBe('none');
  });
});
