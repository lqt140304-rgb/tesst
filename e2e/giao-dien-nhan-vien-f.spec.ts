import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openStaff, staffMain as main } from './helpers';
import { fitsDevice } from './width';

const nav = (page: Page) => page.getByRole('navigation', { name: 'Khu nhân viên' });
const current = (page: Page) => main(page).locator('[data-period="current"]');
const previous = (page: Page) => main(page).locator('[data-period="previous"]');
const DATES = /^(Kỳ này|Kỳ trước): \d{2}\/\d{2}\/\d{4}( đến \d{2}\/\d{2}\/\d{4})?$/;

async function applyRange(page: Page, from: string, to: string) {
  await main(page).getByLabel('Từ ngày').fill(from);
  await main(page).getByLabel('Đến ngày').fill(to);
  await main(page).getByRole('button', { name: 'Xem', exact: true }).click();
}

test.describe('operations report page', () => {
  test('the manager opens on the last 7 days and sees which days this period and the one before cover', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao', 'quanly_ha');
    await expect(main(page).getByRole('heading', { level: 1, name: 'Báo cáo vận hành' })).toBeVisible();
    await expect(main(page).getByText('Công việc của Lê Sơn trong một kỳ, so với kỳ liền trước.')).toBeVisible();
    await expect(main(page).getByRole('radio', { name: '7 ngày' })).toBeChecked();
    await expect(current(page)).toHaveText(DATES);
    await expect(previous(page)).toHaveText(DATES);
    await expect(current(page)).toContainText('Kỳ này:');
    await expect(previous(page)).toContainText('Kỳ trước:');
  });

  test('changing the period changes the address and the days shown', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao', 'quanly_ha');
    await main(page).getByRole('radio', { name: 'Hôm nay' }).click();
    await expect(page).toHaveURL(/ky=hom-nay/);
    await expect(main(page).getByRole('radio', { name: 'Hôm nay' })).toBeChecked();
    await expect(current(page)).not.toContainText(' đến '); // one day
    await main(page).getByRole('radio', { name: 'Tháng này' }).click();
    await expect(page).toHaveURL(/ky=thang-nay/);
    await expect(current(page)).toContainText(' đến ');
  });

  test('a broken address falls back to 7 days without an error', async ({ page }) => {
    for (const bad of ['?ky=abc', '?tu=2026-02-30&den=2026-03-01', '?tu=2026-10-01']) {
      await openStaff(page, `/nv/bao-cao${bad}`, 'quanly_ha');
      await expect(main(page).getByRole('heading', { level: 1, name: 'Báo cáo vận hành' })).toBeVisible();
      await expect(main(page).getByRole('radio', { name: '7 ngày' })).toBeChecked();
    }
  });

  test('a bad free range shows the exact message and keeps the days on screen', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao', 'quanly_ha');
    const before = await current(page).innerText();
    await main(page).getByRole('radio', { name: 'Chọn ngày' }).click();
    await applyRange(page, '2026-10-20', '2026-10-01');
    await expect(main(page).getByText('Ngày kết thúc cần sau hoặc bằng ngày bắt đầu.')).toBeVisible();
    expect(await current(page).innerText()).toBe(before);
    await applyRange(page, '2024-01-01', '2026-10-22');
    await expect(main(page).getByText('Khoảng ngày tối đa 366 ngày.')).toBeVisible();
    expect(await current(page).innerText()).toBe(before);
  });

  test('a good free range is kept in the address', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao', 'quanly_ha');
    await main(page).getByRole('radio', { name: 'Chọn ngày' }).click();
    await applyRange(page, '2026-10-01', '2026-10-15');
    await expect(page).toHaveURL(/tu=2026-10-01&den=2026-10-15/);
    await expect(current(page)).toContainText('01/10/2026 đến 15/10/2026');
    await expect(previous(page)).toContainText('16/09/2026 đến 30/09/2026');
  });

  test('only people with the right see the menu entry, which sits just before Doanh thu', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao', 'quanly_ha');
    if ((page.viewportSize()?.width ?? 0) >= 768) { // phones fold the menu into tabs and a "more" sheet
      const names = (await nav(page).getByRole('link').allInnerTexts()).map((t) => t.trim());
      expect(names.indexOf('Báo cáo')).toBeGreaterThan(-1);
      expect(names.indexOf('Báo cáo')).toBe(names.indexOf('Doanh thu') - 1);
    }
    for (const as of ['bacsi_mai', 'spa_ngocanh']) {
      await openStaff(page, '/nv/bao-cao', as);
      await expect(nav(page).getByRole('link', { name: 'Báo cáo' })).toHaveCount(0);
      await expect(page.getByRole('heading', { level: 1, name: 'Mục này dành cho người có quyền phù hợp' })).toBeVisible();
    }
  });

  test('phones: the page fits the width @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await openStaff(page, '/nv/bao-cao', 'quanly_ha');
    await expect(current(page)).toBeVisible();
    await fitsDevice(page);
  });

  test('no serious accessibility violations on the empty frame', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao', 'quanly_ha');
    await expect(current(page)).toBeVisible();
    const r = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical').map((x) => x.id)).toEqual([]);
  });
});
