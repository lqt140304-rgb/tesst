import { expect, type Page } from '@playwright/test';

/** Collect console + page errors for a test. */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

/** Open the app at a hash route with instant mock latency (and optionally as a demo user). */
export async function open(page: Page, route = '/', opts: { as?: string } = {}) {
  await page.goto('./#/');
  await page.waitForFunction(() => '__lesonDemo' in window);
  await page.evaluate(async (as) => {
    const d = (window as unknown as { __lesonDemo: { setLatency(ms: number): void; loginAs(u: string): Promise<unknown>; logout(): Promise<void> } }).__lesonDemo;
    d.setLatency(0);
    if (as) await d.loginAs(as);
  }, opts.as ?? null);
  await page.evaluate((r) => { location.hash = r; }, route);
  await page.waitForTimeout(150);
}

export async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Invoice editor: opens "Thêm dịch vụ", searches the price list, adds the item whose button matches, then closes the picker. */
export async function addService(page: Page, query: string, button: RegExp | string) {
  await page.getByRole('button', { name: 'Thêm dịch vụ', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('searchbox', { name: 'Tìm trong bảng giá' }).fill(query);
  await dialog.getByRole('button', { name: button }).click();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
}

export const staffMain = (page: Page) => page.locator('[data-zone="staff"] main');

/** Opens a staff page and waits for the app's own "move focus to the page title" step (≈ 420 ms after navigating), so later focus assertions are not overtaken by it. */
export async function openStaff(page: Page, route: string, as: string) {
  await open(page, route, { as });
  // If the title never takes focus (the page was already settled), carry on: the wait only has to outlast the app's timer.
  await expect(staffMain(page).getByRole('heading', { level: 1 })).toBeFocused({ timeout: 1500 }).catch(() => undefined);
}

/** Creates an appointment through the "Tạo lịch hẹn" form (tomorrow, no assignee unless given), then leaves any panel it opened. */
export async function createAppointment(page: Page, o: { customer: string; pet: string; time: string; minutes?: number; assignee?: string }) {
  const tomorrow = await page.evaluate(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(Date.now() + 864e5)));
  await staffMain(page).getByRole('button', { name: 'Tạo lịch hẹn' }).click();
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
  // The app opens the new appointment in the side panel; close it so the next step starts from the calendar.
  await expect(staffMain(page).locator('[data-detail] h2')).toBeFocused(); // the panel takes focus once it is ready for keys
  await page.keyboard.press('Escape');
  await expect(staffMain(page).locator('[data-detail]')).toHaveCount(0);
  return tomorrow;
}

/** Puts the person's "Số dòng mỗi trang" option back to 10: tests written when every table showed 10 rows (the default is 20 since part 5D). */
export async function tenRowsPerPage(page: Page, as: string) {
  await openStaff(page, '/nv/cai-dat/tuy-chon', as);
  const ten = staffMain(page).getByRole('radiogroup', { name: 'Số dòng mỗi trang' }).getByRole('radio', { name: '10', exact: true });
  await ten.click();
  await expect(ten).toBeChecked();
  await expect(staffMain(page).getByText('Đã lưu.')).toBeVisible();
}


/** Sets the demo clock. Pages that read the clock when they mount need a remount afterwards (see `remountHome`). */
export const setClock = (page: Page, iso: string | null) =>
  page.evaluate((v) => (window as unknown as { __lesonDemo: { setNow(i: string | null): void } }).__lesonDemo.setNow(v), iso);

/** The homepage reads the clock when it mounts: go to the booking page and come back so it mounts again, then land on `route`. */
export async function remountHome(page: Page, route = '/') {
  await page.evaluate(() => { location.hash = '/dat-lich'; });
  await page.locator('header').getByRole('link', { name: /Về trang chủ/ }).click();
  await page.evaluate((r) => { location.hash = r; }, route);
  await page.waitForTimeout(500);
}

/** Opens the homepage at `route` with the clock inside opening hours (a Monday, 14:00), so booking buttons do not depend on the real time. */
export async function openDuringHours(page: Page, route = '/', opts: { as?: string } = {}) {
  await open(page, route, opts);
  await setClock(page, '2026-10-26T14:00:00+07:00');
  await remountHome(page, route);
}
