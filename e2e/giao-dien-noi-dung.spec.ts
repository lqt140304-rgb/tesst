import { expect, test, type Page } from '@playwright/test';
import { openStaff, staffMain as main } from './helpers';

const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 768;
const nav = (page: Page) => page.getByRole('navigation', { name: 'Khu nhân viên' });

type Demo = { loginAs(u: string): Promise<unknown>; api: { staff: { team: { list(): Promise<{ id: string; username: string; version: number; name: string; title: string; presets: string[]; extraCaps: string[] }[]>; update(id: string, v: number, i: unknown): Promise<void> } } } };

/** Gives Spa the publishing right through the manager's account, then signs back in as Spa. */
async function grantSpa(page: Page) {
  await page.evaluate(async () => {
    const d = (window as unknown as { __lesonDemo: Demo }).__lesonDemo;
    await d.loginAs('quanly_ha');
    const spa = (await d.api.staff.team.list()).find((r) => r.username === 'spa_ngocanh')!;
    await d.api.staff.team.update(spa.id, spa.version, { display_name: spa.name, title: spa.title, preset_ids: spa.presets, extra_capabilities: [...spa.extraCaps, 'content.publish'] });
    await d.loginAs('spa_ngocanh');
  });
}

async function menuLink(page: Page) {
  if (wide(page)) return nav(page).getByRole('link', { name: 'Trang giới thiệu' });
  await page.getByRole('button', { name: 'Thêm', exact: true }).click();
  return page.getByRole('dialog').getByRole('link', { name: 'Trang giới thiệu' });
}

test.describe('khung màn nội dung', () => {
  for (const user of ['quanly_ha', 'bacsi_mai']) {
    test(`${user} sees the menu entry and opens the screen`, async ({ page }) => {
      await openStaff(page, '/nv', user);
      await expect(await menuLink(page)).toBeVisible();
    });
  }

  test('Spa has no menu entry and a typed address shows the no-rights page', async ({ page }) => {
    await openStaff(page, '/nv', 'spa_ngocanh');
    if (wide(page)) await expect(nav(page).getByRole('link', { name: 'Trang giới thiệu' })).toHaveCount(0);
    else {
      await page.getByRole('button', { name: 'Thêm', exact: true }).click();
      await expect(page.getByRole('dialog').getByRole('link', { name: 'Trang giới thiệu' })).toHaveCount(0);
    }
    await page.evaluate(() => { location.hash = '/nv/trang-gioi-thieu'; });
    await expect(page.getByRole('heading', { level: 1, name: 'Mục này dành cho người có quyền phù hợp' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Nội dung trang giới thiệu' })).toHaveCount(0);
  });

  test('a single right granted to Spa opens the screen', async ({ page }) => {
    await openStaff(page, '/nv', 'spa_ngocanh');
    await grantSpa(page);
    await page.evaluate(() => { location.hash = '/nv/trang-gioi-thieu'; });
    await expect(page.getByRole('heading', { level: 1, name: 'Nội dung trang giới thiệu' })).toBeVisible();
  });

  test('the page has two tabs kept in the address, a current menu entry and an outside link', async ({ page }) => {
    await openStaff(page, '/nv/trang-gioi-thieu', 'quanly_ha');
    const m = main(page);
    await expect(m.getByRole('heading', { level: 1, name: 'Nội dung trang giới thiệu' })).toBeVisible();
    await expect(m.getByRole('tab', { name: /Sản phẩm/ })).toHaveAttribute('aria-selected', 'true');
    await m.getByRole('tab', { name: /Câu chuyện/ }).click();
    await expect(page).toHaveURL(/tab=cau-chuyen/);
    await expect(m.getByRole('tab', { name: /Câu chuyện/ })).toHaveAttribute('aria-selected', 'true');
    await openStaff(page, '/nv/trang-gioi-thieu?tab=cau-chuyen', 'quanly_ha');
    await expect(m.getByRole('tab', { name: /Câu chuyện/ })).toHaveAttribute('aria-selected', 'true');
    if (wide(page)) await expect(nav(page).getByRole('link', { name: 'Trang giới thiệu' })).toHaveAttribute('aria-current', 'page');
    const out = m.getByRole('link', { name: 'Xem trang giới thiệu' });
    await expect(out).toHaveAttribute('target', '_blank');
    await expect(out).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('the permission picker has its own "Nội dung" group', async ({ page }) => {
    await openStaff(page, '/nv/cai-dat/tai-khoan', 'quanly_ha');
    await page.getByRole('button', { name: /Thêm nhân viên/ }).click();
    const d = page.getByRole('dialog');
    const group = d.getByRole('group', { name: 'Nội dung' });
    await expect(group.getByText('Đăng nội dung trang giới thiệu')).toBeVisible();
    await expect(d.getByRole('group', { name: 'Báo cáo và cài đặt' }).getByText('Đăng nội dung trang giới thiệu')).toHaveCount(0);
  });
});
