import { expect, test, type Page } from '@playwright/test';
import { open, openDuringHours, remountHome as remountHomeShared, setClock } from './helpers';
import { fitsDevice } from './width';

/** Part 6A: the intro page below the hero (spec 2026-10-22-phan-6). */
test.describe('khung trang', () => {
  test('the scroll thread is drawn along the page on wide screens and grows with the scroll @desktop-only', async ({ page }) => {
    await open(page, '/');
    const thread = page.locator('[data-thread]');
    await expect(thread).toBeAttached();
    const scale = () => thread.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).d);
    const before = await scale();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(400);
    expect(await scale()).toBeGreaterThan(before);
  });

  test('phones under 640 px do not draw it', async ({ page }) => {
    await open(page, '/');
    const w = page.viewportSize()!.width;
    const shown = await page.locator('[data-thread]').evaluate((el) => getComputedStyle(el).display !== 'none');
    expect(shown).toBe(w >= 640);
  });

  test('reduced motion: the thread is already full @motion-reduced', async ({ page }) => {
    await open(page, '/');
    const d = await page.locator('[data-thread]').evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).d);
    expect(d).toBe(1);
  });

  test('the menu follows the section: straight to /dich-vu and /lien-he', async ({ page }) => {
    for (const [route, name] of [['/dich-vu', 'Dịch vụ'], ['/lien-he', 'Liên hệ']] as const) {
      await open(page, route);
      await page.waitForTimeout(600);
      await expect(page.locator('nav[aria-label="Menu chính"]').first().getByRole('link', { name, includeHidden: true })).toHaveAttribute('aria-current', 'true');
    }
  });
});

test.describe('Giới thiệu', () => {
  test('heading, label, short text, the button to Dịch vụ, two labelled photos, sample tag, facts', async ({ page }) => {
    await open(page, '/gioi-thieu');
    const sec = page.locator('#gioi-thieu');
    await expect(sec.getByRole('heading', { name: 'An tâm gửi gắm', level: 2 })).toBeVisible();
    await expect(sec.locator('h2 em')).toHaveText('gửi gắm');
    await expect(sec.getByText('VỀ LÊ SƠN', { exact: true })).toBeVisible();
    await expect(sec.getByText('Nội dung mẫu')).toBeVisible();
    const photos = sec.getByRole('img');
    const shown = page.viewportSize()!.width >= 640 ? 2 : 1; // the side photo is left out on phones to keep the page short
    await expect(photos).toHaveCount(shown);
    const alts = await photos.evaluateAll((els) => els.map((e) => e.getAttribute('alt')));
    expect(new Set(alts).size).toBe(shown);
    await expect(sec.getByText('Ảnh minh họa').filter({ visible: true })).toHaveCount(shown);
    await expect(sec.getByText('Nhận cấp cứu 24/24')).toBeVisible();
    await expect(sec.getByRole('link', { name: /097 355 51 05/ })).toHaveAttribute('href', 'tel:+84973555105');
    await expect(sec.getByRole('link', { name: 'Chỉ đường' })).toBeVisible();
    await sec.getByRole('link', { name: /Tìm hiểu Lê Sơn/ }).click();
    await expect(page.locator('#dich-vu')).toBeInViewport();
  });

  test('phones: text first, then the button, then the photos; no sideways scroll @narrow', async ({ page }) => {
    test.skip(page.viewportSize()!.width >= 900, 'the two columns sit side by side on wide screens');
    await open(page, '/gioi-thieu');
    await page.waitForTimeout(600);
    const order = await page.locator('#gioi-thieu').evaluate((sec) => {
      const y = (el: Element | null) => (el ? el.getBoundingClientRect().top : Infinity);
      return { title: y(sec.querySelector('h2')), button: y([...sec.querySelectorAll('a')].find((a) => /Tìm hiểu/.test(a.textContent ?? '')) ?? null), photo: y(sec.querySelector('img')) };
    });
    expect(order.title).toBeLessThan(order.button);
    expect(order.button).toBeLessThan(order.photo);
    await fitsDevice(page);
  });

  test('reduced motion: the text block is simply in place @motion-reduced', async ({ page }) => {
    await open(page, '/gioi-thieu');
    await page.waitForTimeout(300);
    expect(await page.locator('#gioi-thieu h2').evaluate((el) => getComputedStyle(el.parentElement!).transform)).toBe('none');
    expect(await page.locator('#gioi-thieu [data-glow]').evaluate((el) => getComputedStyle(el).transform)).toBe('none');
  });
});

const setNow = setClock;
const remountHome = (page: Page, route = '/dich-vu') => remountHomeShared(page, route);

test.describe('Dịch vụ', () => {
  const rows = (page: Page) => page.locator('#dich-vu [data-service]');

  test('three numbered rows with a one-line description, each arrow books that service', async ({ page }) => {
    await open(page, '/dich-vu');
    await expect(rows(page)).toHaveCount(3);
    await expect(rows(page).locator('[data-service-no]')).toHaveText(['01', '02', '03']);
    await expect(rows(page).locator('[data-service-name]')).toHaveText(['Khám & điều trị', 'Nội trú', 'Spa & grooming']);
    for (const [i, key] of ['kham', 'noi_tru', 'spa'].entries()) {
      await expect(rows(page).nth(i).locator('[data-service-line]')).toBeVisible();
      await expect(rows(page).nth(i).getByRole('link')).toHaveAttribute('href', new RegExp(`/dat-lich\\?dich-vu=${key}$`));
    }
    await rows(page).nth(1).getByRole('link').click();
    await expect(page.locator('#form-dat-lich').getByRole('radio', { name: /Nội trú/ })).toHaveAttribute('aria-checked', 'true');
  });

  test('choosing a row shows its three items and changes the photo; keyboard focus alone does not leave the page', async ({ page }) => {
    await open(page, '/dich-vu');
    const stage = page.locator('#dich-vu [data-service-stage] img');
    const first = await stage.getAttribute('alt');
    const pick = rows(page).nth(1).getByRole('button');
    await pick.focus();
    await page.keyboard.press('Enter');
    await expect(pick).toHaveAttribute('aria-expanded', 'true');
    await expect(rows(page).nth(1).getByText('Theo dõi hằng ngày')).toBeVisible();
    await expect.poll(() => stage.getAttribute('alt')).not.toBe(first);
    await expect(page).toHaveURL(/#\/dich-vu$/);
    await expect(rows(page).nth(0).getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  test('Cấp cứu 24/24 stays its own strip: a call button and no booking link', async ({ page }) => {
    await open(page, '/dich-vu');
    const strip = page.getByRole('complementary', { name: 'Cấp cứu 24/24' });
    await expect(strip.getByRole('link', { name: 'Gọi ngay 097 355 51 05' })).toHaveAttribute('href', 'tel:+84973555105');
    await expect(strip.locator('a[href*="dat-lich"]')).toHaveCount(0);
  });

  test('the CTA below the strip books during opening hours and calls outside them', async ({ page }) => {
    await open(page, '/dich-vu');
    const cta = page.locator('#dich-vu [data-services-cta]');
    const after = await cta.evaluate((el) => !!(document.querySelector('#dich-vu aside')!.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING));
    expect(after).toBe(true);
    await expect(cta.getByText('Chưa chắc chọn dịch vụ nào? Lê Sơn sẽ tư vấn khi gọi lại.')).toBeVisible();
    for (const [iso, booking] of [['2026-10-26T14:00:00+07:00', true], ['2026-10-26T20:59:00+07:00', true], ['2026-10-26T21:00:00+07:00', false], ['2026-10-26T07:59:00+07:00', false]] as const) {
      await setNow(page, iso);
      await remountHome(page);
      if (booking) {
        await expect(cta.getByRole('link', { name: 'Đặt lịch khám' })).toHaveAttribute('href', /#?\/dat-lich$|\/dat-lich$/);
        await expect(cta.getByRole('link', { name: /Gọi 097 355 51 05/ })).toHaveCount(0);
      } else {
        await expect(cta.getByRole('link', { name: /Gọi 097 355 51 05/ })).toHaveAttribute('href', 'tel:+84973555105');
        await expect(cta.getByRole('link', { name: 'Đặt lịch khám' })).toHaveCount(0);
      }
    }
  });

  test('phones: tap a row to open it; the name and line stay visible; no sideways scroll @narrow', async ({ page }) => {
    test.skip(page.viewportSize()!.width >= 900, 'phone behaviour');
    await open(page, '/dich-vu');
    await page.waitForTimeout(600);
    await expect(rows(page).nth(0).locator('[data-service-line]')).toBeVisible();
    await rows(page).nth(2).getByRole('button').click();
    await expect(rows(page).nth(2).getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    await expect(rows(page).nth(2).locator('[data-service-name]')).toBeVisible();
    await fitsDevice(page);
  });
});

type Demo = { api: { staff: { content: { cases: { list(): Promise<{ id: string; version: number }[]>; setVisible(id: string, v: number, visible: boolean): Promise<void> } } } }; loginAs(u: string): Promise<unknown>; logout(): Promise<void> };
/** Hides the first `n` sample stories through the staff API (as the Quản lý), then signs out. */
async function hideStories(page: Page, n: number) {
  await page.evaluate(async (count) => {
    const d = (window as unknown as { __lesonDemo: Demo }).__lesonDemo;
    await d.loginAs('quanly_ha');
    const rows = await d.api.staff.content.cases.list();
    for (const r of rows.slice(0, count)) await d.api.staff.content.cases.setVisible(r.id, r.version, false);
    await d.logout();
  }, n);
}

test.describe('Đội ngũ', () => {
  test('the head doctor with a real photo, three empty slots kept as sample, no invented names', async ({ page }) => {
    await open(page, '/');
    const team = page.locator('#doi-ngu');
    await expect(team.getByText('ĐỘI NGŨ', { exact: true })).toBeVisible();
    await expect(team.getByText('Bác sĩ trưởng', { exact: true })).toBeVisible();
    await expect(team.getByText('Lê Thái Sơn', { exact: true })).toBeVisible();
    await expect(team.getByText('Đồng hành cùng thú cưng mỗi ngày.')).toBeVisible();
    await expect(team.getByRole('img', { name: 'Bác sĩ trưởng Lê Thái Sơn' })).toBeVisible();
    await expect(team.getByText('Ảnh minh họa')).toHaveCount(0);
    await expect(team.locator('[data-team-slot]')).toHaveCount(3);
    await expect(team.getByText('Nội dung mẫu')).toBeVisible();
  });
});

test.describe('Câu chuyện điều trị', () => {
  const stories = (page: Page) => page.locator('#cau-chuyen [data-story]');

  test('one lead and one beside it, each with an excerpt and a reading button; sample tags', async ({ page }) => {
    await open(page, '/');
    const sec = page.locator('#cau-chuyen');
    await expect(sec.getByText('CÂU CHUYỆN ĐIỀU TRỊ', { exact: true })).toBeVisible();
    await expect(sec.getByRole('heading', { name: 'Mỗi hành trình, một sự đồng hành.', level: 2 })).toBeVisible();
    await expect(stories(page)).toHaveCount(2);
    await expect(stories(page).first()).toHaveAttribute('data-story', 'lead');
    for (let i = 0; i < 2; i++) {
      await expect(stories(page).nth(i).getByRole('heading', { level: 3 })).toBeVisible();
      await expect(stories(page).nth(i).getByRole('button', { name: /Đọc câu chuyện/ })).toBeVisible();
      await expect(stories(page).nth(i).getByText('Nội dung mẫu')).toBeVisible();
    }
    const [lead, side] = await Promise.all([stories(page).nth(0).boundingBox(), stories(page).nth(1).boundingBox()]);
    if (page.viewportSize()!.width >= 900) expect(lead!.width).toBeGreaterThan(side!.width);
    await expect(sec.locator('[class*="carousel"], [data-carousel]')).toHaveCount(0);
  });

  test('reading opens the whole story in a dialog; Esc closes it and focus returns to the button', async ({ page }) => {
    await open(page, '/');
    const btn = stories(page).nth(0).getByRole('button', { name: /Đọc câu chuyện/ });
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    const dlg = page.getByRole('dialog');
    await expect(dlg).toBeVisible();
    await expect(dlg.getByRole('heading', { level: 2 })).toContainText('Bé Mướp');
    await expect(dlg).toContainText('Gia đình đồng ý chia sẻ câu chuyện này.');
    await expect(dlg).toContainText('Mướp');
    for (const banned of ['mg', 'liều', 'tiêm', 'thuốc']) expect((await dlg.innerText()).toLowerCase()).not.toContain(banned);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await page.keyboard.press('Escape');
    await expect(dlg).toHaveCount(0);
    await expect(btn).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  });

  test('one shown story leads alone; none hides the whole section', async ({ page }) => {
    await open(page, '/');
    await hideStories(page, 1);
    await open(page, '/');
    await expect(stories(page)).toHaveCount(1);
    await expect(stories(page).first()).toHaveAttribute('data-story', 'lead');
    await hideStories(page, 2);
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toHaveCount(0);
    const ids = await page.evaluate(() => [...document.querySelectorAll('#noi-dung section[id]')].map((s) => s.id));
    expect(ids).not.toContain('cau-chuyen');
  });

  test('a story without a picture shows the labelled placeholder, never an empty box', async ({ page }) => {
    await open(page, '/');
    const lead = stories(page).first();
    await expect(lead.getByText('Ảnh minh họa')).toBeVisible();
  });

  test('phones: one column and no sideways scroll @narrow', async ({ page }) => {
    await open(page, '/');
    await stories(page).first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    if (page.viewportSize()!.width < 640) {
      const [a, b] = await Promise.all([stories(page).nth(0).boundingBox(), stories(page).nth(1).boundingBox()]);
      expect(b!.y).toBeGreaterThan(a!.y + a!.height - 2);
    }
    await fitsDevice(page);
  });
});

type ProductDemo = { api: { staff: { content: { products: { list(): Promise<{ id: string; version: number; category: string }[]>; setVisible(id: string, v: number, visible: boolean): Promise<void> } } } }; loginAs(u: string): Promise<unknown>; logout(): Promise<void> };
/** Hides the sample products of the given groups through the staff API (as the Quản lý), then signs out. */
async function hideProducts(page: Page, groups: string[]) {
  await page.evaluate(async (g) => {
    const d = (window as unknown as { __lesonDemo: ProductDemo }).__lesonDemo;
    await d.loginAs('quanly_ha');
    const rows = await d.api.staff.content.products.list();
    for (const r of rows.filter((x) => g.includes(x.category))) await d.api.staff.content.products.setVisible(r.id, r.version, false);
    await d.logout();
  }, groups);
}

test.describe('Không gian', () => {
  test('one main photo and two beside it, each labelled and captioned', async ({ page }) => {
    await open(page, '/');
    const sec = page.locator('#khong-gian');
    await expect(sec.getByText('KHÔNG GIAN', { exact: true })).toBeVisible();
    await expect(sec.getByRole('img')).toHaveCount(3);
    const alts = await sec.getByRole('img').evaluateAll((els) => els.map((e) => e.getAttribute('alt') ?? ''));
    expect(alts.every((a) => a.length > 8) && new Set(alts).size === 3).toBe(true);
    await expect(sec.locator('figcaption')).toHaveCount(3);
    await expect(sec.getByText('Ảnh minh họa')).toHaveCount(3);
  });
});

test.describe('Sản phẩm nổi bật', () => {
  const cards = (page: Page) => page.locator('#san-pham [data-product]');

  test('three cards (the hidden one stays out): name, group, sample tag; no price, no best-seller word, no cart', async ({ page }) => {
    await open(page, '/');
    const sec = page.locator('#san-pham');
    await expect(sec.getByText('SẢN PHẨM NỔI BẬT', { exact: true })).toBeVisible();
    await expect(cards(page)).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(cards(page).nth(i).getByRole('heading', { level: 3 })).toBeVisible();
      await expect(cards(page).nth(i).getByText('Nội dung mẫu')).toBeVisible();
    }
    const text = (await sec.innerText()).toLowerCase();
    expect(text).not.toMatch(/\bgiá\b/);
    expect(text).not.toContain('bán chạy');
    expect(text).not.toContain('₫');
    await expect(sec.getByRole('button', { name: /giỏ hàng|thêm vào giỏ|mua ngay/i })).toHaveCount(0);
    await expect(sec.locator('[data-carousel]')).toHaveCount(0);
  });

  test('group buttons appear with two or more groups and filter the cards', async ({ page }) => {
    await open(page, '/');
    const group = page.locator('#san-pham').getByRole('group', { name: 'Lọc theo nhóm' });
    await expect(group.getByRole('button', { name: 'Tất cả' })).toHaveAttribute('aria-pressed', 'true');
    await group.getByRole('button', { name: 'Cát vệ sinh' }).click();
    await expect(cards(page)).toHaveCount(1);
    await expect(group.getByRole('button', { name: 'Cát vệ sinh' })).toHaveAttribute('aria-pressed', 'true');
    await group.getByRole('button', { name: 'Tất cả' }).click();
    await expect(cards(page)).toHaveCount(3);
  });

  test('"Hỏi mua" calls the hospital for now and names the product', async ({ page }) => {
    await open(page, '/');
    const link = cards(page).first().getByRole('link', { name: /^Hỏi mua/ });
    await expect(link).toHaveAttribute('href', 'tel:+84973555105');
    const name = await cards(page).first().getByRole('heading', { level: 3 }).innerText();
    await expect(link).toHaveAttribute('aria-label', `Hỏi mua: ${name}`);
  });

  test('one group means no group buttons; nothing shown hides the whole section', async ({ page }) => {
    await open(page, '/');
    await hideProducts(page, ['litter']); // the two food items stay
    await open(page, '/');
    await expect(cards(page)).toHaveCount(2);
    await expect(page.locator('#san-pham').getByRole('group', { name: 'Lọc theo nhóm' })).toHaveCount(0);
    await hideProducts(page, ['food']);
    await open(page, '/');
    await expect(page.locator('#san-pham')).toHaveCount(0);
  });

  test('phones: two columns, one column at 320, no sideways scroll @narrow', async ({ page }) => {
    await open(page, '/');
    await cards(page).first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const w = page.viewportSize()!.width;
    if (w < 640) {
      const [a, b] = await Promise.all([cards(page).nth(0).boundingBox(), cards(page).nth(1).boundingBox()]);
      if (w <= 340) expect(b!.y).toBeGreaterThan(a!.y);
      else expect(Math.abs(b!.y - a!.y)).toBeLessThan(4);
    }
    await fitsDevice(page);
  });
});

test.describe('Quy trình', () => {
  test('four steps in order, labelled as sample; they stack on phones @narrow', async ({ page }) => {
    await open(page, '/');
    const sec = page.locator('#quy-trinh');
    await expect(sec.getByText('QUY TRÌNH', { exact: true })).toBeVisible();
    await expect(sec.locator('[data-step] [data-step-title]')).toHaveText(['Gửi yêu cầu', 'Lê Sơn liên hệ xác nhận', 'Đến khám', 'Hướng dẫn chăm sóc']);
    await expect(sec.getByText('Nội dung mẫu')).toBeVisible();
    await sec.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    if (page.viewportSize()!.width < 640) {
      const [a, b] = await Promise.all([sec.locator('[data-step]').nth(0).boundingBox(), sec.locator('[data-step]').nth(1).boundingBox()]);
      expect(b!.y).toBeGreaterThan(a!.y);
    }
    await fitsDevice(page);
  });

  test('the line between the steps is drawn as the page is scrolled @desktop-only', async ({ page }) => {
    await open(page, '/');
    const line = page.locator('#quy-trinh [data-process-line]');
    const a = () => line.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a);
    await page.evaluate(() => document.querySelector('#quy-trinh')!.scrollIntoView({ block: 'start' }));
    await page.evaluate(() => window.scrollBy(0, -Math.round(window.innerHeight * 0.5)));
    await page.waitForTimeout(300);
    const early = await a();
    // Keep nudging down until the line has grown: layout (lazy photos) may still be settling when this starts.
    await expect.poll(async () => { await page.evaluate(() => window.scrollBy(0, 60)); return a(); }, { timeout: 8000 }).toBeGreaterThan(early);
  });

  test('reduced motion: the line is already full @motion-reduced', async ({ page }) => {
    await open(page, '/');
    const m = await page.locator('#quy-trinh [data-process-line]').evaluate((el) => { const t = new DOMMatrixReadOnly(getComputedStyle(el).transform); return [t.a, t.d]; });
    expect(m).toEqual([1, 1]);
  });
});

test.describe('Hỏi đáp', () => {
  const qs = (page: Page) => page.locator('#hoi-dap [data-faq] > h3 > button');

  test('three questions, closed at first, sample tag', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#hoi-dap').getByText('HỎI ĐÁP', { exact: true })).toBeVisible();
    await expect(qs(page)).toHaveCount(3);
    for (let i = 0; i < 3; i++) await expect(qs(page).nth(i)).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#hoi-dap').getByText('Nội dung mẫu')).toBeVisible();
  });

  test('Enter and Space open and close; the panel is the button\'s controlled region; two can be open', async ({ page }) => {
    await open(page, '/');
    const q = qs(page).nth(0);
    await q.scrollIntoViewIfNeeded();
    const panelId = await q.getAttribute('aria-controls');
    const panel = page.locator(`#${panelId}`);
    await expect(panel).toBeHidden();
    await q.focus();
    await page.keyboard.press('Enter');
    await expect(q).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('Lê Sơn');
    await page.keyboard.press('Space');
    await expect(q).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();
    await q.click();
    await qs(page).nth(1).click();
    await expect(q).toHaveAttribute('aria-expanded', 'true');
    await expect(qs(page).nth(1)).toHaveAttribute('aria-expanded', 'true');
  });

  test('answers carry no treatment advice', async ({ page }) => {
    await open(page, '/');
    for (let i = 0; i < 3; i++) await qs(page).nth(i).click();
    const text = (await page.locator('#hoi-dap').innerText()).toLowerCase();
    for (const banned of ['liều', 'thuốc', 'kháng sinh']) expect(text).not.toContain(banned);
  });
});

type HolidayDemo = { api: { staff: { settings: { get(): Promise<{ version: number }>; update(v: number, p: { holidays: { date: string }[] }): Promise<unknown> } } }; loginAs(u: string): Promise<unknown>; logout(): Promise<void> };
async function addHoliday(page: Page, date: string) {
  await page.evaluate(async (d) => {
    const demo = (window as unknown as { __lesonDemo: HolidayDemo }).__lesonDemo;
    await demo.loginAs('quanly_ha');
    const s = await demo.api.staff.settings.get();
    await demo.api.staff.settings.update(s.version, { holidays: [{ date: d }] });
    await demo.logout();
  }, date);
}

test.describe('Đặt lịch và liên hệ', () => {
  const sec = (page: Page) => page.locator('#lien-he');
  const cta = (page: Page) => page.locator('#lien-he [data-contact-cta]');

  test('address, hotline, opening hours apart from Cấp cứu 24/24, directions, Facebook', async ({ page }) => {
    await open(page, '/lien-he');
    await expect(sec(page).getByText('LIÊN HỆ', { exact: true })).toBeVisible();
    await expect(sec(page).getByText('101 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội')).toBeVisible();
    await expect(sec(page).getByRole('link', { name: /Gọi ngay/ }).first()).toHaveAttribute('href', 'tel:+84973555105');
    const hours = sec(page).locator('li', { hasText: '08:00–21:00' }).first();
    await expect(hours).toBeVisible();
    expect(await hours.textContent()).not.toContain('24/24');
    const emergency = sec(page).locator('li', { hasText: '24/24' }).first();
    expect((await emergency.textContent())!.toLowerCase()).toContain('cấp cứu');
    expect(await emergency.textContent()).not.toContain('08:00');
    await expect(sec(page).getByRole('link', { name: 'Chỉ đường' }).first()).toBeVisible();
    const fb = sec(page).getByRole('link', { name: 'Mở trang Facebook' });
    await expect(fb).toHaveAttribute('href', 'https://www.facebook.com/benhvienthuyleson');
    await expect(fb).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('two entries with different names: "Đặt lịch khám" books, "Đăng nhập theo dõi bé" signs in', async ({ page }) => {
    await openDuringHours(page, '/lien-he');
    await expect(cta(page).getByRole('link', { name: 'Đặt lịch khám' })).toHaveAttribute('href', /\/dat-lich$/);
    await expect(cta(page).getByRole('link', { name: 'Đăng nhập theo dõi bé' })).toHaveAttribute('href', /\/dang-nhap$/);
  });

  test('a signed-in customer sees the way into the account instead', async ({ page }) => {
    await openDuringHours(page, '/lien-he', { as: 'lan_nguyen' });
    await expect(cta(page).getByRole('link', { name: 'Vào tài khoản của bạn' })).toHaveAttribute('href', /\/khach-hang$/);
    await expect(cta(page).getByRole('link', { name: 'Đăng nhập theo dõi bé' })).toHaveCount(0);
  });

  test('outside opening hours the main button calls', async ({ page }) => {
    await open(page, '/lien-he');
    await setNow(page, '2026-10-26T21:30:00+07:00');
    await remountHome(page, '/lien-he');
    await expect(cta(page).getByRole('link', { name: /Gọi 097 355 51 05/ })).toHaveAttribute('href', 'tel:+84973555105');
    await expect(cta(page).getByRole('link', { name: 'Đặt lịch khám' })).toHaveCount(0);
  });

  test('on a holiday the note shows while open (14:00) and the button calls after 19:00', async ({ page }) => {
    await open(page, '/lien-he');
    await addHoliday(page, '2026-10-26');
    await setNow(page, '2026-10-26T14:00:00+07:00');
    await remountHome(page, '/lien-he');
    await expect(cta(page).getByText('Hôm nay Lê Sơn làm đến 19:00.')).toBeVisible();
    await expect(cta(page).getByRole('link', { name: 'Đặt lịch khám' })).toBeVisible();
    await setNow(page, '2026-10-26T19:30:00+07:00');
    await remountHome(page, '/lien-he');
    await expect(cta(page).getByText('Hôm nay Lê Sơn làm đến 19:00.')).toHaveCount(0);
    await expect(cta(page).getByRole('link', { name: /Gọi 097 355 51 05/ })).toBeVisible();
  });

  test('the old booking band and account teaser are gone; the page ends with this section', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#hen-gap, #tai-khoan-khach-hang, [data-book-cta]')).toHaveCount(0);
    const ids = await page.evaluate(() => [...document.querySelectorAll('#noi-dung section[id]')].map((s) => s.id));
    expect(ids).toEqual(['hero-main', 'gioi-thieu', 'dich-vu', 'doi-ngu', 'cau-chuyen', 'khong-gian', 'san-pham', 'quy-trinh', 'hoi-dap', 'lien-he']);
  });

  test('phones: it fits the device width @narrow', async ({ page }) => {
    await open(page, '/lien-he');
    await page.waitForTimeout(800);
    await fitsDevice(page);
  });
});
