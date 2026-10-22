import { expect, test, type Locator, type Page } from '@playwright/test';
import { addService, createAppointment, open, openStaff, tenRowsPerPage } from './helpers';
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
      expect(await main(page).innerText(), s.slug).not.toMatch(/quý khách|lễ tân|Hoàn thành/i);
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

test.describe('appointments — grids and search', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 900, 'the grids are for wide screens; phones use the agenda');

  test('week view: seven day columns, each block sits in its own day at its own time', async ({ page }) => {
    await openStaff(page, '/nv/lich-hen?view=tuan', 'quanly_ha');
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
    await openStaff(page, '/nv/lich-hen?view=tuan', 'quanly_ha');
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
    await openStaff(page, '/nv/lich-hen', 'quanly_ha');
    const day = await createAppointment(page, { customer: 'Lan', pet: 'Miu', time: '15:00' });
    await createAppointment(page, { customer: 'Lan', pet: 'Bông', time: '15:00' });
    await openStaff(page, `/nv/lich-hen?view=ngay&date=${day}`, 'quanly_ha');
    const a = main(page).locator('[data-appointment]', { hasText: 'Miu' }).filter({ hasText: '15:00', visible: true });
    const b = main(page).locator('[data-appointment]', { hasText: 'Bông' }).filter({ hasText: '15:00', visible: true });
    const [ba, bb] = [(await a.boundingBox())!, (await b.boundingBox())!];
    expect(ba.x + ba.width <= bb.x + 1 || bb.x + bb.width <= ba.x + 1, 'blocks overlap sideways').toBe(true);
    for (const block of [a, b]) {
      await block.click();
      await expect(main(page).locator('[data-detail] h2')).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(main(page).locator('[data-detail]')).toHaveCount(0);
    }
  });

  test('an appointment outside 07:00–21:00 is still on the day grid', async ({ page }) => {
    await openStaff(page, '/nv/lich-hen', 'quanly_ha');
    const day = await createAppointment(page, { customer: 'Lan', pet: 'Miu', time: '06:30' });
    await openStaff(page, `/nv/lich-hen?view=ngay&date=${day}`, 'quanly_ha');
    await expect(main(page).locator('[data-appointment]', { hasText: '06:30' }).filter({ visible: true })).toBeVisible();
    await expect(main(page).getByText('06:00', { exact: true })).toBeVisible();
  });
});


test.describe('appointment panel', () => {
  const wideOnly = (page: Page) => test.skip((page.viewportSize()?.width ?? 0) < 1024, 'side by side from 1024px');

  test('clicking an appointment opens the panel on the right with the pet and role-based buttons; Esc closes and returns focus', async ({ page }) => {
    wideOnly(page);
    await openStaff(page, '/nv/lich-hen?view=tuan', 'quanly_ha');
    const block = main(page).locator('[data-appointment]').filter({ visible: true }).first();
    await block.click();
    const panel = main(page).locator('[data-detail]');
    await expect(panel.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Đổi lịch', exact: true })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Hủy lịch', exact: true })).toBeVisible();
    await expect(panel.getByText('Xác nhận', { exact: true })).toHaveCount(0); // R8: an appointment has no confirm step
    await expect(panel.getByRole('heading', { level: 2 })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(block).toBeFocused();
  });

  test('Spa can read an appointment but has no change buttons', async ({ page }) => {
    wideOnly(page);
    await openStaff(page, '/nv/lich-hen?view=tuan', 'spa_ngocanh');
    await main(page).locator('[data-appointment]').filter({ visible: true }).first().click();
    const panel = main(page).locator('[data-detail]');
    await expect(panel.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Đổi lịch', exact: true })).toHaveCount(0);
    await expect(panel.getByRole('button', { name: 'Hủy lịch', exact: true })).toHaveCount(0);
  });

  test('change and cancel run inside the panel and still need their reasons', async ({ page }) => {
    wideOnly(page);
    await openStaff(page, '/nv/lich-hen', 'quanly_ha');
    const day = await createAppointment(page, { customer: 'Lan', pet: 'Miu', time: '14:00' });
    await openStaff(page, `/nv/lich-hen?view=ngay&date=${day}`, 'quanly_ha');
    const block = main(page).locator('[data-appointment]', { hasText: 'Miu' }).filter({ hasText: '14:00', visible: true });
    await block.click();
    const panel = main(page).locator('[data-detail]');
    await panel.getByRole('button', { name: 'Đổi lịch', exact: true }).click();
    await panel.getByLabel('Giờ mới').fill('16:30');
    await panel.getByRole('button', { name: 'Lưu giờ mới' }).click();
    await expect(page.getByRole('status').filter({ hasText: /Đã dời lịch sang 16:30/ })).toBeVisible();
    await expect(main(page).locator('[data-appointment]', { hasText: 'Miu' }).filter({ hasText: '16:30', visible: true })).toBeVisible();
    await panel.getByRole('button', { name: 'Hủy lịch', exact: true }).click();
    await panel.getByRole('button', { name: 'Hủy lịch hẹn' }).click();
    await expect(panel.getByText('Bạn ghi lý do hủy lịch nhé.')).toBeVisible();
    await panel.getByLabel('Lý do hủy').fill('Khách báo bé đã khỏe');
    await panel.getByRole('button', { name: 'Hủy lịch hẹn' }).click();
    await expect(page.getByRole('status').filter({ hasText: /Đã hủy lịch hẹn/ })).toBeVisible();
    await expect(panel.getByText('Đã hủy').first()).toBeVisible(); // the panel keeps the appointment it was showing
    await expect(main(page).locator('[data-appointment]', { hasText: 'Miu' }).filter({ hasText: '16:30', visible: true })).toHaveCount(0);
  });

  test('an unknown ?lich= says so instead of a blank page', async ({ page }) => {
    await openStaff(page, '/nv/lich-hen?lich=khong-co', 'quanly_ha');
    await expect(main(page).getByText('Không tìm thấy lịch hẹn này.')).toBeVisible();
  });

  test('phones: the panel is its own page and the system Back returns to the list @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, 'phone flow');
    await openStaff(page, '/nv/lich-hen', 'quanly_ha');
    await main(page).locator('[data-appointment]').filter({ visible: true }).first().click();
    await expect(main(page).locator('[data-detail]')).toBeVisible();
    await expect(page).toHaveURL(/lich=/);
    await fitsDevice(page);
    await page.goBack();
    await expect(main(page).locator('[data-detail]')).toHaveCount(0);
    await expect(main(page).locator('[data-appointment]').filter({ visible: true }).first()).toBeVisible();
  });

  test('a reschedule wish shows in the panel; "Không đổi" closes it', async ({ page, context }) => {
    wideOnly(page);
    await open(page, '/khach-hang/lich-hen', { as: 'lan_nguyen' });
    const detail = page.locator('[data-zone="customer"] main [data-detail]');
    await detail.getByRole('button', { name: 'Yêu cầu đổi lịch' }).click();
    const dialog = page.getByRole('dialog');
    const wanted = await page.evaluate(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(Date.now() + 4 * 864e5)));
    await dialog.getByLabel('Ngày mong muốn').fill(wanted);
    await dialog.getByLabel(/Lý do/).fill('Bé bị ốm nhẹ');
    await dialog.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(detail.getByText('Đang chờ đổi lịch')).toBeVisible();

    const staffTab = await context.newPage();
    await open(staffTab, '/nv/yeu-cau', { as: 'bacsi_duc' });
    await staffTab.locator('[data-reschedule-queue] [data-reschedule-row]', { hasText: 'Bông' }).first().getByRole('link', { name: /Mở lịch hẹn/ }).click();
    const panel = staffTab.locator('[data-zone="staff"] main [data-detail]');
    await expect(panel.getByText('Khách xin đổi lịch')).toBeVisible();
    await expect(panel.getByText('Bé bị ốm nhẹ')).toBeVisible();
    await panel.getByRole('button', { name: 'Không đổi' }).click();
    await expect(panel.getByText('Khách xin đổi lịch')).toHaveCount(0);
    await expect(detail.getByText('Đang chờ đổi lịch')).toHaveCount(0);
  });
});

test.describe('invoice list', () => {
  test('a paged table; rows open the invoice; the balance stands out', async ({ page }) => {
    await tenRowsPerPage(page, 'quanly_ha');
    await open(page, '/nv/hoa-don', { as: 'quanly_ha' });
    await expect(main(page).getByRole('table')).toBeVisible();
    const rows = main(page).locator('[data-row]');
    expect(await rows.count()).toBeLessThanOrEqual(10);
    await expect(main(page).getByRole('navigation', { name: 'Phân trang' })).toBeVisible();
    await main(page).getByRole('button', { name: 'Trang 2' }).click();
    await expect(main(page).getByRole('button', { name: 'Trang 2' })).toHaveAttribute('aria-current', 'page');
    await main(page).getByRole('searchbox', { name: 'Tìm hóa đơn' }).fill('HD-1027');
    await expect(rows).toHaveCount(1);
    await rows.first().click();
    await expect(page).toHaveURL(/#\/nv\/hoa-don\/inv-27$/);
  });

  test('phones: the table turns into cards and still fits @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await open(page, '/nv/hoa-don', { as: 'quanly_ha' });
    await expect(main(page).locator('[data-row]').first()).toBeVisible();
    await fitsDevice(page);
  });
});

/** A new, empty draft for Nguyễn Thị Lan's first pet (through the "Lập hóa đơn" step). */
async function newDraft(page: Page) {
  await openStaff(page, '/nv/hoa-don/moi?khach=cus-05', 'quanly_ha');
  await main(page).getByRole('button', { name: 'Tạo hóa đơn nháp' }).click();
  await expect(page).toHaveURL(/#\/nv\/hoa-don\/(?!moi)[^/]+$/);
}

/** The preview sits beside the editor from 1100 px; narrower it folds under a button, so open it first. */
async function showPreview(page: Page) {
  await main(page).getByRole('button', { name: 'Thêm dịch vụ', exact: true }).waitFor(); // the editor has loaded
  const toggle = main(page).getByRole('button', { name: 'Xem trước hóa đơn' });
  if ((await toggle.count()) > 0 && (await toggle.getAttribute('aria-expanded')) === 'false') await toggle.click();
  return main(page).locator('[data-invoice-preview]');
}

test.describe('invoice editor', () => {
  test('add, change quantity and remove lines — the total and the preview agree at every step', async ({ page }) => {
    await newDraft(page);
    const preview = await showPreview(page);
    const total = main(page).locator('[data-total]');
    await addService(page, 'khám lâm sàng', /Thêm Khám lâm sàng/);
    await expect(main(page).locator('[data-line]', { hasText: 'Khám lâm sàng' })).toBeVisible();
    const one = (await total.innerText()).trim();
    await expect(preview).toContainText('Khám lâm sàng');
    await expect(preview).toContainText(one);
    await main(page).getByRole('button', { name: /Tăng số lượng Khám lâm sàng/ }).click();
    await expect(total).not.toHaveText(one);
    await expect(preview).toContainText((await total.innerText()).trim());
    await main(page).getByRole('button', { name: /Bỏ Khám lâm sàng/ }).click();
    await expect(main(page).locator('[data-line]')).toHaveCount(0);
    await expect(preview).toContainText('Chưa có dịch vụ nào');
  });

  test('an open-price item arrives with its reference price filled in', async ({ page }) => {
    await newDraft(page);
    await addService(page, 'KB09', /^Thêm /);
    await expect(main(page).getByRole('textbox', { name: /^Đơn giá / })).toHaveValue('200000');
  });

  test('a draft with no lines cannot be issued', async ({ page }) => {
    await newDraft(page);
    await expect(main(page).getByRole('button', { name: 'Phát hành hóa đơn' })).toBeDisabled();
    await expect(await showPreview(page)).toContainText('Chưa có dịch vụ nào');
  });

  test('treatment items fold into one line in the preview', async ({ page }) => {
    await newDraft(page);
    await addService(page, 'thủ thuật', /Thêm Thủ thuật theo chỉ định/);
    const preview = await showPreview(page);
    await expect(preview).toContainText('Thuốc và vật tư điều trị');
    await expect(preview).not.toContainText('Thủ thuật theo chỉ định');
  });

  test('the save label says "Chưa lưu thay đổi" until a real save, then "Đã lưu"', async ({ page }) => {
    await newDraft(page);
    const label = main(page).locator('[data-save]');
    await expect(label).toHaveAttribute('data-save', 'clean');
    await addService(page, 'tái khám', /Thêm Tái khám/);
    await expect(label).toHaveAttribute('data-save', 'dirty');
    await expect(label).toContainText('Chưa lưu thay đổi');
    await main(page).getByRole('button', { name: 'Lưu nháp', exact: true }).click();
    await expect(label).toHaveAttribute('data-save', 'saved');
  });

  test('phones: the preview folds under one button and the editor fits 320 px @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1100, 'preview is always beside the editor from 1100px');
    await newDraft(page);
    await addService(page, 'khám lâm sàng', /Thêm Khám lâm sàng/);
    const toggle = main(page).getByRole('button', { name: 'Xem trước hóa đơn' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(main(page).locator('[data-invoice-preview]')).toHaveCount(0);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(main(page).locator('[data-invoice-preview]')).toBeVisible();
    await fitsDevice(page);
  });
});

test.describe('issued invoice and the new-invoice step', () => {
  test('the customer view is always beside the invoice; payment and print stay', async ({ page }) => {
    await open(page, '/nv/hoa-don/inv-27', { as: 'quanly_ha' });
    await expect(main(page).locator('[data-invoice-preview]')).toContainText(/thanh toán tại quầy/i);
    await expect(main(page).getByRole('button', { name: 'Xem như khách' })).toHaveCount(0);
    await expect(main(page).getByRole('button', { name: 'Ghi nhận thanh toán' })).toBeVisible();
    await expect(main(page).getByRole('link', { name: 'In hóa đơn' })).toBeVisible();
    await fitsDevice(page);
  });

  test('new invoice: "Chọn lại" changes the customer unless the customer came with the link', async ({ page }) => {
    await open(page, '/nv/hoa-don/moi', { as: 'quanly_ha' });
    await main(page).getByLabel(/Tìm khách hàng/).fill('Lan');
    await main(page).getByRole('radio').first().click();
    await main(page).getByRole('button', { name: 'Chọn lại' }).click();
    await expect(main(page).getByLabel(/Tìm khách hàng/)).toBeVisible();
    await open(page, '/nv/hoa-don/moi?khach=cus-05', { as: 'bacsi_duc' });
    await expect(main(page).getByText('Thông tin khách hàng')).toBeVisible();
    await expect(main(page).getByRole('button', { name: 'Chọn lại' })).toHaveCount(0);
  });
});

test.describe('final review fixes (part 4A)', () => {
  const wideOnly = (page: Page) => test.skip((page.viewportSize()?.width ?? 0) < 1024, 'side by side from 1024px');
  const plusDays = (page: Page, from: string, n: number) => page.evaluate(([d, k]) => new Date(Date.parse(`${d}T12:00:00+07:00`) + (k as number) * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }), [from, n] as const);

  test('closing a panel that was opened from a link stays on the calendar', async ({ page }) => {
    wideOnly(page);
    await openStaff(page, '/nv/lich-hen?view=tuan', 'quanly_ha');
    const blocks = main(page).locator('[data-appointment]').filter({ visible: true });
    await blocks.first().click();
    await expect(page).toHaveURL(/lich=/);
    const id = new URL(page.url().replace('#', '')).searchParams.get('lich')!;
    await open(page, '/nv/yeu-cau', { as: 'quanly_ha' });
    await page.evaluate((x) => { location.hash = `/nv/lich-hen?view=tuan&lich=${x}`; }, id); // arrives like a link: no "opened" mark
    await expect(main(page).locator('[data-detail]')).toBeVisible();
    await main(page).locator('[data-appointment]').filter({ visible: true }).nth(1).click(); // another appointment replaces the first
    await main(page).getByRole('button', { name: 'Đóng chi tiết lịch hẹn' }).click();
    await expect(main(page).locator('[data-detail]')).toHaveCount(0);
    await expect(page).toHaveURL(/#\/nv\/lich-hen/);
  });

  test('after moving an appointment to another day the panel follows it', async ({ page }) => {
    wideOnly(page);
    await openStaff(page, '/nv/lich-hen', 'quanly_ha');
    const day = await createAppointment(page, { customer: 'Lan', pet: 'Miu', time: '14:00' });
    await openStaff(page, `/nv/lich-hen?view=ngay&date=${day}`, 'quanly_ha');
    await main(page).locator('[data-appointment]', { hasText: 'Miu' }).filter({ hasText: '14:00', visible: true }).click();
    const panel = main(page).locator('[data-detail]');
    await panel.getByRole('button', { name: 'Đổi lịch', exact: true }).click();
    const later = await plusDays(page, day, 2);
    await panel.getByLabel('Ngày mới').fill(later);
    await panel.getByRole('button', { name: 'Lưu giờ mới' }).click();
    await expect(page.getByRole('status').filter({ hasText: /Đã dời lịch/ })).toBeVisible();
    await expect(panel.getByRole('heading', { level: 2, name: 'Miu' })).toBeVisible();
    await expect(main(page).getByText('Không tìm thấy lịch hẹn này.')).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`date=${later}`));
  });

  test('moving around the calendar closes the panel instead of reporting a missing appointment', async ({ page }) => {
    wideOnly(page);
    await openStaff(page, '/nv/lich-hen?view=tuan', 'quanly_ha');
    await main(page).locator('[data-appointment]').filter({ visible: true }).first().click();
    await expect(main(page).locator('[data-detail]')).toBeVisible();
    await main(page).getByRole('button', { name: 'Tuần sau' }).click();
    await expect(main(page).locator('[data-detail]')).toHaveCount(0);
    await expect(main(page).getByText('Không tìm thấy lịch hẹn này.')).toHaveCount(0);
  });

  test('an emptied open-price box is an error, not a silent 0 or the old price', async ({ page }) => {
    await newDraft(page);
    await addService(page, 'KB09', /^Thêm /);
    const price = main(page).getByRole('textbox', { name: /^Đơn giá / });
    await expect(price).toHaveValue('200000');
    await main(page).getByRole('button', { name: 'Lưu nháp', exact: true }).click();
    await expect(main(page).locator('[data-save]')).toHaveAttribute('data-save', 'saved');
    await price.fill('');
    await main(page).getByRole('button', { name: 'Lưu nháp', exact: true }).click();
    await expect(main(page).getByText(/Bạn nhập đơn giá cho/)).toBeVisible();
    await expect(main(page).locator('[data-save]')).not.toHaveAttribute('data-save', 'saved');
    await main(page).getByRole('button', { name: 'Phát hành hóa đơn' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(main(page).getByText(/Bạn nhập đơn giá cho/)).toBeVisible();
  });

  test('an edit made while a save is running is still saved before issuing', async ({ page }) => {
    await newDraft(page);
    await addService(page, 'khám lâm sàng', /Thêm Khám lâm sàng/);
    await page.evaluate(() => (window as unknown as { __lesonDemo: { setLatency(ms: number): void } }).__lesonDemo.setLatency(600));
    await main(page).getByRole('button', { name: 'Lưu nháp', exact: true }).click(); // saving …
    await main(page).getByRole('button', { name: /Tăng số lượng Khám lâm sàng/ }).click(); // … and one more edit lands meanwhile
    await expect(main(page).locator('[data-save]')).toHaveAttribute('data-save', 'dirty', { timeout: 5000 });
    await main(page).getByRole('button', { name: 'Phát hành hóa đơn' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Phát hành' }).click();
    await expect(main(page).getByRole('button', { name: 'Ghi nhận thanh toán' })).toBeVisible({ timeout: 8000 }); // now the issued invoice
    await expect(main(page).locator('[data-total]')).toHaveText(/300\.000\s₫/);
  });
});
