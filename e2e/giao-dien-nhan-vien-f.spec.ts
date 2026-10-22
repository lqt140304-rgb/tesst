import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openStaff, staffMain as main } from './helpers';
import { fitsDevice } from './width';

const nav = (page: Page) => page.getByRole('navigation', { name: 'Khu nhân viên' });
const current = (page: Page) => main(page).locator('[data-period="current"]');
const previous = (page: Page) => main(page).locator('[data-period="previous"]');
const EMPTY = 'Chưa có lịch hẹn, yêu cầu hay khách mới trong kỳ này. Thử chọn kỳ dài hơn.';
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

const HEADLINES = ['scheduled', 'received', 'newCustomers', 'admitted'] as const;
const headline = (page: Page, key: (typeof HEADLINES)[number]) => main(page).locator(`[data-headline="${key}"]`);
const valueOf = async (page: Page, key: (typeof HEADLINES)[number]) => Number(await headline(page, key).getAttribute('data-value'));

test.describe('first row', () => {
  test('four numbers in order, each with a comparison in words', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao', 'quanly_ha');
    const labels = ['Lịch đã hẹn', 'Yêu cầu nhận', 'Khách mới', 'Lượt nhập nội trú'];
    for (const [i, key] of HEADLINES.entries()) {
      const cell = headline(page, key);
      await expect(cell).toContainText(labels[i]!);
      expect(Number.isInteger(await valueOf(page, key))).toBe(true);
      await expect(cell).toContainText(/(nhiều hơn|ít hơn) kỳ trước \d|bằng kỳ trước|kỳ trước chưa có/);
    }
    const order = await main(page).locator('[data-headline]').evaluateAll((els) => els.map((e) => e.getAttribute('data-headline')));
    expect(order).toEqual([...HEADLINES]);
  });

  test('the numbers follow the period', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao', 'quanly_ha');
    await main(page).getByRole('radio', { name: 'Tháng này' }).click();
    await expect(current(page)).toContainText(' đến ');
    const month = await Promise.all(HEADLINES.map((k) => valueOf(page, k)));
    await main(page).getByRole('radio', { name: 'Hôm nay' }).click();
    await expect(current(page)).not.toContainText(' đến ');
    const today = await Promise.all(HEADLINES.map((k) => valueOf(page, k)));
    today.forEach((n, i) => expect(n).toBeLessThanOrEqual(month[i]!));
  });

  test('"Cần chú ý lúc này" matches the sample stock and opens the right pages', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao', 'quanly_ha');
    const attention = main(page).getByRole('region', { name: 'Cần chú ý lúc này' });
    await expect(attention.getByText('Không phụ thuộc kỳ đã chọn.')).toBeVisible();
    await expect(attention.locator('[data-attention="out"]')).toContainText('1 món kho đã hết hàng');
    await expect(attention.locator('[data-attention="low"]')).toContainText('3 món kho sắp hết');
    await expect(attention.locator('[data-attention="soon"]')).toContainText('1 món sắp hết hạn');
    await expect(attention.locator('[data-attention="expired"]')).toContainText('1 món đã hết hạn');
    await attention.locator('[data-attention="out"] a').click();
    await expect(page).toHaveURL(/\/nv\/kho\?tt=het/);
    await expect(main(page).locator('[data-row]')).toHaveCount(1);
    await page.goBack();
    await attention.locator('[data-attention="soon"] a').click();
    await expect(page).toHaveURL(/\/nv\/kho\?tt=han/);
    await expect(main(page).locator('[data-row]')).toHaveCount(2); // the expiry filter covers soon and expired
  });

  test('requests waiting right now link to the request screen', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao', 'quanly_ha');
    const waiting = main(page).locator('[data-attention="requests"]');
    test.skip((await waiting.count()) === 0, 'no request is waiting in the sample data today');
    await expect(waiting).toContainText(/\d+ yêu cầu đang chờ xử lý/);
    await waiting.locator('a').click();
    await expect(page).toHaveURL(/\/nv\/yeu-cau/);
  });

  test('phones: the first row stacks and fits @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await openStaff(page, '/nv/bao-cao', 'quanly_ha');
    await expect(headline(page, 'scheduled')).toBeVisible();
    await fitsDevice(page);
  });
});

const ratioCounts = (page: Page, group: 'service' | 'source' | 'status') =>
  main(page).locator(`[data-ratio="${group}"] [data-ratio-row]`).evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-count'))));
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

test.describe('appointments and requests', () => {
  test('the groups add up to the numbers they split', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao?ky=thang-nay', 'quanly_ha');
    await expect(main(page).getByRole('heading', { level: 2, name: 'Lịch hẹn' })).toBeVisible();
    const summary = main(page).locator('[data-summary="appointments"]');
    await expect(summary).toHaveText(/^(Đã hẹn \d+ lịch, đã hủy \d+ \((\d+(,\d)?%|Chưa có)\)\.|Chưa có lịch nào trong kỳ\.)$/);
    const scheduled = await valueOf(page, 'scheduled');
    expect(sum(await ratioCounts(page, 'service'))).toBe(scheduled);
    expect(sum(await ratioCounts(page, 'source'))).toBe(scheduled);
    expect(await ratioCounts(page, 'service')).toHaveLength(3);
    expect(await ratioCounts(page, 'source')).toHaveLength(3);
    const received = await valueOf(page, 'received');
    expect(await ratioCounts(page, 'status')).toHaveLength(6); // every status, even at 0
    expect(sum(await ratioCounts(page, 'status'))).toBe(received);
  });

  test('the request block shows rates in words, never NaN or a made-up percent', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao?ky=hom-nay', 'quanly_ha');
    await expect(main(page).getByRole('heading', { level: 2, name: 'Yêu cầu đặt lịch' })).toBeVisible();
    await expect(main(page).locator('[data-kpi="received"]')).toBeVisible();
    await expect(main(page).locator('[data-kpi="confirmRate"]')).toHaveText(/(\d+(,\d)?%|Chưa có)/);
    await expect(main(page).locator('[data-kpi="firstResponse"]')).toHaveText(/(\d+ phút|\d+ giờ( \d+ phút)?|Chưa có)/);
    const text = await main(page).innerText();
    expect(text).not.toMatch(/NaN|Infinity|undefined|—/);
  });

  test('the day chart has a table twin that adds up to the appointments', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao', 'quanly_ha');
    await expect(main(page).getByRole('figure', { name: 'Biểu đồ lịch đã hẹn theo ngày' })).toBeVisible();
    await main(page).getByRole('button', { name: 'Xem dạng bảng' }).first().click();
    const table = main(page).getByRole('table', { name: 'Bảng lịch đã hẹn theo ngày' });
    await expect(table.getByRole('columnheader', { name: 'Ngày' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Số lịch' })).toBeVisible();
    const counts = await table.locator('[data-row]').evaluateAll((rows) => rows.map((r) => Number((r.querySelectorAll('td')[1]?.textContent ?? '').replace(/\D/g, ''))));
    expect(sum(counts)).toBe(await valueOf(page, 'scheduled'));
    await main(page).getByRole('button', { name: 'Xem biểu đồ' }).first().click();
    await expect(main(page).getByRole('figure', { name: 'Biểu đồ lịch đã hẹn theo ngày' })).toBeVisible();
  });

  test('a whole year loads without trouble (weekly bars) @year', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao', 'quanly_ha');
    await main(page).getByRole('radio', { name: 'Chọn ngày' }).click();
    await applyRange(page, '2025-10-22', '2026-10-21');
    await expect(page).toHaveURL(/tu=2025-10-22&den=2026-10-21/);
    await expect(current(page)).toContainText('22/10/2025 đến 21/10/2026');
    await expect(main(page).getByRole('figure', { name: 'Biểu đồ lịch đã hẹn theo ngày' })).toBeVisible();
    expect(await main(page).innerText()).not.toMatch(/NaN|Infinity|undefined/);
    if ((page.viewportSize()?.width ?? 0) < 768) await fitsDevice(page);
  });

  test('phones: both blocks fit the width @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await openStaff(page, '/nv/bao-cao?ky=thang-nay', 'quanly_ha');
    await expect(main(page).locator('[data-ratio="status"]')).toBeVisible();
    await fitsDevice(page);
  });
});

test.describe('inpatient, revenue and empty period', () => {
  test('the inpatient strip explains its numbers', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao', 'quanly_ha');
    await expect(main(page).getByRole('heading', { level: 2, name: 'Nội trú' })).toBeVisible();
    for (const k of ['inpatient-current', 'inpatient-moves', 'inpatient-bedDays', 'inpatient-occupancy']) await expect(main(page).locator(`[data-kpi="${k}"]`)).toBeVisible();
    await expect(main(page).locator('[data-kpi="inpatient-moves"]')).toHaveText(/\d+ nhập, \d+ xuất/);
    await expect(main(page).locator('[data-kpi="inpatient-bedDays"]')).toHaveText(/\d+(,\d)? ngày/);
    await expect(main(page).locator('[data-kpi="inpatient-occupancy"]')).toHaveText(/(\d+(,\d)?%|Chưa có)/);
    await expect(main(page).getByText('Tổng số ngày các bé đã ở nội trú trong kỳ.')).toBeVisible();
    await expect(main(page).getByText('Phần chuồng có bé ở, tính theo cả kỳ.')).toBeVisible();
  });

  test('the manager sees the money block and can go to the revenue page', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao?ky=thang-nay', 'quanly_ha');
    await expect(main(page).getByRole('heading', { level: 2, name: 'Doanh thu trong kỳ' })).toBeVisible();
    for (const k of ['collected', 'invoiced', 'outstanding']) await expect(main(page).locator(`[data-kpi="${k}"]`)).toHaveText(/\d[\d.\s]*₫/);
    await expect(main(page).locator('[data-kpi="collected"]')).toContainText(/nhiều hơn kỳ trước|ít hơn kỳ trước|bằng kỳ trước|kỳ trước chưa có/);
    await main(page).getByRole('link', { name: 'Xem chi tiết doanh thu' }).click();
    await expect(page).toHaveURL(/\/nv\/doanh-thu/);
  });

  test('a period with nothing in it says so, keeps the attention list and shows no NaN', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao', 'quanly_ha');
    await main(page).getByRole('radio', { name: 'Chọn ngày' }).click();
    await applyRange(page, '2020-01-01', '2020-01-07');
    await expect(main(page).getByText('Chưa có lịch hẹn, yêu cầu hay khách mới trong kỳ này. Thử chọn kỳ dài hơn.')).toBeVisible();
    await expect(current(page)).toContainText('01/01/2020 đến 07/01/2020');
    for (const k of HEADLINES) expect(await valueOf(page, k)).toBe(0);
    await expect(main(page).getByRole('region', { name: 'Cần chú ý lúc này' })).toBeVisible();
    await expect(main(page).getByRole('heading', { level: 2, name: 'Lịch hẹn' })).toHaveCount(0);
    await expect(main(page).getByRole('heading', { level: 2, name: 'Yêu cầu đặt lịch' })).toHaveCount(0);
    expect(await main(page).innerText()).not.toMatch(/NaN|Infinity|undefined|—/);
  });

  test('works from the keyboard: the chart/table switch opens with Space', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao', 'quanly_ha');
    const toggle = main(page).getByRole('button', { name: 'Xem dạng bảng' });
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(main(page).getByRole('table', { name: 'Bảng lịch đã hẹn theo ngày' })).toBeVisible();
  });

  test('axe finds nothing serious on the full page, with the table open and on an empty period', async ({ page }) => {
    const scan = async (label: string) => {
      await page.waitForTimeout(500);
      const r = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      const bad = r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical');
      expect(bad.map((x) => `${label}: ${x.id}: ${x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    };
    await openStaff(page, '/nv/bao-cao?ky=thang-nay', 'quanly_ha');
    await expect(main(page).getByRole('heading', { level: 2, name: 'Doanh thu trong kỳ' })).toBeVisible();
    await scan('full page');
    await main(page).getByRole('button', { name: 'Xem dạng bảng' }).click();
    await expect(main(page).getByRole('table', { name: 'Bảng lịch đã hẹn theo ngày' })).toBeVisible();
    await scan('table open');
    await openStaff(page, '/nv/bao-cao?tu=2020-01-01&den=2020-01-07', 'quanly_ha');
    await expect(main(page).getByText('Chưa có lịch hẹn, yêu cầu hay khách mới trong kỳ này. Thử chọn kỳ dài hơn.')).toBeVisible();
    await scan('empty period');
  });

  test('phones: the whole page fits the width @narrow', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone only');
    await openStaff(page, '/nv/bao-cao?ky=thang-nay', 'quanly_ha');
    await expect(main(page).getByRole('heading', { level: 2, name: 'Doanh thu trong kỳ' })).toBeVisible();
    await fitsDevice(page);
  });
});

test.describe('review fixes (part 5B)', () => {
  test('"Xem chi tiết doanh thu" opens Doanh thu on the same days', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao', 'quanly_ha'); // the default: 7 days
    await main(page).getByRole('link', { name: 'Xem chi tiết doanh thu' }).click();
    await expect(page).toHaveURL(/\/nv\/doanh-thu\?ky=7-ngay/);
    await expect(main(page).getByRole('radio', { name: '7 ngày' })).toBeChecked();
    await openStaff(page, '/nv/bao-cao?tu=2026-10-01&den=2026-10-15', 'quanly_ha');
    await main(page).getByRole('link', { name: 'Xem chi tiết doanh thu' }).click();
    await expect(page).toHaveURL(/\/nv\/doanh-thu\?tu=2026-10-01&den=2026-10-15/);
  });

  test('the chart never names a highest bar that does not exist', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao?tu=2020-01-01&den=2020-01-07', 'quanly_ha');
    await expect(main(page).getByText(EMPTY)).toBeVisible(); // nothing booked: the chart block is hidden
    await openStaff(page, '/nv/bao-cao?ky=thang-nay', 'quanly_ha');
    const caption = main(page).locator('figcaption');
    await expect(caption).toHaveText(/^(Không có lịch nào trong kỳ\.|Cao nhất \d[\d.]* lịch \/ (ngày|tuần \(mỗi cột là một tuần\))\. Chọn "Xem dạng bảng" để xem số từng (ngày|tuần)\.)$/);
  });

  test('money and headline figures stay on one line from tablet to desktop widths', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 768, 'tablet and desktop widths only');
    for (const width of [768, 1000, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await openStaff(page, '/nv/bao-cao?ky=thang-nay', 'quanly_ha');
      await expect(main(page).locator('[data-kpi="collected"]')).toBeVisible();
      const figures = main(page).locator('[data-kpi="collected"] .num, [data-kpi="invoiced"] .num, [data-kpi="outstanding"] .num, [data-headline] .num');
      const heights = await figures.evaluateAll((els) => els.map((e) => ({ h: e.getBoundingClientRect().height, fs: parseFloat(getComputedStyle(e).fontSize), t: e.textContent })));
      for (const f of heights) expect(f.h, `${f.t} at ${width}px`).toBeLessThan(f.fs * 1.5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });

  test('"Đang nội trú" says it is the number right now', async ({ page }) => {
    await openStaff(page, '/nv/bao-cao?ky=thang-truoc', 'quanly_ha');
    await expect(main(page).locator('[data-kpi="inpatient-current"]')).toContainText('Số lúc này, không phụ thuộc kỳ đã chọn.');
  });
});
