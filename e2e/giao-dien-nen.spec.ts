import { expect, test, type Page } from '@playwright/test';
import { noHorizontalScroll, open } from './helpers';

/** Redesign part 1 — the foundation, seen on the review page #/_giao-dien (axe runs via manifest in a11y.spec). */
const table = (page: Page) => page.getByRole('region', { name: 'Danh sách khách hàng mẫu' });
const detail = (page: Page) => page.getByRole('region', { name: 'Chi tiết khách hàng' });
const range = (page: Page) => page.getByText(/^Hiển thị \d+–\d+ của \d+ khách hàng$/);

test.describe('redesign foundation (#/_giao-dien)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page, '/_giao-dien');
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Bộ giao diện', level: 1 })).toBeVisible();
  });

  test('keyboard: arrow to the second customer, Enter opens it and focus moves into the detail', async ({ page }) => {
    const rows = table(page).locator('tbody tr');
    await rows.first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(rows.nth(1)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(detail(page).getByRole('heading', { name: 'Trần Hoàng' })).toBeVisible();
    await expect(detail(page).getByRole('heading', { name: 'Trần Hoàng' })).toBeFocused();
  });

  test('paging shows the range and is remembered after reload', async ({ page }) => {
    await expect(range(page)).toHaveText('Hiển thị 1–5 của 12 khách hàng');
    await page.getByRole('button', { name: 'Trang sau' }).click();
    await expect(range(page)).toHaveText('Hiển thị 6–10 của 12 khách hàng');
    await page.reload();
    await expect(range(page)).toHaveText('Hiển thị 6–10 của 12 khách hàng');
  });

  test('searching from the last page lands on a real page, never an empty one', async ({ page }) => {
    await page.getByRole('button', { name: 'Trang 3' }).click();
    await expect(range(page)).toHaveText('Hiển thị 11–12 của 12 khách hàng');
    await page.getByRole('searchbox', { name: 'Tìm khách hàng mẫu' }).fill('Lan');
    await expect(range(page)).toHaveText('Hiển thị 1–2 của 2 khách hàng');
  });

  test('a pet without a photo shows its species icon, named for screen readers', async ({ page }) => {
    await expect(page.locator('[data-pet-avatar="icon"][aria-label="Mít"]')).toBeVisible();
    await expect(page.locator('[data-pet-avatar="photo"] img[alt="Miu"]').first()).toBeVisible();
  });

  test('save state: a failed save never shows "Đã lưu"', async ({ page }) => {
    const box = page.locator('[data-demo="save"]');
    await box.getByRole('button', { name: 'Sửa' }).click();
    await expect(box.getByRole('status')).toHaveText('Bản nháp · Chưa lưu thay đổi');
    await box.getByRole('button', { name: 'Lưu (lỗi)' }).click();
    await expect(box.getByRole('status')).toHaveText('Chưa lưu thay đổi');
    await box.getByRole('button', { name: 'Lưu (thành công)' }).click();
    await expect(box.getByRole('status')).toHaveText('Đã lưu');
  });

  test('reduced motion: the detail panel does not slide @motion-reduced', async ({ page }) => {
    await table(page).locator('tbody tr').first().click();
    await page.waitForTimeout(50);
    const transform = await page.locator('[data-detail]').evaluate((el) => getComputedStyle(el).transform);
    expect(transform).toBe('none');
  });

  test('phones: no sideways scroll, rows are labelled cards, a row opens full width @narrow', async ({ page }) => {
    await noHorizontalScroll(page);
    test.skip(page.viewportSize()!.width >= 768, 'cards and full-width detail are phone layouts');
    const label = await table(page).locator('tbody td').nth(1).evaluate((el) => getComputedStyle(el, '::before').content);
    expect(label).toContain('Số điện thoại');
    await table(page).locator('tbody tr').first().click();
    await expect(detail(page)).toBeVisible();
    await expect(page.locator('[data-md-list]')).toBeHidden();
    await page.getByRole('button', { name: 'Danh sách khách hàng' }).click();
    await expect(table(page)).toBeVisible();
  });
});
