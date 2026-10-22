import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openStaff, staffMain as main, trackErrors } from './helpers';
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

test.describe('blocked page explains itself', () => {
  test('says which right is missing and links to the article about rights', async ({ page }) => {
    await openStaff(page, '/nv/doanh-thu', 'bacsi_mai');
    await expect(page.getByRole('heading', { name: 'Mục này dành cho người có quyền phù hợp' })).toBeVisible();
    await expect(page.getByText('Quyền cần có: Xem doanh thu')).toBeVisible();
    await page.getByRole('link', { name: 'Xem bài về quyền' }).click();
    await expect(page).toHaveURL(/tro-giup\?bai=quyen-cua-toi/);
    await expect(main(page).getByRole('heading', { level: 2, name: /Quyền của tôi và vì sao có nút bị ẩn/ })).toBeVisible();
  });

  test('names the right for the accounts page too', async ({ page }) => {
    await openStaff(page, '/nv/cai-dat/tai-khoan', 'spa_ngocanh');
    await expect(page.getByText('Quyền cần có: Quản lý tài khoản nhân viên')).toBeVisible();
  });

  test('a page the person may open shows none of this', async ({ page }) => {
    await openStaff(page, '/nv/lich-hen', 'bacsi_mai');
    await expect(page.getByText(/^Quyền cần có/)).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Xem bài về quyền' })).toHaveCount(0);
  });

  test('has no accessibility violations @a11y', async ({ page }) => {
    await openStaff(page, '/nv/doanh-thu', 'bacsi_mai');
    await expect(page.getByText('Quyền cần có: Xem doanh thu')).toBeVisible();
    const results = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).analyze();
    expect(results.violations).toEqual([]);
  });
});

const first = (page: Page) => main(page).getByRole('region', { name: 'Việc đầu tiên' });
const task = (page: Page, label: string) => first(page).locator('[data-task]').filter({ hasText: label });
const go = (page: Page, route: string) => page.evaluate((r) => { location.hash = r; }, route);

test.describe('first tasks', () => {
  test('are ticked by doing the thing, once each, and counted', async ({ page }) => {
    await openStaff(page, '/nv', 'bacsi_mai');
    await expect(first(page)).toBeVisible();
    await expect(first(page)).toContainText('Đã làm 1/');
    for (const route of ['/nv/lich-hen', '/nv/bang-gia', '/nv/noi-tru', '/nv/khach-hang/cus-01', '/nv/lich-hen']) {
      await go(page, route);
      await expect(page).toHaveURL(new RegExp(`#${route.replace(/\//g, '\\/')}$`));
      await page.waitForTimeout(500); // the screen has to be on show (and its chunk loaded) before it counts as seen
    }
    await go(page, '/nv');
    await expect(first(page)).toContainText('Đã làm 5/');
    await expect(task(page, 'Xem lịch hẹn')).toHaveAttribute('data-done', 'true');
    await expect(task(page, 'Xem bảng giá')).toHaveAttribute('data-done', 'true');
    await expect(task(page, 'Xem bảng nội trú')).toHaveAttribute('data-done', 'true');
    await expect(task(page, 'Mở hồ sơ một khách hàng')).toHaveAttribute('data-done', 'true');
  });

  test('a draft invoice and a payment tick their lines', async ({ page }) => {
    await openStaff(page, '/nv/hoa-don/moi?khach=cus-05', 'quanly_ha');
    await main(page).getByRole('button', { name: 'Tạo hóa đơn nháp' }).click();
    await expect(page).toHaveURL(/#\/nv\/hoa-don\/(?!moi)[^/]+$/);
    await go(page, '/nv/hoa-don/inv-27');
    await main(page).getByRole('button', { name: 'Ghi nhận thanh toán' }).click();
    await page.getByRole('dialog', { name: 'Ghi nhận thanh toán' }).getByRole('button', { name: 'Xác nhận đã nhận tiền' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await go(page, '/nv');
    await expect(task(page, 'Lập một hóa đơn nháp')).toHaveAttribute('data-done', 'true');
    await expect(task(page, 'Thu tiền cho một hóa đơn')).toHaveAttribute('data-done', 'true');
  });

  test('a role only sees the tasks that fit it, and a blocked page leaves no error', async ({ page }) => {
    const errors = trackErrors(page);
    await openStaff(page, '/nv', 'spa_ngocanh');
    await expect(first(page)).toBeVisible();
    for (const label of ['Lập một hóa đơn nháp', 'Thu tiền cho một hóa đơn', 'Xử lý một yêu cầu đặt lịch']) await expect(task(page, label)).toHaveCount(0);
    await go(page, '/nv/bao-cao');
    await expect(page.getByRole('heading', { name: 'Mục này dành cho người có quyền phù hợp' })).toBeVisible();
    expect(errors.filter((e) => !/favicon/.test(e))).toEqual([]);
  });

  test('can be hidden, and brought back from Tùy chọn của tôi', async ({ page }) => {
    await openStaff(page, '/nv', 'bacsi_mai');
    await first(page).getByRole('button', { name: 'Ẩn danh sách' }).click();
    await expect(first(page)).toHaveCount(0);
    await page.reload();
    await expect(main(page).getByRole('heading', { level: 1 })).toBeVisible();
    await expect(first(page)).toHaveCount(0);
    await openStaff(page, '/nv/cai-dat/tuy-chon', 'bacsi_mai');
    const show = main(page).getByRole('checkbox', { name: 'Hiện danh sách việc đầu tiên' });
    await expect(show).not.toBeChecked();
    await show.click();
    await expect(main(page).getByText('Đã lưu.')).toBeVisible();
    await openStaff(page, '/nv', 'bacsi_mai');
    await expect(first(page)).toBeVisible();
  });

  test('"Về mặc định" says it also resets the list and brings it back', async ({ page }) => {
    await openStaff(page, '/nv', 'bacsi_mai');
    await first(page).getByRole('button', { name: 'Ẩn danh sách' }).click();
    await openStaff(page, '/nv/cai-dat/tuy-chon', 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Về mặc định' }).click();
    const d = page.getByRole('dialog', { name: 'Đưa mọi tùy chọn về mặc định?' });
    await expect(d).toContainText('danh sách việc đầu tiên');
    await d.getByRole('button', { name: 'Về mặc định' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await openStaff(page, '/nv', 'bacsi_mai');
    await expect(first(page)).toBeVisible();
    await expect(task(page, 'Xem lịch hẹn')).toHaveAttribute('data-done', 'false');
  });

  test('has no accessibility violations and fits the phone @a11y @narrow', async ({ page }) => {
    await openStaff(page, '/nv', 'quanly_ha');
    await expect(first(page)).toBeVisible();
    const results = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).analyze();
    expect(results.violations).toEqual([]);
    await fitsDevice(page);
  });
});

const FEEDBACK = `${HELP}?tab=gop-y`;
const kind = (page: Page, name: string) => main(page).getByRole('radiogroup', { name: 'Loại phiếu' }).getByRole('radio', { name, exact: true });
const box = (page: Page, label: string) => main(page).getByLabel(label, { exact: true });
const mine = (page: Page) => main(page).locator('[data-ticket]');

async function sendTicket(page: Page, k: string, title: string, body: string) {
  await kind(page, k).click();
  await box(page, 'Tiêu đề').fill(title);
  await box(page, 'Nội dung').fill(body);
  await main(page).getByRole('button', { name: 'Gửi phiếu' }).click();
}

test.describe('my tickets', () => {
  test('refuses an empty ticket under its own boxes and counts the characters', async ({ page }) => {
    await openStaff(page, FEEDBACK, 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Gửi phiếu' }).click();
    await expect(main(page).getByText('Tiêu đề cần từ 1 đến 80 ký tự.')).toBeVisible();
    await expect(main(page).getByText('Nội dung cần từ 1 đến 1000 ký tự.')).toBeVisible();
    await box(page, 'Tiêu đề').fill('x'.repeat(81));
    await expect(main(page).getByText('81/80')).toBeVisible();
    await box(page, 'Nội dung').fill('Có nội dung');
    await main(page).getByRole('button', { name: 'Gửi phiếu' }).click();
    await expect(main(page).getByText('Tiêu đề cần từ 1 đến 80 ký tự.')).toBeVisible();
  });

  test('sends a ticket, shows it as new at the top of the list and empties the form', async ({ page }) => {
    await openStaff(page, FEEDBACK, 'bacsi_mai');
    await sendTicket(page, 'Báo lỗi', 'Nút lưu không bấm được', 'Ở màn hình nhật ký, nút Lưu nháp bị mờ.');
    await expect(page.getByRole('status').filter({ hasText: /Đã gửi phiếu HT-\d+\./ })).toBeVisible();
    await expect(box(page, 'Tiêu đề')).toHaveValue('');
    await expect(mine(page).first()).toContainText('Nút lưu không bấm được');
    await expect(mine(page).first()).toContainText('Mới');
    await expect(mine(page).first()).toContainText('Báo lỗi');
  });

  test('the same ticket again while the first waits is refused, and a double click makes one', async ({ page }) => {
    await openStaff(page, FEEDBACK, 'bacsi_mai');
    await kind(page, 'Góp ý').click();
    await box(page, 'Tiêu đề').fill('Thêm nút in nhanh');
    await box(page, 'Nội dung').fill('Cho phép in bảng nội trú.');
    const send = main(page).getByRole('button', { name: 'Gửi phiếu' });
    await send.dblclick();
    await expect(mine(page).filter({ hasText: 'Thêm nút in nhanh' })).toHaveCount(1);
    await box(page, 'Tiêu đề').fill('Thêm nút in nhanh');
    await box(page, 'Nội dung').fill('Cho phép in bảng nội trú.');
    await kind(page, 'Góp ý').click();
    await send.click();
    await expect(main(page).getByText('Bạn vừa gửi phiếu này rồi, đang chờ trả lời.')).toBeVisible();
    await expect(mine(page).filter({ hasText: 'Thêm nút in nhanh' })).toHaveCount(1);
  });

  test('a ticket opens to show its text, and nobody else sees it', async ({ page }) => {
    await openStaff(page, FEEDBACK, 'bacsi_mai');
    await sendTicket(page, 'Hỏi cách dùng', 'Hỏi về thu tiền', 'Làm sao thu một phần tiền?');
    await mine(page).filter({ hasText: 'Hỏi về thu tiền' }).getByRole('button').first().click();
    await expect(mine(page).filter({ hasText: 'Hỏi về thu tiền' })).toContainText('Làm sao thu một phần tiền?');
    await openStaff(page, FEEDBACK, 'bacsi_duc');
    await expect(main(page).getByText('Hỏi về thu tiền')).toHaveCount(0);
  });

  test('asking from the account menu fills in the screen the person came from', async ({ page }) => {
    await openStaff(page, '/nv/lich-hen', 'bacsi_mai');
    await page.getByRole('button', { name: /^Tài khoản của/ }).first().click();
    await page.getByRole('menuitem', { name: 'Hỏi hoặc góp ý' }).click();
    await expect(page).toHaveURL(/tro-giup\?tab=gop-y&man=L/);
    await expect(main(page).getByLabel(/^Màn hình/)).toHaveValue('Lịch hẹn');
    await expect(main(page).getByRole('tab', { name: 'Góp ý của tôi' })).toHaveAttribute('aria-selected', 'true');
  });

  test('has no accessibility violations and fits the phone @a11y @narrow', async ({ page }) => {
    await openStaff(page, FEEDBACK, 'bacsi_mai');
    await sendTicket(page, 'Góp ý', 'Một ý kiến', 'Nội dung ngắn.');
    await expect(mine(page).first()).toBeVisible();
    const results = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).analyze();
    expect(results.violations).toEqual([]);
    await fitsDevice(page);
  });
});
