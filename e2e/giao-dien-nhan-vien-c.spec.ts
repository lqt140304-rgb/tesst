import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, ftruncateSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openStaff, staffMain as main } from './helpers';
import { fitsDevice } from './width';

const toast = (page: Page, text: string | RegExp) => page.getByRole('status').filter({ hasText: text });
const SEARCH = 'Tìm bé, chủ nuôi hoặc số điện thoại';

/** Admits the first pet found by `search` into `cage` through the three steps (leaves the app on the new stay page). */
async function admit(page: Page, o: { search: string; cage: string; reason?: string }) {
  await main(page).getByRole('button', { name: 'Nhập viện', exact: true }).click();
  const dlg = page.getByRole('dialog');
  await dlg.getByRole('searchbox', { name: SEARCH }).fill(o.search);
  await dlg.locator('[data-pet-option]').first().click();
  await dlg.getByRole('button', { name: 'Tiếp' }).click();
  await dlg.getByLabel('Lý do nhập viện').fill(o.reason ?? 'Theo dõi');
  await dlg.getByRole('radio', { name: `Chuồng ${o.cage}` }).click();
  await dlg.getByRole('button', { name: 'Tiếp' }).click();
  await dlg.getByRole('button', { name: 'Nhập viện', exact: true }).click();
}

test.describe('admit a pet', () => {
  test("three steps: pick from today's appointments, choose a cage, confirm", async ({ page }) => {
    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Nhập viện', exact: true }).click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.getByText('Bước 1/3')).toBeVisible();
    await expect(dlg.getByRole('button', { name: 'Tiếp' })).toBeDisabled();
    await dlg.locator('[data-today-appt]', { hasText: 'Mập' }).click();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await expect(dlg.getByText('Bước 2/3')).toBeVisible();
    await expect(dlg.getByRole('button', { name: 'Tiếp' })).toBeDisabled();
    await dlg.getByLabel('Lý do nhập viện').fill('Theo dõi sau khám');
    await dlg.getByRole('radio', { name: 'Chuồng M1' }).click();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await expect(dlg.getByText('Bước 3/3')).toBeVisible();
    await expect(dlg.getByText(/Mập · chuồng M1/)).toBeVisible();
    await dlg.getByRole('button', { name: 'Nhập viện', exact: true }).click();
    await expect(toast(page, 'Đã nhập viện Mập vào chuồng M1.')).toBeVisible();
    await expect(page).toHaveURL(/#\/nv\/noi-tru\/[^/]+$/);
  });

  test('search finds a pet by its owner; a pet already in a cage cannot be chosen', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Nhập viện', exact: true }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByRole('searchbox', { name: SEARCH }).fill('Nguyễn Thị Lan');
    await expect(dlg.locator('[data-pet-option]', { hasText: 'Bông' })).toBeVisible();
    const miu = dlg.locator('[data-pet-option]', { hasText: 'Miu' });
    await expect(miu).toBeDisabled();
    await expect(miu).toContainText('Đang nội trú');
  });

  test('an empty cage opens the dialog with that cage already chosen', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Nhập viện vào chuồng C2' }).click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.getByText('Bước 1/3')).toBeVisible();
    await dlg.getByRole('searchbox', { name: SEARCH }).fill('Bông');
    await dlg.locator('[data-pet-option]').first().click();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await expect(dlg.getByRole('radio', { name: 'Chuồng C2' })).toBeChecked();
  });

  test('a cage taken meanwhile sends the person back to the cage step with the typed reason kept', async ({ page, context }) => {
    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Nhập viện', exact: true }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByRole('searchbox', { name: SEARCH }).fill('Tôm');
    await dlg.locator('[data-pet-option]').first().click();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await dlg.getByLabel('Lý do nhập viện').fill('Theo dõi hô hấp');
    await dlg.getByRole('radio', { name: 'Chuồng C5' }).click();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await expect(dlg.getByText('Bước 3/3')).toBeVisible();

    const other = await context.newPage();
    await openStaff(other, '/nv/noi-tru', 'bacsi_mai');
    await admit(other, { search: 'Đậu', cage: 'C5' });
    await expect(toast(other, /Đã nhập viện Đậu/)).toBeVisible();

    await dlg.getByRole('button', { name: 'Nhập viện', exact: true }).click();
    await expect(dlg.getByText('Chuồng này đang có bé ở.')).toBeVisible();
    await expect(dlg.getByText('Bước 2/3')).toBeVisible();
    await expect(dlg.getByLabel('Lý do nhập viện')).toHaveValue('Theo dõi hô hấp');
    await expect(dlg.getByRole('radio', { name: 'Chuồng C5' })).toHaveCount(0);
  });

  test('a pet without a weight starts with no day charge; one with a weight gets the suggested line', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Nhập viện', exact: true }).click();
    const dlg = page.getByRole('dialog');
    const toStep3 = async (search: string, cage: string) => {
      await dlg.getByRole('searchbox', { name: SEARCH }).fill(search);
      await dlg.locator('[data-pet-option]').first().click();
      await dlg.getByRole('button', { name: 'Tiếp' }).click();
      await dlg.getByLabel('Lý do nhập viện').fill('Theo dõi');
      await dlg.getByRole('radio', { name: `Chuồng ${cage}` }).click();
      await dlg.getByRole('button', { name: 'Tiếp' }).click();
    };
    await toStep3('Tôm', 'C2');
    await expect(dlg.getByText('Hồ sơ bé chưa có cân nặng nên chưa ghi tiền nội trú.')).toBeVisible();
    await dlg.getByRole('button', { name: 'Quay lại' }).click();
    await dlg.getByRole('button', { name: 'Quay lại' }).click();
    await dlg.getByRole('searchbox', { name: SEARCH }).fill('Bông');
    await dlg.locator('[data-pet-option]').first().click();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await expect(dlg.getByLabel('Dòng tiền nội trú')).toHaveValue('pi-LT02');
  });
});

test.describe('cage board', () => {
  test('summary numbers, zone filter and a next-step line on the tiles', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    await expect(main(page).getByText('5 bé đang nội trú')).toBeVisible();
    await expect(main(page).getByText('7 chuồng trống')).toBeVisible();
    await expect(main(page).locator('[data-cage] [data-pet-avatar]').first()).toBeVisible();
    expect(await main(page).locator('[data-cage] [data-next-step]').count()).toBeGreaterThan(0);
    await main(page).getByRole('radio', { name: 'Khu mèo' }).click();
    await expect(main(page).getByRole('heading', { name: 'Khu chó' })).toHaveCount(0);
    await expect(main(page).getByRole('heading', { name: 'Khu mèo' })).toBeVisible();
    await expect(main(page).locator('[data-cage]')).toHaveCount(4);
    await main(page).getByRole('radio', { name: 'Tất cả' }).click();
    await expect(main(page).getByRole('heading', { name: 'Khu chó' })).toBeVisible();
  });

  for (const who of ['quanly_ha', 'spa_ngocanh']) {
    test(`an empty cage is a button for people who can admit (${who})`, async ({ page }) => {
      await openStaff(page, '/nv/noi-tru', who);
      await expect(main(page).getByText('Bấm thẻ để xem hồ sơ bé, bấm chuồng trống để nhập viện.')).toBeVisible();
      await main(page).getByRole('button', { name: 'Nhập viện vào chuồng C2' }).click();
      await expect(page.getByRole('dialog').getByText('Bước 1/3')).toBeVisible();
    });
  }

  test('phones: the board fits the width @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    await expect(main(page).locator('[data-cage]').first()).toBeVisible();
    await fitsDevice(page);
  });
});

test.describe('a pet on the ward', () => {
  test('the page shows progress, the info card and the money line', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0039', 'quanly_ha');
    const info = main(page).locator('[data-stay-info]');
    await expect(info).toContainText('Mochi');
    await expect(info).toContainText('Chuồng C1');
    await expect(main(page).locator('[aria-current="step"]')).toHaveCount(1);
    await expect(info.locator('[data-money]')).toHaveText(/^(Nội trú|Chưa ghi tiền nội trú|Chưa có hóa đơn)/);
  });

  test('the history tab groups by day, newest first', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0039', 'bacsi_mai');
    await main(page).getByRole('tab', { name: /Lịch sử/ }).click();
    const rows = main(page).locator('[data-history]');
    await expect(rows.first()).toBeVisible();
    expect(await main(page).locator('[data-history-day]').count()).toBeGreaterThan(0);
    const times = await rows.evaluateAll((els) => els.map((e) => Date.parse((e.querySelector('time') as HTMLTimeElement).dateTime)));
    expect(times).toEqual([...times].sort((a, b) => b - a));
    await expect(rows.filter({ hasText: /nhập viện/i }).first()).toBeVisible();
  });

  test('Spa sees no orders in the history and no internal tab', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0041', 'spa_ngocanh');
    await expect(main(page).getByRole('tab', { name: /Hồ sơ nội bộ/ })).toHaveCount(0);
    await main(page).getByRole('tab', { name: /Lịch sử/ }).click();
    await expect(main(page).locator('[data-history]').first()).toBeVisible();
    const text = await main(page).locator('[role="tabpanel"]').innerText();
    for (const drug of ['NaCl', 'Kháng sinh', 'Giảm đau']) expect(text).not.toContain(drug);
  });

  test('a chore points to the right tab', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0039', 'quanly_ha');
    await main(page).locator('[data-stay-info]').getByRole('button', { name: 'Hóa đơn chưa phát hành' }).click();
    await expect(main(page).getByRole('tab', { name: 'Hóa đơn' })).toHaveAttribute('aria-selected', 'true');
  });

  test('a pet already home hides the actions and shows the strip', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0035', 'quanly_ha');
    const info = main(page).locator('[data-stay-info]');
    await expect(info).toContainText('Đã xuất viện lúc');
    await expect(info.getByLabel('Tình trạng nội bộ')).toHaveCount(0);
    await expect(main(page).locator('[aria-current="step"]')).toContainText('Đã xuất viện');
  });

  test('the tabs are labelled panels', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0039', 'bacsi_mai');
    await main(page).getByRole('tab', { name: /Lịch sử/ }).click();
    await expect(main(page).getByRole('tabpanel', { name: /Lịch sử/ })).toBeVisible();
  });

  test('phones: the info card sits above the tabs and nothing scrolls sideways @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await openStaff(page, '/nv/noi-tru/stay-NT-0039', 'bacsi_mai');
    const info = await main(page).locator('[data-stay-info]').boundingBox();
    const tabs = await main(page).getByRole('tablist').boundingBox();
    expect(info && tabs && info.y < tabs.y).toBe(true);
    await fitsDevice(page);
  });

  test('desktop: the info card sits beside the tabs in two columns', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1100, 'wide screens only');
    await openStaff(page, '/nv/noi-tru/stay-NT-0039', 'bacsi_mai');
    const info = await main(page).locator('[data-stay-info]').boundingBox();
    const tabs = await main(page).getByRole('tablist').boundingBox();
    expect(info && tabs && info.x < tabs.x && Math.abs(info.y - tabs.y) < 120).toBe(true);
  });
});

async function transfer(page: Page, cage: string, reason?: string) {
  await main(page).getByRole('button', { name: 'Chuyển chuồng…', exact: true }).click();
  const dlg = page.getByRole('dialog');
  await dlg.getByRole('radio', { name: `Chuồng ${cage}` }).click();
  if (reason) await dlg.getByRole('radio', { name: reason }).click();
  await dlg.getByRole('button', { name: 'Chuyển chuồng', exact: true }).click();
}

test.describe('transfer', () => {
  test('move to another cage with a quick reason; the history records it', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0041', 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Chuyển chuồng…', exact: true }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByRole('radio', { name: 'Chuồng M3' }).click();
    await expect(dlg.getByText('M2 → M3')).toBeVisible();
    await dlg.getByRole('radio', { name: 'Cách ly' }).click();
    await dlg.getByRole('button', { name: 'Chuyển chuồng', exact: true }).click();
    await expect(toast(page, 'Đã chuyển Miu sang chuồng M3.')).toBeVisible();
    await expect(main(page).locator('[data-stay-info]')).toContainText('Chuồng M3');
    await main(page).getByRole('tab', { name: /Lịch sử/ }).click();
    await expect(main(page).locator('[data-history]').filter({ hasText: /chuyển/i }).first()).toBeVisible();
  });

  test('"Khác" opens a free text limited to 200 characters', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0041', 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Chuyển chuồng…', exact: true }).click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.getByLabel('Lý do khác')).toHaveCount(0);
    await dlg.getByRole('radio', { name: 'Khác' }).click();
    await expect(dlg.getByLabel('Lý do khác')).toHaveAttribute('maxlength', '200');
  });

  test('a stale form does not overwrite another change', async ({ page, context }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0041', 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Chuyển chuồng…', exact: true }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByRole('radio', { name: 'Chuồng M3' }).click();

    const other = await context.newPage();
    await openStaff(other, '/nv/noi-tru/stay-NT-0041', 'bacsi_mai');
    await transfer(other, 'M1');
    await expect(toast(other, 'Đã chuyển Miu sang chuồng M1.')).toBeVisible();

    await dlg.getByRole('button', { name: 'Chuyển chuồng', exact: true }).click();
    await expect(page.getByText(/vừa được người khác cập nhật/)).toBeVisible();
    await expect(dlg).toHaveCount(0);
    await expect(main(page).locator('[data-stay-info]')).toContainText('Chuồng M1');
  });

  test('no transfer button once the pet is home', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0035', 'bacsi_mai');
    await expect(main(page).locator('[data-stay-info]')).toBeVisible();
    await expect(main(page).getByRole('button', { name: 'Chuyển chuồng…', exact: true })).toHaveCount(0);
  });
});

async function openDischarge(page: Page) {
  await main(page).getByRole('button', { name: 'Xuất viện…', exact: true }).click();
  return page.getByRole('dialog');
}

test.describe('discharge', () => {
  test('the bill summary follows the discharge time and never shows NaN', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0039', 'bacsi_mai');
    const dlg = await openDischarge(page);
    const bill = dlg.locator('[data-discharge-bill]');
    await expect(bill).toContainText('Hóa đơn đang là bản nháp');
    const before = await bill.innerText();
    const when = dlg.getByLabel('Thời điểm xuất viện');
    await when.fill((await when.getAttribute('min'))!);
    await expect(bill).toContainText('× 0,1 ngày');
    expect(await bill.innerText()).not.toBe(before);
    await when.fill('2020-01-01T00:00');
    await expect(dlg.getByText('Thời điểm xuất viện chưa đúng.')).toBeVisible();
    expect(await dlg.innerText()).not.toMatch(/NaN/);
    await expect(dlg.getByRole('button', { name: 'Xác nhận xuất viện' })).toBeEnabled();
  });

  test('reminders about drafts do not block', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0039', 'bacsi_mai');
    const dlg = await openDischarge(page);
    await expect(dlg.getByText(/Còn \d+ nhật ký nháp chưa chia sẻ/)).toBeVisible();
    await expect(dlg.getByRole('button', { name: 'Xác nhận xuất viện' })).toBeEnabled();
  });

  test('farewell: the suggestion fills it, a dose warns, sharing is offered to people who can share', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0039', 'bacsi_mai');
    const dlg = await openDischarge(page);
    await dlg.getByRole('button', { name: 'Dùng câu gợi ý' }).click();
    await expect(dlg.getByLabel('Lời chào gửi chủ nuôi')).toHaveValue(/Mochi đã khỏe và sẵn sàng về nhà\. Cảm ơn gia đình đã tin tưởng Lê Sơn!/);
    await dlg.getByLabel('Lời chào gửi chủ nuôi').fill('Mochi uống 0,5 ml thuốc nhé');
    await expect(dlg.getByText(/thông tin thuốc hoặc liều dùng/)).toBeVisible();
    await expect(dlg.getByLabel('Chia sẻ ngay với chủ nuôi')).toBeVisible();
    await expect(dlg.getByText('Hướng dẫn dùng thuốc và chăm sóc tại nhà được dặn trực tiếp, không gửi qua web.')).toBeVisible();
  });

  test('confirming discharges: toast, home strip and an empty cage', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0039', 'bacsi_mai');
    const dlg = await openDischarge(page);
    await dlg.getByRole('button', { name: 'Xác nhận xuất viện' }).click();
    await expect(toast(page, /Đã cho Mochi xuất viện · hóa đơn tính/)).toBeVisible();
    await expect(main(page).locator('[data-stay-info]')).toContainText('Đã xuất viện lúc');
    await expect(main(page).getByRole('button', { name: 'Xuất viện…', exact: true })).toHaveCount(0);
    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    await expect(main(page).locator('[data-cage]').filter({ hasText: 'C1' })).toContainText('Trống');
  });

  test('a stale form does not overwrite another discharge', async ({ page, context }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0039', 'bacsi_mai');
    const dlg = await openDischarge(page);
    const other = await context.newPage();
    await openStaff(other, '/nv/noi-tru/stay-NT-0039', 'bacsi_mai');
    await (await openDischarge(other)).getByRole('button', { name: 'Xác nhận xuất viện' }).click();
    await expect(toast(other, /Đã cho Mochi xuất viện/)).toBeVisible();
    await dlg.getByRole('button', { name: 'Xác nhận xuất viện' }).click();
    await expect(page.getByText(/vừa được người khác cập nhật|Bé đã xuất viện/)).toBeVisible();
    await expect(main(page).locator('[data-stay-info]')).toContainText('Đã xuất viện lúc');
  });
});

const LIMITS = 'MP4, MOV, WebM · tối đa 100 MB · chủ nuôi xem 15 giây đầu, không có âm thanh';
const DEMO_NOTE = 'Bản demo: video tải từ máy phát tắt tiếng và dừng ở giây 15; bản chính thức sẽ loại bỏ âm thanh và cắt tệp khi tải lên.';
const TRIM_NOTE = 'Video dài hơn 15 giây: chủ nuôi chỉ xem 15 giây đầu.';
const long20 = () => readFileSync(new URL('./fixtures/long-20s.webm', import.meta.url));
const webm = (bytes = 16) => ({ name: 'clip.webm', mimeType: 'video/webm', buffer: Buffer.alloc(bytes, 1) });

async function openUpload(page: Page, stay = 'stay-NT-0041', as = 'bacsi_mai') {
  await openStaff(page, `/nv/noi-tru/${stay}`, as);
  await main(page).getByRole('tab', { name: /Video/ }).click();
  await main(page).getByRole('button', { name: 'Tải video lên' }).click();
  return page.getByRole('dialog');
}

test.describe('upload a video', () => {
  test('a sample clip goes through three steps and can be kept as a draft', async ({ page }) => {
    const dlg = await openUpload(page);
    await expect(dlg.getByText('Bước 1/3')).toBeVisible();
    await expect(dlg.getByText(LIMITS)).toBeVisible();
    await expect(dlg.getByRole('button', { name: 'Tiếp' })).toBeDisabled();
    await dlg.locator('[data-demo-clip]', { hasText: 'Mèo chợp mắt' }).click();
    await expect(dlg.getByText('Chỉ lưu trên trình duyệt này')).toHaveCount(0);
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await expect(dlg.getByText('Bước 2/3')).toBeVisible();
    await dlg.locator('[data-caption-hint]').first().click();
    await expect(dlg.getByLabel('Lời nhắn kèm video')).toHaveValue('Miu sưởi nắng buổi sáng');
    await expect(dlg.getByText(/\/120/)).toBeVisible();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await expect(dlg.getByText('Bước 3/3')).toBeVisible();
    const shareNow = dlg.getByRole('button', { name: 'Tải lên và chia sẻ' });
    await expect(shareNow).toBeDisabled();
    await dlg.getByLabel('Video không có người hay thú cưng của khách khác').check();
    await dlg.getByLabel('Không thấy tên thuốc, y lệnh hay giấy tờ nội bộ').check();
    await expect(shareNow).toBeEnabled();
    await dlg.getByRole('button', { name: 'Lưu nháp' }).click();
    await expect(toast(page, 'Đã tải video lên.')).toBeVisible();
    const card = main(page).locator('[data-staff-video]', { hasText: 'Miu sưởi nắng buổi sáng' });
    await expect(card.getByText('Bản nháp')).toBeVisible();
  });

  test('a device file: preview, unknown length shown as a dash, shared with both ticks; the owner sees it with the chip', async ({ page, context }) => {
    const dlg = await openUpload(page);
    await dlg.getByRole('radio', { name: 'Chọn từ máy' }).click();
    await dlg.locator('input[type="file"]').setInputFiles(webm());
    await expect(dlg.locator('[data-upload-preview]')).toBeVisible();
    await expect(dlg.locator('[data-upload-duration]')).toContainText('—');
    await expect(dlg.getByText(DEMO_NOTE)).toBeVisible();
    await expect(dlg.getByText(TRIM_NOTE)).toHaveCount(0);
    await expect(dlg.getByText('Chỉ lưu trên trình duyệt này')).toBeVisible();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await dlg.getByLabel('Lời nhắn kèm video').fill('Miu chơi trong vườn');
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await dlg.getByLabel('Video không có người hay thú cưng của khách khác').check();
    await dlg.getByLabel('Không thấy tên thuốc, y lệnh hay giấy tờ nội bộ').check();
    await dlg.getByRole('button', { name: 'Tải lên và chia sẻ' }).click();
    await expect(toast(page, 'Đã tải video lên và chia sẻ với chủ nuôi.')).toBeVisible();

    const owner = await context.newPage();
    await openStaff(owner, '/khach-hang/noi-tru/stay-NT-0041', 'lan_nguyen');
    // Which thumbnail is the new one depends on the sample videos shown at this time of day, so try them until the chip shows.
    const thumbs = owner.locator('[data-video-thumb]');
    let seen = false;
    for (let i = 0; i < (await thumbs.count()) && !seen; i++) {
      await thumbs.nth(i).click();
      seen = await owner.getByText('Chỉ lưu trên trình duyệt này').first().waitFor({ timeout: 1500 }).then(() => true, () => false);
    }
    expect(seen).toBe(true);
  });

  test('a file that is not a video shows the exact message at once; 21 MB is no longer too big (owner, 22/10: up to 100 MB)', async ({ page }) => {
    const dlg = await openUpload(page);
    await dlg.getByRole('radio', { name: 'Chọn từ máy' }).click();
    const input = dlg.locator('input[type="file"]');
    await input.setInputFiles(webm(21 * 1024 * 1024));
    await expect(dlg.getByText(/Video lớn hơn/)).toHaveCount(0);
    await input.setInputFiles({ name: 'note.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
    await expect(dlg.getByText('Tệp này không phải video. Bạn chọn tệp MP4, MOV hoặc WebM nhé.')).toBeVisible();
    await expect(dlg.getByRole('button', { name: 'Tiếp' })).toBeDisabled();
  });

  test('a video longer than 15 seconds is not an error: it is chosen, a note says only the first 15 seconds are shown, and Next works', async ({ page }) => {
    const dlg = await openUpload(page);
    await dlg.getByRole('radio', { name: 'Chọn từ máy' }).click();
    await dlg.locator('input[type="file"]').setInputFiles({ name: 'long.webm', mimeType: 'video/webm', buffer: long20() });
    await expect(dlg.locator('[data-upload-duration]')).toContainText('20 giây');
    await expect(dlg.getByText(TRIM_NOTE)).toBeVisible();
    await expect(dlg.getByRole('alert')).toHaveCount(0);
    await expect(dlg.getByRole('button', { name: 'Tiếp' })).toBeEnabled();
  });

  test('a file over 100 MB is refused with the exact message and Next stays off', async ({ page }) => {
    const dlg = await openUpload(page);
    await dlg.getByRole('radio', { name: 'Chọn từ máy' }).click();
    // A sparse file on disk: Playwright does not accept an in-memory upload over 50 MB.
    const dir = mkdtempSync(join(tmpdir(), 'leson-big-'));
    const big = join(dir, 'big.webm');
    const fd = openSync(big, 'w');
    ftruncateSync(fd, 100 * 1024 * 1024 + 1);
    closeSync(fd);
    try {
      await dlg.locator('input[type="file"]').setInputFiles(big);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
    await expect(dlg.getByText('Video lớn hơn 100 MB. Bạn chọn video khác nhé.')).toBeVisible();
    await expect(dlg.getByRole('button', { name: 'Tiếp' })).toBeDisabled();
  });

  test('a zero-byte or oddly typed video-like file never leaves the dialog stuck', async ({ page }) => {
    const dlg = await openUpload(page);
    await dlg.getByRole('radio', { name: 'Chọn từ máy' }).click();
    await dlg.locator('input[type="file"]').setInputFiles({ name: 'empty.mp4', mimeType: 'video/mp4', buffer: Buffer.alloc(0) });
    await expect(dlg.getByRole('button', { name: 'Tiếp' })).toBeEnabled();
  });

  test('no upload button after discharge', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0035', 'bacsi_mai');
    await main(page).getByRole('tab', { name: /Video/ }).click();
    await expect(main(page).getByRole('button', { name: 'Tải video lên' })).toHaveCount(0);
  });
});

async function uploadDeviceVideo(page: Page, caption: string, share: boolean, file: { name: string; mimeType: string; buffer: Buffer } = webm()) {
  await main(page).getByRole('tab', { name: /Video/ }).click();
  await main(page).getByRole('button', { name: 'Tải video lên' }).click();
  const dlg = page.getByRole('dialog');
  await dlg.getByRole('radio', { name: 'Chọn từ máy' }).click();
  await dlg.locator('input[type="file"]').setInputFiles(file);
  await dlg.getByRole('button', { name: 'Tiếp' }).click();
  await dlg.getByLabel('Lời nhắn kèm video').fill(caption);
  await dlg.getByRole('button', { name: 'Tiếp' }).click();
  if (share) {
    await dlg.getByLabel('Video không có người hay thú cưng của khách khác').check();
    await dlg.getByLabel('Không thấy tên thuốc, y lệnh hay giấy tờ nội bộ').check();
    await dlg.getByRole('button', { name: 'Tải lên và chia sẻ' }).click();
  } else await dlg.getByRole('button', { name: 'Lưu nháp' }).click();
}

test.describe('a long video plays only its first 15 seconds', () => {
  test('the player shows 0:15 as its length, pauses there, and starts again from the beginning', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0041', 'bacsi_mai');
    await uploadDeviceVideo(page, 'Video dài hai mươi giây', false, { name: 'long.webm', mimeType: 'video/webm', buffer: long20() });
    await expect(toast(page, 'Đã tải video lên.')).toBeVisible();
    await main(page).locator('[data-staff-video]', { hasText: 'Video dài hai mươi giây' }).getByRole('button', { name: /Xem video/ }).click();
    const dlg = page.getByRole('dialog');
    const video = dlg.locator('video');
    await expect(dlg.getByText(/\/ 0:15/)).toBeVisible();
    await video.evaluate((v: HTMLVideoElement) => { v.playbackRate = 16; });
    await expect(dlg.getByText('0:15 / 0:15')).toBeVisible({ timeout: 15000 });
    expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    expect(await video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeLessThanOrEqual(15.01);
    await dlg.getByRole('button', { name: 'Phát video' }).click();
    await expect(dlg.getByText(/^0:0\d \/ 0:15$/)).toBeVisible();
  });
});

test.describe('whole stay', () => {
  test('the whole round: admit, transfer, upload and share, the owner sees it, discharge with a farewell, bill by the day, cages empty again', async ({ page, context }) => {
    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    await admit(page, { search: 'Bông', cage: 'C2', reason: 'Theo dõi sau tiêm' });
    await expect(toast(page, 'Đã nhập viện Bông vào chuồng C2.')).toBeVisible();
    await expect(page).toHaveURL(/#\/nv\/noi-tru\/[^/]+$/);
    const stayId = page.url().split('/').pop()!;
    await expect(main(page).locator('[data-stay-info]')).toContainText('Chuồng C2');
    const invoiceHref = await main(page).locator('[data-stay-info]').getByRole('link', { name: 'Mở hóa đơn' }).getAttribute('href');

    await transfer(page, 'C5', 'Đổi khu');
    await expect(toast(page, 'Đã chuyển Bông sang chuồng C5.')).toBeVisible();

    await uploadDeviceVideo(page, 'Bông chơi trong vườn', true);
    await expect(toast(page, 'Đã tải video lên và chia sẻ với chủ nuôi.')).toBeVisible();

    const owner = await context.newPage();
    await openStaff(owner, `/khach-hang/noi-tru/${stayId}`, 'lan_nguyen');
    await expect(owner.getByRole('heading', { name: /Bông/, level: 1 })).toBeVisible();
    await owner.locator('[data-video-thumb]').last().click();
    await expect(owner.getByText('Chỉ lưu trên trình duyệt này')).toBeVisible();
    const ownerText = await owner.locator('[data-zone="customer"] main').innerText();
    expect(ownerText).not.toContain('C5');

    await main(page).getByRole('button', { name: 'Xuất viện…', exact: true }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByRole('button', { name: 'Dùng câu gợi ý' }).click();
    await dlg.getByLabel('Chia sẻ ngay với chủ nuôi').check();
    await dlg.getByRole('button', { name: 'Xác nhận xuất viện' }).click();
    await expect(toast(page, /Đã cho Bông xuất viện · hóa đơn tính 0,1 ngày\./)).toBeVisible();

    await openStaff(owner, `/khach-hang/noi-tru/${stayId}`, 'lan_nguyen');
    await expect(owner.getByText(/Bông đã khỏe và sẵn sàng về nhà/)).toBeVisible();

    await openStaff(page, invoiceHref!.replace(/^#/, ''), 'bacsi_mai');
    const line = main(page).locator('[data-line]', { hasText: 'Nội trú chó dưới 15 kg' });
    await expect(line).toBeVisible();
    await expect(line).toContainText('0,1');

    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    for (const cage of ['C2', 'C5']) await expect(main(page).locator('[data-cage]').filter({ hasText: cage })).toContainText('Trống');
  });

  test('spa_ngocanh can admit (a doctor is required), transfer, share a video and discharge, but never sees internal data', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru', 'spa_ngocanh');
    await main(page).getByRole('button', { name: 'Nhập viện', exact: true }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByRole('searchbox', { name: SEARCH }).fill('Đậu');
    await dlg.locator('[data-pet-option]').first().click();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await dlg.getByLabel('Lý do nhập viện').fill('Gửi nội trú');
    await dlg.getByRole('radio', { name: 'Chuồng C6' }).click();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await dlg.getByRole('button', { name: 'Nhập viện', exact: true }).click();
    await expect(dlg.getByText('Bạn chọn bác sĩ phụ trách nhé.')).toBeVisible();
    await expect(dlg.getByText('Bước 2/3')).toBeVisible();
    await dlg.getByLabel('Bác sĩ phụ trách').selectOption({ index: 1 });
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await dlg.getByRole('button', { name: 'Nhập viện', exact: true }).click();
    await expect(toast(page, 'Đã nhập viện Đậu vào chuồng C6.')).toBeVisible();

    await expect(main(page).getByRole('tab', { name: /Hồ sơ nội bộ/ })).toHaveCount(0);
    await transfer(page, 'C2');
    await expect(toast(page, 'Đã chuyển Đậu sang chuồng C2.')).toBeVisible();
    await uploadDeviceVideo(page, 'Đậu vẫy đuôi', true);
    await expect(toast(page, 'Đã tải video lên và chia sẻ với chủ nuôi.')).toBeVisible();
    await main(page).getByRole('tab', { name: /Lịch sử/ }).click();
    await expect(main(page).locator('[data-history]').first()).toBeVisible();

    await main(page).getByRole('button', { name: 'Xuất viện…', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận xuất viện' }).click();
    await expect(toast(page, /Đã cho Đậu xuất viện/)).toBeVisible();
    await expect(main(page).locator('[data-stay-info]')).toContainText('Đã xuất viện lúc');
  });

  test('axe finds nothing serious or critical in the four dialogs', async ({ page }) => {
    const scan = async (label: string) => {
      const r = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).include('[role="dialog"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      const bad = r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical');
      expect(bad.map((x) => `${label}: ${x.id}: ${x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    };
    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Nhập viện', exact: true }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByRole('searchbox', { name: SEARCH }).fill('Bông');
    await dlg.locator('[data-pet-option]').first().click();
    await page.waitForTimeout(400);
    await scan('admit step 1');
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await dlg.getByLabel('Lý do nhập viện').fill('Theo dõi');
    await dlg.getByRole('radio', { name: 'Chuồng C2' }).click();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await page.waitForTimeout(400);
    await scan('admit step 3');
    await page.keyboard.press('Escape');

    await openStaff(page, '/nv/noi-tru/stay-NT-0039', 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Chuyển chuồng…', exact: true }).click();
    await page.waitForTimeout(400);
    await scan('transfer');
    await page.keyboard.press('Escape');
    await main(page).getByRole('button', { name: 'Xuất viện…', exact: true }).click();
    await page.waitForTimeout(400);
    await scan('discharge');
    await page.keyboard.press('Escape');
    await main(page).getByRole('tab', { name: /Video/ }).click();
    await main(page).getByRole('button', { name: 'Tải video lên' }).click();
    await page.waitForTimeout(400);
    await scan('upload step 1');
  });

  test('phones: every dialog and the stay page fit the width @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await openStaff(page, '/nv/noi-tru/stay-NT-0039', 'bacsi_mai');
    await fitsDevice(page);
    for (const name of ['Chuyển chuồng…', 'Xuất viện…']) {
      await main(page).getByRole('button', { name, exact: true }).click();
      await page.waitForTimeout(400);
      await fitsDevice(page);
      await page.keyboard.press('Escape');
    }
    await main(page).getByRole('tab', { name: /Video/ }).click();
    await main(page).getByRole('button', { name: 'Tải video lên' }).click();
    await page.waitForTimeout(400);
    await fitsDevice(page);
    await page.keyboard.press('Escape');
    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Nhập viện', exact: true }).click();
    await page.waitForTimeout(400);
    await fitsDevice(page);
  });

  test('keyboard: arrows move between cages and Esc closes the dialog, returning focus to its button', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru/stay-NT-0041', 'bacsi_mai');
    const opener = main(page).getByRole('button', { name: 'Chuyển chuồng…', exact: true });
    await opener.click();
    const dlg = page.getByRole('dialog');
    await page.waitForTimeout(150); // the dialog moves focus to its first control shortly after opening; let that settle
    const first = dlg.getByRole('radio').first();
    await first.focus();
    await page.keyboard.press('ArrowRight');
    await expect(dlg.getByRole('radio', { checked: true })).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(dlg).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
});

test.describe('review fixes', () => {
  test('choosing a second file quickly never leaves the first file\'s verdict on screen', async ({ page }) => {
    const dlg = await openUpload(page);
    await dlg.getByRole('radio', { name: 'Chọn từ máy' }).click();
    const input = dlg.locator('input[type="file"]');
    // Both files in the same tick, as a fast double pick would: the first file's length reading finishes after the second pick.
    await input.evaluate((el: HTMLInputElement) => {
      const pick = (file: File) => { const dt = new DataTransfer(); dt.items.add(file); el.files = dt.files; el.dispatchEvent(new Event('change', { bubbles: true })); };
      pick(new File([new Uint8Array(16)], 'clip.webm', { type: 'video/webm' }));
      pick(new File(['hello'], 'note.txt', { type: 'text/plain' }));
    });
    await page.waitForTimeout(3500); // longer than the first file's length reading may take
    await expect(dlg.getByText('Tệp này không phải video. Bạn chọn tệp MP4, MOV hoặc WebM nhé.')).toBeVisible();
    await expect(dlg.getByRole('button', { name: 'Tiếp' })).toBeDisabled();
  });

  test('discharging right after admission shows the bill, not a time error', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    await admit(page, { search: 'Bông', cage: 'C2' });
    await expect(toast(page, 'Đã nhập viện Bông vào chuồng C2.')).toBeVisible();
    const dlg = await openDischarge(page);
    await expect(dlg.locator('[data-discharge-bill]')).toBeVisible();
    await expect(dlg.getByText('Thời điểm xuất viện chưa đúng.')).toHaveCount(0);
  });

  test('an open upload dialog survives another tab discharging the pet', async ({ page, context }) => {
    const dlg = await openUpload(page, 'stay-NT-0039');
    await expect(dlg.getByText('Bước 1/3')).toBeVisible();
    const other = await context.newPage();
    await openStaff(other, '/nv/noi-tru/stay-NT-0039', 'bacsi_mai');
    await (await openDischarge(other)).getByRole('button', { name: 'Xác nhận xuất viện' }).click();
    await expect(toast(other, /Đã cho Mochi xuất viện/)).toBeVisible();
    await page.waitForTimeout(800);
    await expect(page.getByRole('dialog').getByText('Bước 1/3')).toBeVisible();
  });
});
