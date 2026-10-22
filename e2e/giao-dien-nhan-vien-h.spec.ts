import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { open, openStaff, staffMain as main } from './helpers';
import { fitsDevice } from './width';

const attrs = (page: Page) => page.evaluate(() => {
  const d = document.documentElement.dataset;
  return { text: d.staffText ?? null, density: d.staffDensity ?? null, motion: d.staffMotion ?? null };
});

test.describe('prefs plumbing', () => {
  test('a staff session carries the three appearance attributes, with the defaults before anything is chosen', async ({ page }) => {
    await openStaff(page, '/nv', 'bacsi_mai');
    expect(await attrs(page)).toEqual({ text: 'md', density: 'comfortable', motion: 'system' });
  });

  test('they go away on sign-out and never reach the public site or the customer zone', async ({ page }) => {
    await openStaff(page, '/nv', 'bacsi_mai');
    await page.evaluate(async () => { await (window as unknown as { __lesonDemo: { logout(): Promise<void> } }).__lesonDemo.logout(); });
    await page.evaluate(() => { location.hash = '/'; });
    await expect.poll(() => attrs(page)).toEqual({ text: null, density: null, motion: null });
    await open(page, '/khach-hang', { as: 'lan_nguyen' });
    await expect(page.locator('[data-zone="customer"] main')).toBeVisible();
    expect(await attrs(page)).toEqual({ text: null, density: null, motion: null });
  });
});

const PREFS = '/nv/cai-dat/tuy-chon';
const group = (page: Page, name: string) => main(page).getByRole('radiogroup', { name });
const pick = (page: Page, name: string, option: string) => group(page, name).getByRole('radio', { name: option, exact: true });
const saved = (page: Page) => main(page).getByText('Đã lưu.');

async function signInAs(page: Page, username: string, password: string) {
  await page.evaluate(async () => { await (window as unknown as { __lesonDemo: { logout(): Promise<void> } }).__lesonDemo.logout(); });
  await page.evaluate(() => { location.hash = '/dang-nhap/nhan-vien'; });
  await page.getByLabel('Tên đăng nhập').fill(username);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
}

test.describe('personal options page', () => {
  test('is the second page of Cài đặt for every role', async ({ page }) => {
    for (const user of ['quanly_ha', 'bacsi_mai', 'spa_ngocanh']) {
      await openStaff(page, '/nv/cai-dat/ho-so', user);
      const links = main(page).getByRole('navigation', { name: 'Cài đặt' }).getByRole('link');
      await expect(links.nth(1)).toHaveText('Tùy chọn của tôi');
    }
  });

  test('shows four groups, each choice a named group of buttons', async ({ page }) => {
    await openStaff(page, PREFS, 'quanly_ha');
    const m = main(page);
    await expect(m.getByRole('heading', { level: 1, name: 'Tùy chọn của tôi' })).toBeVisible();
    for (const h of ['Giao diện', 'Khi đăng nhập', 'Màn hình làm việc', 'Nhắc việc']) await expect(m.getByRole('heading', { level: 2, name: h })).toBeVisible();
    for (const g of ['Cỡ chữ', 'Độ dày bảng', 'Chuyển động', 'Trang vào sau đăng nhập', 'Kiểu xem lịch', 'Số dòng mỗi trang', 'Khoảng ngày báo cáo']) await expect(group(page, g)).toBeVisible();
    await expect(pick(page, 'Cỡ chữ', 'Vừa')).toBeChecked();
    await expect(pick(page, 'Độ dày bảng', 'Thoáng')).toBeChecked();
    await expect(pick(page, 'Chuyển động', 'Theo máy')).toBeChecked();
    await expect(pick(page, 'Số dòng mỗi trang', '20')).toBeChecked();
    await expect(pick(page, 'Khoảng ngày báo cáo', '7 ngày qua')).toBeChecked();
  });

  test('offers only what the role may open or receive', async ({ page }) => {
    await openStaff(page, PREFS, 'spa_ngocanh');
    let m = main(page);
    await expect(group(page, 'Trang vào sau đăng nhập').getByRole('radio')).toHaveText(['Trang chủ', 'Lịch hẹn', 'Nội trú']);
    for (const n of ['Yêu cầu đặt lịch chờ xử lý', 'Khách xin đổi lịch', 'Hóa đơn nháp lâu chưa phát hành']) await expect(m.getByRole('checkbox', { name: n })).toHaveCount(0);
    await openStaff(page, PREFS, 'quanly_ha');
    m = main(page);
    await expect(group(page, 'Trang vào sau đăng nhập').getByRole('radio')).toHaveText(['Trang chủ', 'Lịch hẹn', 'Nội trú', 'Hóa đơn']);
    for (const n of ['Yêu cầu đặt lịch chờ xử lý', 'Khách xin đổi lịch', 'Kho sắp hết', 'Hóa đơn nháp lâu chưa phát hành']) await expect(m.getByRole('checkbox', { name: n })).toBeVisible();
  });

  test('a choice is saved at once, shows "Đã lưu." and survives a reload', async ({ page }) => {
    await openStaff(page, PREFS, 'bacsi_mai');
    await pick(page, 'Cỡ chữ', 'Lớn').click();
    await expect(saved(page)).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-staff-text', 'lg');
    await page.reload();
    await expect(pick(page, 'Cỡ chữ', 'Lớn')).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-staff-text', 'lg');
  });

  test('a switch is saved too', async ({ page }) => {
    await openStaff(page, PREFS, 'quanly_ha');
    const box = main(page).getByRole('checkbox', { name: 'Kho sắp hết' });
    await expect(box).toBeChecked();
    await box.click();
    await expect(saved(page)).toBeVisible();
    await page.reload();
    await expect(main(page).getByRole('checkbox', { name: 'Kho sắp hết' })).not.toBeChecked();
  });

  test('the arrow keys move the choice and save it', async ({ page }) => {
    await openStaff(page, PREFS, 'bacsi_mai');
    await pick(page, 'Độ dày bảng', 'Thoáng').focus();
    await page.keyboard.press('ArrowRight');
    await expect(pick(page, 'Độ dày bảng', 'Gọn')).toBeChecked();
    await expect(saved(page)).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-staff-density', 'compact');
  });

  test('"Về mặc định" asks first; "Để sau" changes nothing, the confirm puts everything back', async ({ page }) => {
    await openStaff(page, PREFS, 'bacsi_mai');
    await pick(page, 'Cỡ chữ', 'Lớn').click();
    await expect(saved(page)).toBeVisible();
    await main(page).getByRole('button', { name: 'Về mặc định' }).click();
    const d = page.getByRole('dialog', { name: 'Đưa mọi tùy chọn về mặc định?' });
    await d.getByRole('button', { name: 'Để sau' }).click();
    await expect(pick(page, 'Cỡ chữ', 'Lớn')).toBeChecked();
    await main(page).getByRole('button', { name: 'Về mặc định' }).click();
    await d.getByRole('button', { name: 'Về mặc định' }).click();
    await expect(pick(page, 'Cỡ chữ', 'Vừa')).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-staff-text', 'md');
  });

  test('options do not follow the browser to the next person', async ({ page }) => {
    await openStaff(page, PREFS, 'bacsi_mai');
    await pick(page, 'Cỡ chữ', 'Lớn').click();
    await expect(saved(page)).toBeVisible();
    await signInAs(page, 'bacsi_duc', 'leson-demo');
    await expect(page).toHaveURL(/#\/nv/);
    await expect(page.locator('html')).toHaveAttribute('data-staff-text', 'md');
  });

  test('two tabs: different options both stay; the same option follows the latest', async ({ page, context }) => {
    await openStaff(page, PREFS, 'bacsi_mai');
    const other = await context.newPage();
    await openStaff(other, PREFS, 'bacsi_mai');
    await pick(other, 'Độ dày bảng', 'Gọn').click();
    await expect(saved(other)).toBeVisible();
    await pick(page, 'Cỡ chữ', 'Lớn').click();
    await expect(saved(page)).toBeVisible();
    await page.reload();
    await expect(pick(page, 'Cỡ chữ', 'Lớn')).toBeChecked();
    await expect(pick(page, 'Độ dày bảng', 'Gọn')).toBeChecked();
    await pick(other, 'Cỡ chữ', 'Vừa').click();
    await expect(saved(other)).toBeVisible();
    await expect(pick(page, 'Cỡ chữ', 'Vừa')).toBeChecked();
  });

  test('has no accessibility violations @a11y', async ({ page }) => {
    await openStaff(page, PREFS, 'quanly_ha');
    const results = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).analyze();
    expect(results.violations).toEqual([]);
  });

  test('fits the device width @narrow', async ({ page }) => {
    await openStaff(page, PREFS, 'quanly_ha');
    await fitsDevice(page);
  });
});

async function choose(page: Page, user: string, picks: [group: string, option: string][]) {
  await openStaff(page, PREFS, user);
  for (const [g, o] of picks) {
    await pick(page, g, o).click();
    await expect(pick(page, g, o)).toBeChecked();
  }
  await expect(saved(page)).toBeVisible();
}
const go = (page: Page, route: string) => page.evaluate((r) => { location.hash = r; }, route);

test.describe('options have effect', () => {
  test('the large text size zooms the staff area by 12.5%', async ({ page }) => {
    await choose(page, 'quanly_ha', [['Cỡ chữ', 'Lớn']]);
    await go(page, '/nv/khach-hang');
    await expect(main(page).getByRole('heading', { level: 1, name: 'Khách hàng' })).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('[data-zone="staff"]')!).zoom)).toBe('1.125');
  });

  test('the compact density makes table rows shorter, never below 40 px', async ({ page }) => {
    await openStaff(page, '/nv/khach-hang', 'quanly_ha');
    const row = main(page).locator('[data-row]').first();
    await expect(row).toBeVisible();
    const roomy = (await row.boundingBox())!.height;
    await choose(page, 'quanly_ha', [['Độ dày bảng', 'Gọn']]);
    await go(page, '/nv/khach-hang');
    await expect(row).toBeVisible();
    const tight = (await row.boundingBox())!.height;
    expect(tight).toBeLessThan(roomy);
    expect(tight).toBeGreaterThanOrEqual(40);
  });

  test('"Luôn giảm" opens a dialog without the slide and zoom, while the system setting is left alone', async ({ page }) => {
    const firstFrameTransform = () => page.evaluate(() => new Promise<string>((done) => requestAnimationFrame(() => done(getComputedStyle(document.querySelector('[role="dialog"]')!).transform))));
    await choose(page, 'quanly_ha', [['Chuyển động', 'Luôn giảm']]);
    await go(page, '/nv/kho');
    await main(page).getByRole('button', { name: 'Thêm món' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'attached' });
    expect(await firstFrameTransform()).toBe('none');
  });

  test('large text with compact tables still fits the phone @narrow', async ({ page }) => {
    await choose(page, 'quanly_ha', [['Cỡ chữ', 'Lớn'], ['Độ dày bảng', 'Gọn']]);
    for (const route of ['/nv', '/nv/khach-hang', '/nv/cai-dat/tai-khoan', '/nv/kho']) {
      await go(page, route);
      await expect(main(page).getByRole('heading', { level: 1 })).toBeVisible();
      await fitsDevice(page);
    }
    await go(page, '/nv/cai-dat/tai-khoan');
    await main(page).locator('[data-row]').first().click();
    await expect(page.getByRole('dialog', { name: 'Sửa tài khoản nhân viên' })).toBeVisible();
    await fitsDevice(page);
  });
});

const TEAM = '/nv/cai-dat/tai-khoan';

async function grantInvoices(page: Page, who: string, on: boolean) {
  await openStaff(page, TEAM, 'quanly_ha');
  await main(page).locator('[data-row]').filter({ hasText: who }).first().click();
  const d = page.getByRole('dialog', { name: 'Sửa tài khoản nhân viên' });
  const box = d.getByRole('checkbox', { name: /Lập hóa đơn/ });
  if ((await box.isChecked()) !== on) await box.click();
  await d.getByRole('button', { name: 'Lưu tài khoản' }).click();
  await expect(d).toHaveCount(0);
}

test.describe('landing, page size and report range', () => {
  test('sign-in opens the chosen landing page; a ?tiep link still wins', async ({ page }) => {
    await choose(page, 'bacsi_mai', [['Trang vào sau đăng nhập', 'Lịch hẹn']]);
    await signInAs(page, 'bacsi_mai', 'leson-demo');
    await expect(page).toHaveURL(/#\/nv\/lich-hen$/);
    await page.evaluate(async () => { await (window as unknown as { __lesonDemo: { logout(): Promise<void> } }).__lesonDemo.logout(); });
    await page.evaluate(() => { location.hash = '/dang-nhap/nhan-vien?tiep=%2Fnv%2Fnoi-tru'; });
    await expect(page).toHaveURL(/tiep=%2Fnv%2Fnoi-tru/);
    await page.waitForTimeout(400); // the sign-out redirect remounts the form once; fill after it settles
    await page.getByLabel('Tên đăng nhập').fill('bacsi_mai');
    await page.getByLabel('Mật khẩu', { exact: true }).fill('leson-demo');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page).toHaveURL(/#\/nv\/noi-tru$/);
  });

  test('the default landing page is the overview', async ({ page }) => {
    await openStaff(page, '/nv', 'bacsi_mai');
    await signInAs(page, 'bacsi_mai', 'leson-demo');
    await expect(page).toHaveURL(/#\/nv$/);
  });

  test('a landing page whose right was taken back falls to the overview, not a blocked page', async ({ page }) => {
    await grantInvoices(page, 'Lê Ngọc Anh', true);
    await choose(page, 'spa_ngocanh', [['Trang vào sau đăng nhập', 'Hóa đơn']]);
    await grantInvoices(page, 'Lê Ngọc Anh', false);
    await signInAs(page, 'spa_ngocanh', 'leson-demo');
    await expect(page).toHaveURL(/#\/nv$/);
    await expect(page.getByRole('heading', { name: 'Mục này dành cho người có quyền phù hợp' })).toHaveCount(0);
  });

  test('the rows per page follow the option', async ({ page }) => {
    await openStaff(page, '/nv/kho', 'quanly_ha');
    await expect(main(page).locator('[data-row]')).toHaveCount(13); // 13 active items, 20 per page
    await choose(page, 'quanly_ha', [['Số dòng mỗi trang', '10']]);
    await go(page, '/nv/kho');
    await expect(main(page).locator('[data-row]')).toHaveCount(10);
  });

  test('the period reports open on follows the option; the address still wins', async ({ page }) => {
    await openStaff(page, '/nv/doanh-thu', 'quanly_ha');
    await expect(main(page).getByRole('radio', { name: '7 ngày', exact: true })).toBeChecked();
    await choose(page, 'quanly_ha', [['Khoảng ngày báo cáo', '30 ngày qua']]);
    await go(page, '/nv/bao-cao');
    await expect(main(page).getByRole('radio', { name: '30 ngày', exact: true })).toBeChecked();
    await expect(main(page).locator('[data-period="current"]')).toContainText(' đến ');
    await go(page, '/nv/doanh-thu');
    await expect(main(page).getByRole('radio', { name: '30 ngày', exact: true })).toBeChecked();
    await choose(page, 'quanly_ha', [['Khoảng ngày báo cáo', 'Tháng này']]);
    await go(page, '/nv/bao-cao');
    await expect(main(page).getByRole('radio', { name: 'Tháng này', exact: true })).toBeChecked();
    await go(page, '/nv/bao-cao?ky=hom-nay');
    await expect(main(page).getByRole('radio', { name: 'Hôm nay', exact: true })).toBeChecked();
  });

  test('the period picker offers 30 days on both screens', async ({ page }) => {
    for (const route of ['/nv/bao-cao', '/nv/doanh-thu']) {
      await openStaff(page, route, 'quanly_ha');
      await main(page).getByRole('radio', { name: '30 ngày', exact: true }).click();
      await expect(page).toHaveURL(/ky=30-ngay/);
      await expect(main(page).getByRole('radio', { name: '30 ngày', exact: true })).toBeChecked();
    }
  });
});
