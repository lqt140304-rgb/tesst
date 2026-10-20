import { expect, test } from '@playwright/test';
import { open } from './helpers';

/** Review Focus 4 and 5: the storage and day-rollover banners appear in every zone, not only on the public site. */
test('storage denied: the staff zone still works and says changes will not be kept', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } });
  });
  await open(page, '/nv', { as: 'quanly_ha' });
  await expect(page.getByRole('heading', { name: /Chào buổi/ })).toBeVisible();
  await expect(page.locator('[data-zone="public"]')).toHaveCount(0);
  await expect(page.getByText('Bản demo không lưu được trên trình duyệt này.')).toBeVisible();
});

test('edited data from an earlier day: the customer zone offers to restore', async ({ page }) => {
  await open(page, '/');
  await page.evaluate(() => {
    const raw = localStorage.getItem('leson-demo:v1')!;
    const doc = JSON.parse(raw) as { seededAt: string; dirty: boolean };
    doc.seededAt = '2026-01-01';
    doc.dirty = true;
    localStorage.setItem('leson-demo:v1', JSON.stringify(doc));
  });
  await page.reload();
  await open(page, '/khach-hang', { as: 'lan_nguyen' });
  await expect(page.locator('[data-zone="customer"] h1').first()).toBeVisible();
  await expect(page.locator('[data-zone="public"]')).toHaveCount(0);
  await expect(page.getByText(/Dữ liệu mẫu được tạo ngày 01\/01\/2026/)).toBeVisible();
});
