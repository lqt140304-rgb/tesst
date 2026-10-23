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
      settings: { get(): Promise<{ version: number }>; update(v: number, p: { holidays: { date: string }[] }): Promise<unknown> };
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

  test('the confirmation is announced from a region that was already there, and focus stays inside the dialog on "Đóng"', async ({ page }) => {
    await open(page, '/');
    await openAsk(page);
    await expect(dialog(page).getByRole('status')).toHaveCount(1);
    await expect(dialog(page).getByRole('status')).toHaveText('');
    await fill(page, 'Lan', '0912 345 690', 'Hỏi thử.');
    await dialog(page).getByLabel('Lời nhắn').press('Enter'); // from a box: the form is replaced under the focus
    await dialog(page).getByRole('button', { name: 'Gửi lời nhắn' }).click();
    await expect(dialog(page).getByRole('status')).toContainText('Đã gửi. Lê Sơn sẽ gọi lại cho bạn.');
    expect(await page.evaluate(() => { const a = document.activeElement; return !!a?.closest('[role="dialog"]') && a.textContent === 'Đóng'; })).toBe(true);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  });

  test('two submits in one instant call the data layer once', async ({ page }) => {
    await open(page, '/');
    await openAsk(page);
    await fill(page, 'Lan', '0912 345 691', 'Hỏi một lần.');
    const calls = await page.evaluate(async () => {
      const d = (window as unknown as { __lesonDemo: Demo & { api: { public: { inquiries: { submit: (i: unknown) => Promise<unknown> } } } } }).__lesonDemo;
      const real = d.api.public.inquiries.submit.bind(d.api.public.inquiries);
      let n = 0;
      d.api.public.inquiries.submit = (i: unknown) => { n += 1; return real(i as never); };
      const f = document.querySelector<HTMLFormElement>('[role="dialog"] form')!;
      f.requestSubmit(); f.requestSubmit();
      await new Promise((r) => setTimeout(r, 600));
      return n;
    });
    expect(calls).toBe(1);
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

const OUT_MSG = 'Ngoài giờ làm việc (08:00–21:00), bạn cần gọi hotline 097 355 51 05 trước nhé.';
const form = (page: Page) => page.locator('#form-dat-lich');
const slot = (page: Page) => form(page).getByLabel(/Khung giờ/);
async function addHoliday(page: Page, date: string) {
  await page.evaluate(async (d) => {
    const demo = (window as unknown as { __lesonDemo: Demo }).__lesonDemo;
    await demo.loginAs('quanly_ha');
    const st = await demo.api.staff.settings.get();
    await demo.api.staff.settings.update(st.version, { holidays: [{ date: d }] });
    await demo.logout();
  }, date);
}

test.describe('trang đặt lịch: giờ khác và ngày lễ', () => {
  test('"Giờ khác" is the last choice; picking it says so at once and turns Gửi into a call and a message, keeping what was typed', async ({ page }) => {
    await open(page, '/dat-lich');
    await expect(slot(page)).toBeVisible();
    await expect(slot(page).locator('option').last()).toHaveText('Giờ khác (ngoài giờ làm việc)');
    await form(page).getByLabel('Họ và tên').fill('Trịnh Ngoài Giờ');
    await form(page).getByLabel('Tên bé').fill('Bé Đêm');
    await slot(page).selectOption({ label: 'Giờ khác (ngoài giờ làm việc)' });
    await expect(form(page).getByText(OUT_MSG)).toBeVisible();
    await expect(form(page).getByRole('button', { name: 'Gửi yêu cầu' })).toHaveCount(0);
    await expect(form(page).getByRole('link', { name: /Gọi 097 355 51 05/ })).toHaveAttribute('href', 'tel:+84973555105');
    await form(page).getByRole('button', { name: 'Để lại lời nhắn' }).click();
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(form(page).getByLabel('Họ và tên')).toHaveValue('Trịnh Ngoài Giờ');
    await expect(form(page).getByLabel('Tên bé')).toHaveValue('Bé Đêm');
  });

  test('changing the day or the service keeps the call state until the slot is changed; choosing a real slot brings Gửi back and it sends', async ({ page }) => {
    await open(page, '/dat-lich');
    const f = form(page);
    await f.getByLabel('Họ và tên').fill('Trịnh Đổi Giờ');
    await f.getByLabel('Số điện thoại').fill('0987 333 444');
    await f.getByLabel('Tên bé').fill('Đổi Giờ');
    await f.getByRole('radio', { name: 'Mèo' }).click();
    await f.getByRole('radio', { name: /Khám và điều trị/ }).click();
    await f.getByLabel('Ngày bạn mong muốn').fill('2030-03-12');
    await slot(page).selectOption({ label: 'Giờ khác (ngoài giờ làm việc)' });
    await f.getByLabel('Ngày bạn mong muốn').fill('2030-03-14');
    await f.getByRole('radio', { name: /Spa/ }).click();
    await expect(f.getByRole('link', { name: /Gọi 097 355 51 05/ })).toBeVisible();
    await expect(f.getByRole('button', { name: 'Gửi yêu cầu' })).toHaveCount(0);
    await slot(page).selectOption({ label: '10:00–12:00' });
    await expect(f.getByText(OUT_MSG)).toHaveCount(0);
    await f.getByRole('checkbox').check();
    await f.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(page.getByRole('heading', { name: 'Lê Sơn đã nhận yêu cầu của bạn' })).toBeVisible();
  });

  test('a holiday offers only the slots that end by 19:00, says so, and drops a later chosen slot; an ordinary day is whole again', async ({ page }) => {
    await open(page, '/dat-lich');
    await addHoliday(page, '2030-03-12');
    await open(page, '/dat-lich');
    const f = form(page);
    await f.getByLabel('Ngày bạn mong muốn').fill('2030-03-13');
    await expect(f.getByText('Ngày này Lê Sơn làm đến 19:00.', { exact: true })).toHaveCount(0);
    await slot(page).selectOption({ label: '18:00–20:00' });
    await f.getByLabel('Ngày bạn mong muốn').fill('2030-03-12');
    await expect(f.getByText('Ngày này Lê Sơn làm đến 19:00.', { exact: true })).toBeVisible();
    await expect(slot(page).locator('option', { hasText: '16:00–18:00' })).toHaveCount(1);
    const held = await slot(page).locator('option').allTextContents();
    expect(held).not.toContain('18:00–20:00');
    expect(held).not.toContain('20:00–21:00');
    expect(held).toContain('16:00–18:00');
    await expect(slot(page)).toHaveValue('');
    await expect(f.getByText('Khung giờ đã được bỏ chọn vì ngày này Lê Sơn làm đến 19:00.')).toBeVisible();
    await f.getByLabel('Ngày bạn mong muốn').fill('2030-03-13');
    expect(await slot(page).locator('option').allTextContents()).toContain('18:00–20:00');
    await expect(f.getByText('Ngày này Lê Sơn làm đến 19:00.', { exact: true })).toHaveCount(0);
  });

  test('after a failed try, choosing "Giờ khác" does not leave "Khung giờ" in the red summary', async ({ page }) => {
    await open(page, '/dat-lich');
    await form(page).getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(form(page).getByRole('alert').first()).toBeVisible();
    await slot(page).selectOption({ label: 'Giờ khác (ngoài giờ làm việc)' });
    for (const alert of await form(page).getByRole('alert').all()) expect(await alert.innerText()).not.toContain('Khung giờ');
  });

  test('the dropped-slot sentence shows only on the visit where a slot was dropped', async ({ page }) => {
    await open(page, '/dat-lich');
    await addHoliday(page, '2030-03-12');
    await open(page, '/dat-lich');
    const f = form(page);
    const dropped = f.getByText('Khung giờ đã được bỏ chọn vì ngày này Lê Sơn làm đến 19:00.');
    await f.getByLabel('Ngày bạn mong muốn').fill('2030-03-13');
    await slot(page).selectOption({ label: '18:00–20:00' });
    await f.getByLabel('Ngày bạn mong muốn').fill('2030-03-12');
    await expect(dropped).toBeVisible();
    await f.getByLabel('Ngày bạn mong muốn').fill('2030-03-13');
    await f.getByLabel('Ngày bạn mong muốn').fill('2030-03-12');
    await expect(f.getByText('Ngày này Lê Sơn làm đến 19:00.', { exact: true })).toBeVisible();
    await expect(dropped).toHaveCount(0);
  });

  test('a signed-in customer gets the same choice and the same swap', async ({ page }) => {
    await open(page, '/khach-hang/dat-lich', { as: 'lan_nguyen' });
    await slot(page).selectOption({ label: 'Giờ khác (ngoài giờ làm việc)' });
    await expect(form(page).getByText(OUT_MSG)).toBeVisible();
    await expect(form(page).getByRole('link', { name: /Gọi 097 355 51 05/ })).toBeVisible();
    await expect(form(page).getByRole('button', { name: 'Gửi yêu cầu' })).toHaveCount(0);
  });

  test('has no accessibility violations in the call state and fits the phone @a11y @narrow', async ({ page }) => {
    await open(page, '/dat-lich');
    await slot(page).selectOption({ label: 'Giờ khác (ngoài giờ làm việc)' });
    await page.waitForTimeout(300);
    const results = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).analyze();
    expect(results.violations).toEqual([]);
    await fitsDevice(page);
  });
});

type StaffDemo = {
  api: { public: { inquiries: { submit(i: { name: string; phone: string; text: string; about?: string }): Promise<unknown> } } };
  failNextWrite(): void;
};
const nv = (page: Page) => page.locator('[data-zone="staff"] main');
const queue = (page: Page) => nv(page).locator('[data-inquiry-queue]');
const qrow = (page: Page, name: string) => queue(page).locator('[data-inquiry-row]').filter({ hasText: name });

test.describe('lời nhắn cho nhân viên', () => {
  test('the Quản lý sees the waiting messages: phone to call, the product asked about, overdue marked; called ones on request', async ({ page }) => {
    await open(page, '/nv/yeu-cau', { as: 'quanly_ha' });
    await expect(queue(page).getByRole('heading', { name: 'Lời nhắn của khách (2)' })).toBeVisible();
    await expect(qrow(page, 'Chị Hạnh (mẫu)').getByRole('link', { name: '090 123 45 01' })).toHaveAttribute('href', 'tel:+84901234501');
    await expect(qrow(page, 'Chị Hạnh (mẫu)')).toContainText('Hỏi mua: Thức ăn hạt cho chó trưởng thành (mẫu)');
    await expect(qrow(page, 'Anh Quân (mẫu)').getByText('Quá hạn')).toBeVisible();
    await expect(qrow(page, 'Chị Hạnh (mẫu)').getByText('Quá hạn')).toHaveCount(0);
    await expect(qrow(page, 'Chị Thảo (mẫu)')).toHaveCount(0);
    await queue(page).getByRole('radio', { name: 'Đã gọi lại' }).click();
    await expect(qrow(page, 'Chị Thảo (mẫu)')).toContainText('Nguyễn Thu Hà');
    await expect(qrow(page, 'Chị Hạnh (mẫu)')).toHaveCount(0);
  });

  test('only whoever holds the right to handle requests sees the block: the Quản lý yes; a doctor and the Spa not even in the page', async ({ page }) => {
    await open(page, '/nv/yeu-cau', { as: 'quanly_ha' });
    await expect(queue(page)).toBeVisible();
    for (const who of ['bacsi_mai', 'spa_ngocanh']) {
      await open(page, '/nv/tong-quan', { as: who });
      await open(page, '/nv/lich-hen', { as: who }); // a screen they can open, so the page has settled before the check
      await expect(nv(page).getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('[data-inquiry-queue]')).toHaveCount(0);
    }
  });

  test('"Đã gọi lại" moves the row on with a toast; when the last waiting one is done the block goes away', async ({ page }) => {
    await open(page, '/nv/yeu-cau', { as: 'quanly_ha' });
    await qrow(page, 'Chị Hạnh (mẫu)').getByRole('button', { name: 'Đã gọi lại cho Chị Hạnh (mẫu)' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã ghi nhận đã gọi lại.' })).toBeVisible();
    await expect(qrow(page, 'Chị Hạnh (mẫu)')).toHaveCount(0);
    await expect(queue(page).getByRole('heading', { name: 'Lời nhắn của khách (1)' })).toBeVisible();
    await qrow(page, 'Anh Quân (mẫu)').getByRole('button', { name: /^Đã gọi lại cho/ }).click();
    await expect(queue(page)).toHaveCount(0);
  });

  test('two clicks in one instant on "Đã gọi lại" give one green toast and no red one', async ({ page }) => {
    await open(page, '/nv/yeu-cau', { as: 'quanly_ha' });
    await qrow(page, 'Chị Hạnh (mẫu)').getByRole('button', { name: /^Đã gọi lại cho/ }).evaluate((b) => { (b as HTMLButtonElement).click(); (b as HTMLButtonElement).click(); });
    await expect(page.getByRole('status').filter({ hasText: 'Đã ghi nhận đã gọi lại.' })).toHaveCount(1);
    await page.waitForTimeout(600);
    await expect(page.getByRole('status').filter({ hasText: /Chưa lưu được|vừa được người khác cập nhật/ })).toHaveCount(0);
  });

  test('a failed save says so and keeps the row; the other tab is brought up to date by the first', async ({ page, context }) => {
    await open(page, '/nv/yeu-cau', { as: 'quanly_ha' });
    await page.evaluate(() => (window as unknown as { __lesonDemo: StaffDemo }).__lesonDemo.failNextWrite());
    await qrow(page, 'Chị Hạnh (mẫu)').getByRole('button', { name: /^Đã gọi lại cho/ }).click();
    await expect(page.getByRole('status').filter({ hasText: /Chưa lưu được|vừa được người khác cập nhật/ })).toBeVisible();
    await expect(qrow(page, 'Chị Hạnh (mẫu)')).toHaveCount(1);
    const other = await context.newPage();
    await open(other, '/nv/yeu-cau', { as: 'quanly_ha' });
    await qrow(other, 'Chị Hạnh (mẫu)').getByRole('button', { name: /^Đã gọi lại cho/ }).click();
    await expect(qrow(other, 'Chị Hạnh (mẫu)')).toHaveCount(0);
    await expect(qrow(page, 'Chị Hạnh (mẫu)')).toHaveCount(0, { timeout: 8000 });
  });

  test('a message left on the page reaches the queue with its product; the block is not shown beside a request detail', async ({ page }) => {
    await open(page, '/');
    await openAsk(page);
    await fill(page, 'Khách Mới', '0912 777 888', 'Còn hàng không ạ?');
    await dialog(page).getByRole('button', { name: 'Gửi lời nhắn' }).click();
    await expect(dialog(page).getByText('Đã gửi. Lê Sơn sẽ gọi lại cho bạn.')).toBeVisible();
    await open(page, '/nv/yeu-cau', { as: 'quanly_ha' });
    await expect(qrow(page, 'Khách Mới')).toContainText('Còn hàng không ạ?');
    await expect(qrow(page, 'Khách Mới')).toContainText('Hỏi mua:');
    await nv(page).locator('[data-request-card]').first().click();
    await expect(queue(page)).toHaveCount(0);
  });

  test('very long unbroken name and text stay inside the frame; axe is clean; fits the phone @a11y @narrow', async ({ page }) => {
    await open(page, '/');
    await page.evaluate(async () => {
      (await (window as unknown as { __lesonDemo: StaffDemo }).__lesonDemo.api.public.inquiries.submit({ name: 'N'.repeat(60), phone: '0912 555 666', text: 'T'.repeat(400) }));
    });
    await open(page, '/nv/yeu-cau', { as: 'quanly_ha' });
    await expect(qrow(page, 'NNNNNNNNNN')).toBeVisible();
    await page.waitForTimeout(400);
    const results = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).analyze();
    expect(results.violations).toEqual([]);
    await fitsDevice(page);
  });
});
