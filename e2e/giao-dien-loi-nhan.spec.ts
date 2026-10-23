import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { open, remountHome, setClock } from './helpers';
import { fitsDevice } from './width';

/** Part 6B: leave-a-message dialog, out-of-hours booking, holidays, staff queue (spec 2026-10-23-phan-6b). */
type Row = { id: string; version: number; name: string; phone: string; text: string; about?: string; status: string };
type Demo = {
  api: {
    public: { inquiries: { submit(i: { name: string; phone: string; text: string; about?: string }): Promise<unknown> } };
    staff: {
      inquiries: { list(f?: { status?: string }): Promise<Row[]> };
      content: { products: { create(i: { name: string; category: string }): Promise<string> } };
    };
  };
  loginAs(u: string): Promise<unknown>; logout(): Promise<void>;
};

/** Reads the staff inquiry list as the Quản lý, then signs out again. */
export async function inquiriesNow(page: Page): Promise<Row[]> {
  return page.evaluate(async () => {
    const d = (window as unknown as { __lesonDemo: Demo }).__lesonDemo;
    await d.loginAs('quanly_ha');
    const rows = await d.api.staff.inquiries.list();
    await d.logout();
    return rows;
  });
}
const product = (page: Page) => page.locator('#san-pham [data-product]').first();
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Để lại lời nhắn' });
async function openAsk(page: Page) {
  const btn = product(page).getByRole('button', { name: /^Hỏi mua/ });
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await expect(dialog(page)).toBeVisible();
  return btn;
}
async function fill(page: Page, name: string, phone: string, text: string) {
  await dialog(page).getByLabel('Tên của bạn').fill(name);
  await dialog(page).getByLabel('Số điện thoại').fill(phone);
  await dialog(page).getByLabel('Lời nhắn').fill(text);
}

test.describe('hộp thoại lời nhắn', () => {
  test('"Hỏi mua" opens it, names the product, and tells the opening hours', async ({ page }) => {
    await open(page, '/');
    const name = await product(page).getByRole('heading', { level: 3 }).innerText();
    const btn = product(page).getByRole('button', { name: `Hỏi mua: ${name}` });
    await expect(btn).toBeVisible();
    await expect(product(page).getByRole('link', { name: /^Hỏi mua/ })).toHaveCount(0);
    await openAsk(page);
    await expect(dialog(page).getByText(`Bạn hỏi về: ${name}`)).toBeVisible();
    await expect(dialog(page)).toContainText('08:00–21:00');
  });

  test('empty and wrong boxes are told apart; the counter follows the text', async ({ page }) => {
    await open(page, '/');
    await openAsk(page);
    await dialog(page).getByRole('button', { name: 'Gửi lời nhắn' }).click();
    for (const label of ['Tên của bạn', 'Số điện thoại', 'Lời nhắn']) await expect(dialog(page).getByLabel(label)).toHaveAttribute('aria-invalid', 'true');
    await expect(dialog(page).getByLabel('Tên của bạn')).toBeFocused();
    await fill(page, 'Lan', '123', 'x'.repeat(20));
    await expect(dialog(page).getByText('20/500')).toBeVisible();
    await dialog(page).getByRole('button', { name: 'Gửi lời nhắn' }).click();
    await expect(dialog(page).getByLabel('Số điện thoại')).toHaveAttribute('aria-invalid', 'true');
    await expect(dialog(page).getByLabel('Tên của bạn')).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('sending says so; a double click makes one message; the same words again make no second', async ({ page }) => {
    await open(page, '/');
    await openAsk(page);
    await fill(page, 'Lan Nguyễn', '0912 345 678', 'Tôi muốn hỏi mua loại này.');
    // Two submits in the same instant (a double click or Enter twice): the second must send nothing.
    await page.evaluate(() => { const f = document.querySelector<HTMLFormElement>('[role="dialog"] form')!; f.requestSubmit(); f.requestSubmit(); });
    await expect(dialog(page).getByText('Đã gửi. Lê Sơn sẽ gọi lại cho bạn.')).toBeVisible();
    await expect(dialog(page).getByRole('button', { name: 'Đóng' }).first()).toBeVisible();
    let rows = (await inquiriesNow(page)).filter((r) => r.text === 'Tôi muốn hỏi mua loại này.');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.about).toBeTruthy();
    await page.keyboard.press('Escape');
    await openAsk(page);
    await fill(page, 'Lan Nguyễn', '0912 345 678', 'Tôi muốn hỏi mua loại này.');
    await dialog(page).getByRole('button', { name: 'Gửi lời nhắn' }).click();
    await expect(dialog(page).getByText('Đã gửi. Lê Sơn sẽ gọi lại cho bạn.')).toBeVisible();
    rows = (await inquiriesNow(page)).filter((r) => r.text === 'Tôi muốn hỏi mua loại này.');
    expect(rows).toHaveLength(1);
  });

  test('the fourth different message from one number in a day points to the hotline', async ({ page }) => {
    await open(page, '/');
    await page.evaluate(async () => {
      const d = (window as unknown as { __lesonDemo: Demo }).__lesonDemo;
      for (const t of ['một', 'hai', 'ba']) await d.api.public.inquiries.submit({ name: 'Mai', phone: '0987 654 321', text: `lời nhắn ${t}` });
    });
    await openAsk(page);
    await fill(page, 'Mai', '0987 654 321', 'lời nhắn bốn');
    await dialog(page).getByRole('button', { name: 'Gửi lời nhắn' }).click();
    await expect(dialog(page).getByText('Bạn gọi hotline 097 355 51 05 giúp Lê Sơn nhé.')).toBeVisible();
    await expect(dialog(page).getByLabel('Lời nhắn')).toHaveAttribute('aria-invalid', 'true');
  });

  test('Esc closes it and focus returns to the button that opened it', async ({ page }) => {
    await open(page, '/');
    const btn = await openAsk(page);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    await expect(btn).toBeFocused();
  });

  test('a signed-in customer has the name filled in; the phone is still asked', async ({ page }) => {
    await open(page, '/', { as: 'lan_nguyen' });
    await openAsk(page);
    expect(await dialog(page).getByLabel('Tên của bạn').inputValue()).not.toBe('');
    expect(await dialog(page).getByLabel('Số điện thoại').inputValue()).toBe('');
  });

  test('staff are refused with the system sentence, as a general error', async ({ page }) => {
    await open(page, '/', { as: 'quanly_ha' });
    await openAsk(page);
    await fill(page, 'Hà', '0912 345 679', 'thử thôi');
    await dialog(page).getByRole('button', { name: 'Gửi lời nhắn' }).click();
    await expect(dialog(page).getByText('Bạn đang đăng nhập bằng tài khoản nhân viên. Lời nhắn này dành cho khách.')).toBeVisible();
  });

  test('a product named with the longest allowed name and odd characters is asked about without a field error', async ({ page }) => {
    const name = `Hạt "đặc biệt" <b>&</b> '${'x'.repeat(40)}`.slice(0, 60);
    await open(page, '/');
    await page.evaluate(async (n) => {
      const d = (window as unknown as { __lesonDemo: Demo }).__lesonDemo;
      await d.loginAs('quanly_ha');
      await d.api.staff.content.products.create({ name: n, category: 'food' });
      await d.logout();
    }, name);
    await open(page, '/');
    const card = page.locator('#san-pham [data-product]').filter({ hasText: name.slice(0, 12) }).first();
    await card.scrollIntoViewIfNeeded();
    await card.getByRole('button', { name: /^Hỏi mua/ }).click();
    await expect(dialog(page).getByText(`Bạn hỏi về: ${name}`)).toBeVisible();
    await fill(page, 'Thu', '0912 345 680', 'hỏi mua');
    await dialog(page).getByRole('button', { name: 'Gửi lời nhắn' }).click();
    await expect(dialog(page).getByText('Đã gửi. Lê Sơn sẽ gọi lại cho bạn.')).toBeVisible();
  });

  test('has no accessibility violations and fits the phone @a11y @narrow', async ({ page }) => {
    await open(page, '/');
    await openAsk(page);
    await expect(dialog(page)).toHaveCSS('opacity', '1');
    await page.waitForTimeout(400);
    const results = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).analyze();
    expect(results.violations).toEqual([]);
    await fitsDevice(page);
  });
});

test.describe('ngoài giờ ở trang giới thiệu', () => {
  const contact = (page: Page) => page.locator('#lien-he [data-contact-cta]');
  const services = (page: Page) => page.locator('#dich-vu [data-services-cta]');

  test('closed: the end of the page and the services CTA both offer a message next to the call', async ({ page }) => {
    await open(page, '/lien-he');
    await setClock(page, '2026-10-26T21:30:00+07:00');
    await remountHome(page, '/lien-he');
    await expect(contact(page).getByRole('link', { name: /Gọi 097 355 51 05/ })).toBeVisible();
    await contact(page).getByRole('button', { name: 'Để lại lời nhắn' }).click();
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page).getByText(/^Bạn hỏi về/)).toHaveCount(0);
    await fill(page, 'Hoa', '0912 345 681', 'Nhờ gọi lại sáng mai.');
    await dialog(page).getByRole('button', { name: 'Gửi lời nhắn' }).click();
    await expect(dialog(page).getByText('Đã gửi. Lê Sơn sẽ gọi lại cho bạn.')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.evaluate(() => document.getElementById('dich-vu')!.scrollIntoView());
    await expect(services(page).getByText('Chưa chắc chọn dịch vụ nào? Lê Sơn sẽ tư vấn khi gọi lại.')).toBeVisible();
    await services(page).getByRole('button', { name: /lời nhắn/i }).click();
    await expect(dialog(page)).toBeVisible();
  });

  test('open: neither place offers a message button', async ({ page }) => {
    await open(page, '/lien-he');
    await setClock(page, '2026-10-26T14:00:00+07:00');
    await remountHome(page, '/lien-he');
    await expect(contact(page).getByRole('link', { name: 'Đặt lịch khám' })).toBeVisible();
    await expect(contact(page).getByRole('button', { name: 'Để lại lời nhắn' })).toHaveCount(0);
    await expect(services(page).getByRole('button', { name: /lời nhắn/i })).toHaveCount(0);
  });
});
