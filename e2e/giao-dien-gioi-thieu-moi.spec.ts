import { expect, test, type Page } from '@playwright/test';
import { open } from './helpers';

/** Part 7: the redesigned hero and intro page (spec 2026-10-23-phan-7). */

type Row = { id: string; version: number };
type Lists = { list(): Promise<Row[]>; setVisible(id: string, v: number, visible: boolean): Promise<void> };
type Demo = { loginAs(u: string): Promise<unknown>; api: { staff: { content: { products: Lists; cases: Lists } } } };

/** Hides every featured product and/or story through the manager's account, so those sections leave the page. */
async function hideFeatured(page: Page, which: ('products' | 'cases')[]) {
  await page.evaluate(async (kinds) => {
    const d = (window as unknown as { __lesonDemo: Demo }).__lesonDemo;
    await d.loginAs('quanly_ha');
    for (const k of kinds) {
      const list = d.api.staff.content[k];
      for (const r of await list.list()) await list.setVisible(r.id, r.version, false);
    }
  }, which);
}

const sectionBackgrounds = (page: Page) => page.evaluate(() =>
  [...document.querySelectorAll('#noi-dung section[id]')].filter((s) => s.id !== 'hero-main').map((s) => ({ id: s.id, bg: getComputedStyle(s).backgroundColor })));

test.describe('nền xen kẽ', () => {
  test('two neighbouring sections never share a background', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toBeAttached();
    await expect(page.locator('#san-pham')).toBeAttached();
    const rows = await sectionBackgrounds(page);
    expect(rows.length).toBeGreaterThanOrEqual(9);
    for (let i = 1; i < rows.length; i++) expect(rows[i]!.bg, `${rows[i - 1]!.id} / ${rows[i]!.id}`).not.toBe(rows[i - 1]!.bg);
  });

  test('the first section is warm cream', async ({ page }) => {
    await open(page, '/');
    expect((await sectionBackgrounds(page))[0]!.bg).toBe('rgb(251, 247, 241)');
  });

  test('with no featured product and no story left, the neighbours still differ', async ({ page }) => {
    await open(page, '/');
    await hideFeatured(page, ['products', 'cases']);
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toHaveCount(0);
    await expect(page.locator('#san-pham')).toHaveCount(0);
    const rows = await sectionBackgrounds(page);
    expect(rows.length).toBe(7);
    for (let i = 1; i < rows.length; i++) expect(rows[i]!.bg, `${rows[i - 1]!.id} / ${rows[i]!.id}`).not.toBe(rows[i - 1]!.bg);
  });
});
