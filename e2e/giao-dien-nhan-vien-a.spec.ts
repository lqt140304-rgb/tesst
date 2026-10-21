import { expect, test, type Locator, type Page } from '@playwright/test';
import { open } from './helpers';
import { SCREENS } from './manifest';
import { fitsDevice } from './width';

const main = (page: Page) => page.locator('[data-zone="staff"] main');
const radius = (loc: Locator) => loc.evaluate((e) => parseFloat(getComputedStyle(e).borderTopLeftRadius));

test.describe('staff base', () => {
  test('every staff page has a breadcrumb and one h1, and fits the device @narrow', async ({ page }) => {
    for (const s of SCREENS.filter((x) => x.zone === 'staff' && !['khong-du-quyen', 'tong-quan', 'tong-quan-spa'].includes(x.slug))) {
      await open(page, s.route, { as: s.as });
      // On a phone an open request is a page of its own: the list header (and its breadcrumb) is hidden on purpose.
      if (s.slug === 'yeu-cau-chi-tiet' && (page.viewportSize()?.width ?? 0) < 768) { await fitsDevice(page); continue; }
      await expect(main(page).getByRole('navigation', { name: 'Đường dẫn' }), s.slug).toBeVisible();
      await expect(main(page).getByRole('heading', { level: 1 }), s.slug).toHaveCount(1);
      await fitsDevice(page);
    }
  });

  test('controls are squarer, cards 12 px, and the staff sidebar has no paw pattern', async ({ page }) => {
    await open(page, '/nv/hoa-don/inv-27', { as: 'quanly_ha' });
    expect(await radius(main(page).getByRole('link', { name: 'In hóa đơn' }))).toBeLessThanOrEqual(6);
    expect(await radius(main(page).locator('[class*="panel"]').first())).toBeLessThanOrEqual(12);
    expect(await page.locator('[data-zone="staff"] aside').first().evaluate((e) => getComputedStyle(e).backgroundImage)).toBe('none');
    await open(page, '/nv/hoa-don', { as: 'quanly_ha' });
    expect(await radius(main(page).getByRole('searchbox', { name: 'Tìm hóa đơn' }))).toBeLessThanOrEqual(6);
    await open(page, '/khach-hang', { as: 'lan_nguyen' });
    expect(await radius(page.locator('[data-card="pets"] section').first())).toBeLessThanOrEqual(12);
    await open(page, '/dang-nhap', {});
    expect(await radius(page.locator('form button[type="submit"]').first())).toBeLessThanOrEqual(6);
  });
});

test.describe('after the external review (phones)', () => {
  test('phones: the booking form starts on the first screen, the three steps fold away @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await open(page, '/dat-lich', {});
    const top = await page.getByLabel(/Họ và tên/).first().evaluate((e) => e.getBoundingClientRect().top);
    expect(top).toBeLessThan(page.viewportSize()!.height * 0.9);
    const how = page.getByText('Cách đặt lịch (3 bước)');
    await expect(how).toBeVisible();
    await expect(page.locator('[data-book-step]').first()).toBeHidden();
    await how.click();
    await expect(page.locator('[data-book-step]').first()).toBeVisible();
    await fitsDevice(page);
  });

  test('wide screens keep the three steps beside the form', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 768, 'wide only');
    await open(page, '/dat-lich', {});
    await expect(page.locator('[data-book-step]')).toHaveCount(3);
    await expect(page.locator('[data-book-step]').first()).toBeVisible();
    await expect(page.getByText('Cách đặt lịch (3 bước)')).toBeHidden();
  });

  test('the demo chip is a small icon button on phones and keeps its text on desktop', async ({ page }) => {
    await open(page, '/', {});
    const chip = page.getByRole('button', { name: /Bản demo/ });
    if ((page.viewportSize()?.width ?? 0) <= 640) expect((await chip.boundingBox())!.width).toBeLessThanOrEqual(48);
    else await expect(chip).toContainText('dữ liệu mẫu');
  });

  test('phones: the demo chip steps aside while a field has focus (keyboard open) @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) > 640, 'phone only');
    await open(page, '/dat-lich', {});
    const chip = page.getByRole('button', { name: /Bản demo/ });
    await expect(chip).toBeVisible();
    await page.getByLabel(/Họ và tên/).first().focus();
    await expect(chip).toBeHidden();
    await page.getByLabel(/Họ và tên/).first().blur();
    await expect(chip).toBeVisible();
  });
});

/** Creates an appointment through the "Tạo lịch hẹn" form (tomorrow, no assignee unless given), then leaves any panel it opened. */
async function createAppointment(page: Page, o: { customer: string; pet: string; time: string; minutes?: number; assignee?: string }) {
  const tomorrow = await page.evaluate(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(Date.now() + 864e5)));
  await main(page).getByRole('button', { name: 'Tạo lịch hẹn' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Khách hàng').fill(o.customer);
  await dialog.getByRole('radio').first().check();
  await dialog.getByRole('radio', { name: new RegExp(o.pet) }).check();
  await dialog.getByLabel('Ngày hẹn').fill(tomorrow);
  await dialog.getByLabel('Giờ hẹn').fill(o.time);
  if (o.minutes) await dialog.getByLabel('Thời lượng dự kiến').selectOption(String(o.minutes));
  if (o.assignee) await dialog.getByLabel('Người phụ trách').selectOption({ label: o.assignee });
  await dialog.getByRole('button', { name: 'Tạo lịch hẹn' }).click();
  await expect(page.getByRole('status').filter({ hasText: /Đã tạo lịch hẹn/ }).last()).toBeVisible();
  // The app opens the new appointment; close it so the next step starts from the calendar.
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  return tomorrow;
}

test.describe('appointments — grids and search', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 900, 'the grids are for wide screens; phones use the agenda');

  test('week view: seven day columns, each block sits in its own day at its own time', async ({ page }) => {
    await open(page, '/nv/lich-hen?view=tuan', { as: 'quanly_ha' });
    await expect(main(page).locator('[data-week-col]')).toHaveCount(7);
    const blocks = main(page).locator('[data-week-col] [data-appointment]');
    expect(await blocks.count()).toBeGreaterThan(0);
    for (const b of await blocks.all()) {
      const start = (await b.getAttribute('data-start'))!;
      const colDate = await b.locator('xpath=ancestor::*[@data-week-col]').getAttribute('data-date');
      expect(colDate).toBe(new Date(start).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }));
    }
    await expect(main(page).locator('[data-week-col][aria-current="date"]')).toHaveCount(1);
  });

  test('search dims appointments that do not match and says how many do', async ({ page }) => {
    await open(page, '/nv/lich-hen?view=tuan', { as: 'quanly_ha' });
    const box = main(page).getByRole('searchbox', { name: 'Tìm lịch hẹn' });
    await box.fill('mit');
    await expect(main(page).getByRole('status').filter({ hasText: /lịch khớp/ })).toBeVisible();
    expect(await main(page).locator('[data-appointment][data-dim="true"]').count()).toBeGreaterThan(0);
    expect(await main(page).locator('[data-appointment]:not([data-dim="true"])').count()).toBeGreaterThan(0);
    await box.fill('zzzz');
    await expect(main(page).getByText('Không có lịch nào khớp.')).toBeVisible();
    await box.fill('');
    await expect(main(page).locator('[data-appointment][data-dim="true"]')).toHaveCount(0);
  });

  test('two appointments at the same time stand side by side in the day view and both open', async ({ page }) => {
    await open(page, '/nv/lich-hen', { as: 'quanly_ha' });
    const day = await createAppointment(page, { customer: 'Lan', pet: 'Miu', time: '15:00' });
    await createAppointment(page, { customer: 'Lan', pet: 'Bông', time: '15:00' });
    await open(page, `/nv/lich-hen?view=ngay&date=${day}`, { as: 'quanly_ha' });
    const a = main(page).locator('[data-appointment]', { hasText: 'Miu' }).filter({ hasText: '15:00', visible: true });
    const b = main(page).locator('[data-appointment]', { hasText: 'Bông' }).filter({ hasText: '15:00', visible: true });
    const [ba, bb] = [(await a.boundingBox())!, (await b.boundingBox())!];
    expect(ba.x + ba.width <= bb.x + 1 || bb.x + bb.width <= ba.x + 1, 'blocks overlap sideways').toBe(true);
    for (const block of [a, b]) {
      await block.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
  });

  test('an appointment outside 07:00–21:00 is still on the day grid', async ({ page }) => {
    await open(page, '/nv/lich-hen', { as: 'quanly_ha' });
    const day = await createAppointment(page, { customer: 'Lan', pet: 'Miu', time: '06:30' });
    await open(page, `/nv/lich-hen?view=ngay&date=${day}`, { as: 'quanly_ha' });
    await expect(main(page).locator('[data-appointment]', { hasText: '06:30' }).filter({ visible: true })).toBeVisible();
    await expect(main(page).getByText('06:00', { exact: true })).toBeVisible();
  });
});
