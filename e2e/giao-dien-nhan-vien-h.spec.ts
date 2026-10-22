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

const nudgeBox = (page: Page) => main(page).getByRole('region', { name: 'Nhắc việc' });
async function switchNudge(page: Page, user: string, label: string, on: boolean) {
  await openStaff(page, PREFS, user);
  const box = main(page).getByRole('checkbox', { name: label });
  if ((await box.isChecked()) !== on) await box.click();
  await expect(saved(page)).toBeVisible();
}

test.describe('nudges', () => {
  test('the manager sees waiting requests and low stock, each leading to its screen', async ({ page }) => {
    await openStaff(page, '/nv', 'quanly_ha');
    const box = nudgeBox(page);
    await expect(box).toBeVisible();
    const requests = box.getByRole('link', { name: /yêu cầu đặt lịch đang chờ xử lý/ });
    await expect(requests).toBeVisible();
    await expect(box.getByRole('link', { name: '4 món kho đã hết hoặc sắp hết' })).toBeVisible();
    await requests.click();
    await expect(page).toHaveURL(/#\/nv\/yeu-cau$/);
    await go(page, '/nv');
    await nudgeBox(page).getByRole('link', { name: '4 món kho đã hết hoặc sắp hết' }).click();
    await expect(page).toHaveURL(/#\/nv\/kho$/);
  });

  test('a switched-off kind disappears; with all off the block is gone', async ({ page }) => {
    await switchNudge(page, 'quanly_ha', 'Yêu cầu đặt lịch chờ xử lý', false);
    await openStaff(page, '/nv', 'quanly_ha');
    await expect(nudgeBox(page).getByRole('link', { name: /yêu cầu đặt lịch đang chờ xử lý/ })).toHaveCount(0);
    await expect(nudgeBox(page).getByRole('link', { name: '4 món kho đã hết hoặc sắp hết' })).toBeVisible();
    for (const n of ['Khách xin đổi lịch', 'Kho sắp hết', 'Hóa đơn nháp lâu chưa phát hành']) await switchNudge(page, 'quanly_ha', n, false);
    await openStaff(page, '/nv', 'quanly_ha');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(nudgeBox(page)).toHaveCount(0);
  });

  test('a role with none of those rights has no block, and a doctor never sees request lines', async ({ page }) => {
    await openStaff(page, '/nv', 'spa_ngocanh');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(nudgeBox(page)).toHaveCount(0);
    await openStaff(page, '/nv', 'bacsi_mai');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(main(page).getByRole('link', { name: /yêu cầu đặt lịch|khách xin đổi lịch/ })).toHaveCount(0);
  });

  test('has no accessibility violations and fits the phone @a11y @narrow', async ({ page }) => {
    await openStaff(page, '/nv', 'quanly_ha');
    await expect(nudgeBox(page)).toBeVisible();
    const results = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).analyze();
    expect(results.violations).toEqual([]);
    await fitsDevice(page);
  });
});

const SYSTEM = '/nv/cai-dat/he-thong';
const todayVn = (page: Page) => page.evaluate(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()));

/** The manager changes the system settings through their own screen and waits for the save. */
async function setSystem(page: Page, change: (m: ReturnType<typeof main>) => Promise<void>) {
  await openStaff(page, SYSTEM, 'quanly_ha');
  await change(main(page));
  await main(page).getByRole('button', { name: 'Lưu cài đặt' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Đã lưu cài đặt.' }).last()).toBeVisible();
}

test.describe('system settings take effect', () => {
  test('the default durations of the new-appointment form follow the settings', async ({ page }) => {
    await setSystem(page, async (m) => {
      await m.getByLabel('Thời lượng mặc định Khám').fill('45');
      await m.getByLabel('Thời lượng mặc định Spa').fill('90');
    });
    await openStaff(page, '/nv/lich-hen', 'quanly_ha');
    await main(page).getByRole('button', { name: 'Tạo lịch hẹn' }).click();
    const d = page.getByRole('dialog', { name: 'Tạo lịch hẹn' });
    await expect(d.getByLabel('Thời lượng dự kiến')).toHaveValue('45');
    await d.getByLabel('Dịch vụ').selectOption('spa');
    await expect(d.getByLabel('Thời lượng dự kiến')).toHaveValue('90');
    await d.getByLabel('Dịch vụ').selectOption('noi_tru');
    await expect(d.getByLabel('Thời lượng dự kiến')).toHaveValue('30');
  });

  test('the calendar grid runs between the hours in the settings @desktop-only', async ({ page }) => {
    await setSystem(page, async (m) => {
      await m.getByLabel('Giờ bắt đầu lịch').fill('11:00');
      await m.getByLabel('Giờ kết thúc lịch').fill('15:00');
    });
    await openStaff(page, '/nv/lich-hen?view=tuan&date=2027-03-01', 'quanly_ha'); // a week with no appointments
    await expect(main(page).getByText('11:00', { exact: true })).toBeVisible();
    await expect(main(page).getByText('14:00', { exact: true })).toBeVisible();
    await expect(main(page).getByText('10:00', { exact: true })).toHaveCount(0);
    await expect(main(page).getByText('15:00', { exact: true })).toHaveCount(0);
  });

  test('an appointment outside the grid hours still shows: the grid widens for it @desktop-only', async ({ page }) => {
    await setSystem(page, async (m) => {
      await m.getByLabel('Giờ bắt đầu lịch').fill('12:00');
      await m.getByLabel('Giờ kết thúc lịch').fill('16:00');
    });
    await openStaff(page, '/nv/lich-hen', 'quanly_ha');
    await expect(main(page).locator('[data-appointment]').first()).toBeVisible();
  });

  test('the payment box lists only the methods that are on', async ({ page }) => {
    await setSystem(page, async (m) => {
      await m.getByRole('checkbox', { name: 'Chuyển khoản' }).click();
      await m.getByRole('checkbox', { name: 'QR ngân hàng' }).click();
    });
    await openStaff(page, '/nv/hoa-don', 'quanly_ha');
    await main(page).getByRole('radio', { name: /^Chưa thanh toán/ }).click();
    await main(page).locator('[data-row]').first().click();
    await main(page).getByRole('button', { name: 'Ghi nhận thanh toán' }).click();
    const methods = page.getByRole('dialog', { name: 'Ghi nhận thanh toán' }).getByRole('radiogroup', { name: 'Phương thức' }).getByRole('radio');
    await expect(methods).toHaveText(['Tiền mặt']);
  });

  test('with only QR on, QR is the one chosen', async ({ page }) => {
    await setSystem(page, async (m) => {
      await m.getByRole('checkbox', { name: 'Tiền mặt' }).click();
      await m.getByRole('checkbox', { name: 'Chuyển khoản' }).click();
    });
    await openStaff(page, '/nv/hoa-don', 'quanly_ha');
    await main(page).getByRole('radio', { name: /^Chưa thanh toán/ }).click();
    await main(page).locator('[data-row]').first().click();
    await main(page).getByRole('button', { name: 'Ghi nhận thanh toán' }).click();
    const methods = page.getByRole('dialog', { name: 'Ghi nhận thanh toán' }).getByRole('radiogroup', { name: 'Phương thức' }).getByRole('radio');
    await expect(methods).toHaveText(['QR ngân hàng']);
    await expect(methods.first()).toBeChecked();
  });

  test('requests older than the limit carry the "Quá hạn" tag, and the overview counts them', async ({ page }) => {
    await setSystem(page, async (m) => { await m.getByLabel('Báo yêu cầu quá hạn sau').fill('1'); });
    await openStaff(page, '/nv/yeu-cau', 'quanly_ha');
    const late = main(page).getByText('Quá hạn', { exact: true });
    await expect(late.first()).toBeVisible();
    const many = await late.count();
    await openStaff(page, '/nv', 'quanly_ha');
    await expect(main(page).locator('[data-tile]', { hasText: 'Yêu cầu cần xử lý' })).toContainText(/\d+ yêu cầu quá hạn|cần gọi lại/);
    await openStaff(page, '/nv/yeu-cau', 'quanly_ha');
    await late.first().click();
    await expect(main(page).locator('[data-request-detail]').getByText('Quá hạn', { exact: true })).toBeVisible();
    await setSystem(page, async (m) => { await m.getByLabel('Báo yêu cầu quá hạn sau').fill('168'); });
    await openStaff(page, '/nv/yeu-cau', 'quanly_ha');
    await expect(main(page).getByRole('heading', { level: 1 })).toBeVisible();
    expect(await main(page).getByText('Quá hạn', { exact: true }).count()).toBeLessThan(many);
  });

  test('a holiday is marked on the calendar and warns, without blocking, when a visit runs past 19:00', async ({ page }) => {
    const today = await todayVn(page);
    await setSystem(page, async (m) => {
      await m.getByLabel('Ngày lễ mới').fill(today);
      await m.getByLabel('Ghi chú ngày lễ').fill('Noel');
      await m.getByRole('button', { name: 'Thêm ngày lễ' }).click();
    });
    await openStaff(page, '/nv/lich-hen', 'quanly_ha');
    await expect(main(page).getByText('Ngày lễ: Noel')).toBeVisible();
    await main(page).getByRole('button', { name: 'Tạo lịch hẹn' }).click();
    const d = page.getByRole('dialog', { name: 'Tạo lịch hẹn' });
    await d.getByLabel('Giờ hẹn').fill('18:30');
    await d.getByLabel('Thời lượng dự kiến').selectOption('60');
    await expect(d.getByText('Ngày lễ: bệnh viện làm đến 19:00.')).toBeVisible();
    await d.getByLabel('Giờ hẹn').fill('17:30');
    await d.getByLabel('Thời lượng dự kiến').selectOption('30');
    await expect(d.getByText('Ngày lễ: bệnh viện làm đến 19:00.')).toHaveCount(0);
  });

  test('an ordinary day shows no holiday mark', async ({ page }) => {
    await openStaff(page, '/nv/lich-hen', 'quanly_ha');
    await expect(main(page).getByText(/^Ngày lễ/)).toHaveCount(0);
  });
});

test.describe('calendar view option', () => {
  const view = (page: Page, name: string) => main(page).getByRole('tab', { name, exact: true });

  test('opens on the day view until a choice is made', async ({ page }) => {
    await openStaff(page, '/nv/lich-hen', 'bacsi_mai');
    await expect(view(page, 'Ngày')).toHaveAttribute('aria-selected', 'true');
  });

  test('follows the chosen view, and an address with a view still wins', async ({ page }) => {
    await choose(page, 'bacsi_mai', [['Kiểu xem lịch', 'Tuần']]);
    await go(page, '/nv/lich-hen');
    await expect(view(page, 'Tuần')).toHaveAttribute('aria-selected', 'true');
    await go(page, '/nv/lich-hen?view=ngay');
    await expect(view(page, 'Ngày')).toHaveAttribute('aria-selected', 'true');
    await choose(page, 'bacsi_mai', [['Kiểu xem lịch', 'Ngày']]);
    await go(page, '/nv/lich-hen');
    await expect(view(page, 'Ngày')).toHaveAttribute('aria-selected', 'true');
  });
});
