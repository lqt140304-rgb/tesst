import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openStaff, staffMain as main } from './helpers';
import { fitsDevice } from './width';

const HELP = '/nv/tro-giup';
const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 768;
const search = (page: Page) => main(page).getByRole('searchbox', { name: 'Tìm trong hướng dẫn' });
const articles = (page: Page) => main(page).locator('[data-article]');
const NO_MATCH = 'Chưa có bài nào khớp. Thử từ khác, hoặc hỏi Quản lý ở tab Góp ý.';

test.describe('help page', () => {
  for (const user of ['quanly_ha', 'bacsi_mai', 'spa_ngocanh']) {
    test(`${user} has the Trợ giúp entry in the menu`, async ({ page }) => {
      await openStaff(page, '/nv', user);
      if (wide(page)) {
        await expect(page.getByRole('navigation', { name: 'Khu nhân viên' }).getByRole('link', { name: 'Trợ giúp' })).toBeVisible();
      } else {
        await page.getByRole('button', { name: 'Thêm', exact: true }).click();
        await expect(page.getByRole('dialog').getByRole('link', { name: 'Trợ giúp' })).toBeVisible();
      }
    });
  }

  test('opens on the guides tab with a title and the list of articles', async ({ page }) => {
    await openStaff(page, HELP, 'bacsi_mai');
    await expect(main(page).getByRole('heading', { level: 1, name: 'Trợ giúp' })).toBeVisible();
    await expect(main(page).getByRole('tab', { name: 'Hướng dẫn' })).toHaveAttribute('aria-selected', 'true');
    await expect(main(page).getByRole('tab', { name: 'Hộp thư' })).toHaveCount(0);
    expect(await articles(page).count()).toBeGreaterThan(3);
    await expect(articles(page).first()).toContainText('Nội dung mẫu');
  });

  test('search ignores accents and only finds what the role may see', async ({ page }) => {
    await openStaff(page, HELP, 'quanly_ha');
    await search(page).fill('yeu cau dat lich');
    await expect(articles(page).filter({ hasText: 'Xử lý yêu cầu đặt lịch' })).toBeVisible();
    await openStaff(page, HELP, 'spa_ngocanh');
    await search(page).fill('thu tien');
    await expect(main(page).getByRole('status').filter({ hasText: /^Có \d+ bài\.$|^Chưa có bài nào khớp/ })).toBeVisible();
    await expect(articles(page).filter({ hasText: 'Thu tiền tại quầy' })).toHaveCount(0); // Spa may not take payments
    await search(page).fill('xyzxyz');
    await expect(main(page).getByText(NO_MATCH).first()).toBeVisible();
    await expect(articles(page)).toHaveCount(0);
    await search(page).fill('');
    await expect(articles(page).filter({ hasText: 'Lập và phát hành hóa đơn' })).toHaveCount(0);
  });

  test('quick typing shows the results of the last thing typed', async ({ page }) => {
    await openStaff(page, HELP, 'quanly_ha');
    await search(page).fill('yeu cau');
    await search(page).fill('doanh thu');
    await expect(articles(page).filter({ hasText: 'Xem doanh thu' })).toBeVisible();
    await expect(articles(page).filter({ hasText: 'Xử lý yêu cầu đặt lịch' })).toHaveCount(0);
  });

  test('an article opens in the page, keeps its address, and a wrong address falls back', async ({ page }) => {
    await openStaff(page, HELP, 'quanly_ha');
    await articles(page).filter({ hasText: 'Thu tiền tại quầy' }).first().click();
    await expect(page).toHaveURL(/bai=thu-tien/);
    const m = main(page);
    await expect(m.getByRole('heading', { level: 2, name: 'Thu tiền tại quầy' })).toBeVisible();
    await expect(m.locator('[data-article-body] ol li').first()).toBeVisible();
    await expect(m.locator('[data-article-body]').getByText('Nội dung mẫu')).toBeVisible();
    await page.reload();
    await expect(main(page).getByRole('heading', { level: 2, name: 'Thu tiền tại quầy' })).toBeVisible();
    await openStaff(page, `${HELP}?bai=khong-co`, 'quanly_ha');
    await expect(main(page).locator('[data-article-body]')).toHaveCount(0);
    await expect(page).not.toHaveURL(/bai=/);
  });

  test('an article the role may not see is not opened by the address', async ({ page }) => {
    await openStaff(page, `${HELP}?bai=thu-tien`, 'spa_ngocanh');
    await expect(main(page).locator('[data-article-body]')).toHaveCount(0);
    await expect(page).not.toHaveURL(/bai=/);
  });

  test('has no accessibility violations @a11y', async ({ page }) => {
    await openStaff(page, `${HELP}?bai=kho`, 'quanly_ha');
    await expect(main(page).locator('[data-article-body]')).toBeVisible();
    const results = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).analyze();
    expect(results.violations).toEqual([]);
  });

  test('fits the device width @narrow', async ({ page }) => {
    await openStaff(page, HELP, 'quanly_ha');
    await fitsDevice(page);
    await articles(page).first().click();
    await fitsDevice(page);
  });
});
