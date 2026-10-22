import { expect, test, type Page } from '@playwright/test';
import { open } from './helpers';
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

const setNow = (page: Page, iso: string) => page.evaluate((v) => (window as unknown as { __lesonDemo: { setNow(i: string | null): void } }).__lesonDemo.setNow(v), iso);
/** The clock is read when a section mounts: go to the booking page and come back so the homepage mounts again. */
async function remountHome(page: Page, route = '/dich-vu') {
  await page.evaluate(() => { location.hash = '/dat-lich'; });
  await page.locator('header').getByRole('link', { name: /Về trang chủ/ }).click();
  await page.evaluate((r) => { location.hash = r; }, route);
  await page.waitForTimeout(500);
}

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
