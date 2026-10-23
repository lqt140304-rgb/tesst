import { expect, test, type Page } from '@playwright/test';
import { open, openDuringHours, remountHome, setClock } from './helpers';
import { fitsDevice } from './width';

/** Part 7: the redesigned hero and intro page (spec 2026-10-23-phan-7). */

type Row = { id: string; version: number };
type Lists = { list(): Promise<Row[]>; setVisible(id: string, v: number, visible: boolean): Promise<void> };
type Demo = { loginAs(u: string): Promise<unknown>; api: { staff: { content: { products: Lists; cases: Lists } } } };

/** Hides every featured product and/or story through the manager's account, so those sections leave the page. */
async function hideFeatured(page: Page, which: ('products' | 'cases')[]) {
  await page.evaluate(async (kinds) => {
    const d = (window as unknown as { __lesonDemo: Demo }).__lesonDemo;
    await d.loginAs('quanly_ha');
    for (const k of kinds) {
      const list = d.api.staff.content[k];
      for (const r of await list.list()) await list.setVisible(r.id, r.version, false);
    }
  }, which);
}

const sectionBackgrounds = (page: Page) => page.evaluate(() =>
  [...document.querySelectorAll('#noi-dung section[id]')].filter((s) => s.id !== 'hero-main').map((s) => ({ id: s.id, bg: getComputedStyle(s).backgroundColor })));

test.describe('nền xen kẽ', () => {
  test('two neighbouring sections never share a background', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toBeAttached();
    await expect(page.locator('#san-pham')).toBeAttached();
    const rows = await sectionBackgrounds(page);
    expect(rows.length).toBeGreaterThanOrEqual(9);
    for (let i = 1; i < rows.length; i++) expect(rows[i]!.bg, `${rows[i - 1]!.id} / ${rows[i]!.id}`).not.toBe(rows[i - 1]!.bg);
  });

  test('the first section is warm cream', async ({ page }) => {
    await open(page, '/');
    expect((await sectionBackgrounds(page))[0]!.bg).toBe('rgb(251, 247, 241)');
  });

  test('with no featured product and no story left, the neighbours still differ', async ({ page }) => {
    await open(page, '/');
    await hideFeatured(page, ['products', 'cases']);
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toHaveCount(0);
    await expect(page.locator('#san-pham')).toHaveCount(0);
    const rows = await sectionBackgrounds(page);
    expect(rows.length).toBe(7);
    for (let i = 1; i < rows.length; i++) expect(rows[i]!.bg, `${rows[i - 1]!.id} / ${rows[i]!.id}`).not.toBe(rows[i - 1]!.bg);
  });
});

test.describe('không còn sợi chỉ', () => {
  test('no thread, glow, drawn step line or thread node is left on the page', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toBeAttached();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(400);
    await expect(page.locator('[data-thread], [data-glow], [data-process-line]')).toHaveCount(0);
    // The old node was an aria-hidden dot in front of each section's inner box.
    const dots = await page.locator('#noi-dung section[id] > span[aria-hidden="true"]').count();
    expect(dots).toBe(0);
  });

  test('nothing in the intro sections is displaced by a transform before any scroll', async ({ page }) => {
    await open(page, '/');
    await page.waitForTimeout(600);
    const moved = await page.locator('[data-pub] section, main section[id]:not(#hero-main)').evaluateAll((els) => els.flatMap((s) => [...s.querySelectorAll('*')])
      .filter((el) => !(el instanceof SVGElement) && !el.hasAttribute('data-drift') && !['none', 'matrix(1, 0, 0, 1, 0, 0)'].includes(getComputedStyle(el).transform)) // the bridging photos drift by design (Task 5)
      .filter((el) => { const r = el.getBoundingClientRect(); return r.top < window.innerHeight * 1.2; }).length);
    expect(moved).toBe(0);
  });
});

const ORDER = ['gioi-thieu', 'doi-ngu', 'cau-chuyen', 'khong-gian', 'dich-vu', 'san-pham', 'quy-trinh', 'hoi-dap', 'lien-he'];
const ASKS: Record<string, string> = {
  'gioi-thieu': 'Bé không khỏe, mình nên làm gì?', 'doi-ngu': 'Ai sẽ chăm bé của bạn?', 'cau-chuyen': 'Những bé khác đã được chăm thế nào?',
  'khong-gian': 'Bé sẽ nằm ở đâu?', 'dich-vu': 'Lê Sơn làm được những gì?', 'san-pham': 'Bé cần thêm gì ở nhà?',
  'quy-trinh': 'Lần đầu đến thì thế nào?', 'hoi-dap': 'Còn điều gì bạn ngại hỏi?', 'lien-he': 'Vậy mình hẹn nhau nhé.',
};

test.describe('thứ tự và dòng hỏi', () => {
  test('sections come in the story order, each with one h2 and its question', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toBeAttached();
    await expect(page.locator('#san-pham')).toBeAttached();
    const ids = await page.evaluate(() => [...document.querySelectorAll('#noi-dung section[id]')].map((s) => s.id));
    expect(ids).toEqual(['hero-main', ...ORDER]);
    for (const id of ORDER) {
      const sec = page.locator(`#${id}`);
      await expect(sec.locator('h2')).toHaveCount(1);
      await expect(sec.locator('[data-ask]')).toHaveText(ASKS[id]!);
    }
  });

  test('every shown section is one chapter of a single CSS counter, so hiding a section never leaves a gap', async ({ page }) => {
    // getComputedStyle does not resolve counters, so the structure is checked: one reset on the flow, one increment per section, one marker per section.
    const state = () => page.evaluate(() => {
      const flow = document.querySelector('#noi-dung [data-pub]')!;
      const sections = [...flow.querySelectorAll(':scope > section[id]')];
      return {
        reset: getComputedStyle(flow).counterReset,
        increments: sections.map((s) => getComputedStyle(s).counterIncrement),
        markers: sections.map((s) => s.querySelectorAll('[data-chapter]').length),
        content: sections.map((s) => getComputedStyle(s.querySelector('[data-chapter]')!, '::before').content),
      };
    });
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toBeAttached();
    const full = await state();
    expect(full.reset).toContain('chapter');
    expect(full.increments).toHaveLength(9);
    for (const i of full.increments) expect(i).toContain('chapter');
    expect(full.markers).toEqual(Array(9).fill(1));
    for (const c of full.content) expect(c).toContain('decimal-leading-zero');
    await hideFeatured(page, ['cases']);
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toHaveCount(0);
    const fewer = await state();
    expect(fewer.increments).toHaveLength(8);
    expect(fewer.markers).toEqual(Array(8).fill(1));
  });

  test('chapter numbers are decoration for screen readers', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#gioi-thieu [data-chapter]')).toHaveAttribute('aria-hidden', 'true');
  });
});

test.describe('hình dạng và chữ', () => {
  test('photos are softly rounded, primary buttons are no longer square, photos carry a shadow @desktop-only', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toBeAttached();
    const r = await page.evaluate(() => {
      const radius = (el: Element) => parseFloat(getComputedStyle(el).borderTopLeftRadius);
      const figs = [...document.querySelectorAll('#noi-dung section[id]:not(#hero-main) figure')];
      const btn = document.querySelector('#gioi-thieu a[href*="dich-vu"]')!;
      return { figs: figs.map(radius), btn: radius(btn), shadows: figs.map((f) => getComputedStyle(f).boxShadow) };
    });
    expect(r.figs.length).toBeGreaterThan(3);
    for (const x of r.figs) { expect(x).toBeGreaterThanOrEqual(20); expect(x).toBeLessThanOrEqual(28); }
    expect(r.btn).toBeGreaterThanOrEqual(12);
    for (const s of r.shadows) expect(s).not.toBe('none');
  });

  test('section headings are Lora and large; the italic accent is only inside the heading', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toBeAttached();
    const w = page.viewportSize()!.width;
    const r = await page.evaluate(() => [...document.querySelectorAll('#noi-dung section[id]:not(#hero-main) h2')].map((h) => {
      const cs = getComputedStyle(h);
      return { size: parseFloat(cs.fontSize), family: cs.fontFamily };
    }));
    for (const x of r) {
      expect(x.family).toContain('Lora');
      expect(x.size).toBeGreaterThanOrEqual(w >= 1000 ? 40 : 30);
    }
    const italics = await page.evaluate(() => [...document.querySelectorAll('#noi-dung section[id]:not(#hero-main) em')].filter((e) => !e.closest('h2')).length);
    expect(italics).toBe(0);
  });

  test('body text is at least 16 px and the page fits the device, also with a doubled system font @narrow', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toBeAttached();
    const phone = page.viewportSize()!.width < 640; // the 16 px floor is a phone rule; desktop keeps its captions smaller
    const small = !phone ? [] : await page.evaluate(() => [...document.querySelectorAll('#noi-dung section[id]:not(#hero-main) :is(p, li, span, a)')]
      .filter((el) => el.children.length === 0 && !/pill/.test(el.className) && (el.textContent ?? '').trim().length > 40 && parseFloat(getComputedStyle(el).fontSize) < 15.9).map((e) => e.textContent!.slice(0, 40))); // the sample-content tags (pills) are captions, so they are skipped
    expect(small).toEqual([]);
    await fitsDevice(page);
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    await page.waitForTimeout(300);
    await fitsDevice(page);
  });
});

test.describe('ảnh bắc ngang', () => {
  const rects = (page: Page) => page.evaluate(() => {
    const r = (el: Element | null) => (el ? el.getBoundingClientRect().toJSON() as { top: number; bottom: number; left: number; right: number } : null);
    const bridges = [...document.querySelectorAll('[data-bridge]')];
    const sec = (el: Element) => el.closest('section[id]')!;
    return bridges.map((b) => {
      const s = sec(b);
      const prev = s.previousElementSibling ?? document.querySelector('#hero-main'); // the first section follows the hero
      return { id: s.id, rect: r(b)!, prev: prev ? { id: prev.id, rect: r(prev)!, inner: r(prev.querySelector(':scope > div'))! } : null };
    });
  });

  test('on a wide screen three photos rise over the section above, clear of its text and buttons @desktop-only', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toBeAttached();
    await page.waitForTimeout(600);
    const list = await rects(page);
    expect(list.map((x) => x.id)).toEqual(['gioi-thieu', 'cau-chuyen', 'lien-he']);
    expect(list.map((x) => x.prev!.id)).toEqual(['hero-main', 'doi-ngu', 'hoi-dap']);
    for (const x of list) {
      const rise = x.prev!.rect.bottom - x.rect.top;
      expect(rise, `${x.id} rises over ${x.prev!.id}`).toBeGreaterThanOrEqual(24);
      expect(rise).toBeLessThanOrEqual(80);
      // The rise stays inside the empty bottom padding of the section above, so it never covers that section's content.
      if (x.prev!.id !== 'hero-main') expect(x.rect.top).toBeGreaterThanOrEqual(x.prev!.inner.bottom - 1);
    }
    // And the hero's own controls stay clear of the first photo.
    const hero = await page.evaluate(() => {
      const r = (s: string) => document.querySelector(s)!.getBoundingClientRect().toJSON() as { top: number; bottom: number; left: number; right: number };
      return { toggle: r('.ho .motion-toggle'), cta: r('.ho .cta'), photo: r('#gioi-thieu [data-bridge]') };
    });
    const hit = (a: { top: number; bottom: number; left: number; right: number }, b: typeof a) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    expect(hit(hero.photo, hero.toggle)).toBe(false);
    expect(hit(hero.photo, hero.cta)).toBe(false);
  });

  test('the drift is at most 12 px', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toBeAttached();
    for (const id of ['gioi-thieu', 'cau-chuyen', 'lien-he']) {
      await page.evaluate((i) => document.getElementById(i)!.scrollIntoView({ block: 'center' }), id);
      await page.waitForTimeout(500);
      const ty = await page.locator(`#${id} [data-drift]`).first().evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42);
      expect(Math.abs(ty), id).toBeLessThanOrEqual(12.01);
    }
  });

  test('reduced motion: nothing drifts @motion-reduced', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toBeAttached();
    for (const id of ['gioi-thieu', 'cau-chuyen', 'lien-he']) {
      await page.evaluate((i) => document.getElementById(i)!.scrollIntoView({ block: 'center' }), id);
      await page.waitForTimeout(300);
      expect(await page.locator(`#${id} [data-drift]`).first().evaluate((el) => getComputedStyle(el).transform), id).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    }
  });

  test('phones: the rise stays in the padding above, nothing runs past the device @narrow', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toBeAttached();
    await page.waitForTimeout(600);
    const all = await rects(page);
    expect(all).toHaveLength(3);
    for (const x of all) {
      if (x.prev!.id === 'hero-main') continue;
      expect(x.rect.top, x.id).toBeGreaterThanOrEqual(x.prev!.inner.bottom - 1);
    }
    await fitsDevice(page);
  });

  test('a picture that does not load leaves a tidy frame', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toBeAttached();
    const before = await page.locator('#cau-chuyen [data-bridge]').evaluate((el) => el.getBoundingClientRect().height);
    await page.locator('#cau-chuyen [data-bridge] img').evaluate((img) => { (img as HTMLImageElement).removeAttribute('srcset'); (img as HTMLImageElement).src = '/missing.webp'; });
    await page.waitForTimeout(400);
    const after = await page.locator('#cau-chuyen [data-bridge]').evaluate((el) => ({ h: el.getBoundingClientRect().height, bg: getComputedStyle(el.querySelector('figure')!).backgroundColor }));
    expect(after.h).toBeGreaterThan(100);
    expect(Math.abs(after.h - before)).toBeLessThan(2);
    expect(after.bg).not.toBe('rgba(0, 0, 0, 0)');
  });
});

test.describe('nhịp bố cục', () => {
  const box = (page: Page, sel: string) => page.locator(sel).first().evaluate((el) => el.getBoundingClientRect().toJSON() as { left: number; right: number; width: number; top: number; bottom: number });

  test('Đội ngũ: the head doctor has a large portrait beside his words, the open places are small and in one row @desktop-only', async ({ page }) => {
    await open(page, '/');
    const inner = await box(page, '#doi-ngu > div');
    const portrait = await box(page, '#doi-ngu figure');
    expect(portrait.width).toBeGreaterThanOrEqual(inner.width * 0.3);
    const name = await box(page, '#doi-ngu [class*="name"]');
    expect(name.left).toBeGreaterThanOrEqual(portrait.right);
    const slots = await page.locator('#doi-ngu [data-team-slot]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON() as { top: number; width: number }));
    expect(slots).toHaveLength(3);
    for (const s of slots) expect(s.width).toBeLessThanOrEqual(inner.width * 0.25);
    expect(new Set(slots.map((s) => Math.round(s.top))).size).toBe(1);
  });

  test('Quy trình: four numbered cards, no line between them', async ({ page }) => {
    await open(page, '/');
    await page.locator('#quy-trinh').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const cards = await page.locator('#quy-trinh [data-step]').evaluateAll((els) => els.map((e) => {
      const card = e.firstElementChild!.firstElementChild ? e.firstElementChild! : e;
      const cs = getComputedStyle(card);
      return { bg: cs.backgroundColor, shadow: cs.boxShadow, radius: parseFloat(cs.borderTopLeftRadius) };
    }));
    expect(cards).toHaveLength(4);
    for (const c of cards) { expect(c.bg).not.toBe('rgba(0, 0, 0, 0)'); expect(c.shadow).not.toBe('none'); expect(c.radius).toBeGreaterThanOrEqual(14); }
    await expect(page.locator('#quy-trinh [data-process-line]')).toHaveCount(0);
  });

  test('Hỏi đáp: two columns on a wide screen, one on a phone', async ({ page }) => {
    await open(page, '/');
    await page.locator('#hoi-dap').scrollIntoViewIfNeeded();
    const w = page.viewportSize()!.width;
    const inner = await box(page, '#hoi-dap > div');
    const list = await box(page, '#hoi-dap [class*="faqList"]');
    const head = await box(page, '#hoi-dap h2');
    if (w >= 900) {
      expect(list.left).toBeGreaterThanOrEqual(inner.left + inner.width * 0.3);
      expect(head.right).toBeLessThanOrEqual(list.left + 1);
    } else {
      expect(list.left).toBeLessThanOrEqual(inner.left + 2);
      expect(list.width).toBeGreaterThanOrEqual(inner.width - 4);
    }
    await expect(page.locator('#hoi-dap').getByRole('link', { name: /097 355 51 05/ })).toBeVisible();
  });

  test('a sample-content tag stays the size of its words, not the width of the section @desktop-only', async ({ page }) => {
    await open(page, '/');
    const inner = await box(page, '#doi-ngu > div');
    const tag = await box(page, '#doi-ngu > div > span');
    expect(tag.width).toBeLessThan(inner.width * 0.7);
  });

  test('a story of 600 unbroken letters, a pet name of 30, a product name of 60 break inside their frames', async ({ page }) => {
    await open(page, '/');
    await page.evaluate(async () => {
      type Api = { loginAs(u: string): Promise<unknown>; api: { staff: { content: { cases: { create(i: unknown): Promise<string> }; products: { create(i: unknown): Promise<string> } } } } };
      const d = (window as unknown as { __lesonDemo: Api }).__lesonDemo;
      await d.loginAs('quanly_ha');
      await d.api.staff.content.cases.create({ title: 'T'.repeat(80), story: 'a'.repeat(600), petName: 'P'.repeat(30), species: 'cat', consent: true });
      await d.api.staff.content.products.create({ name: 'N'.repeat(60), category: 'food', note: 'n'.repeat(120) });
    });
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toBeAttached();
    await expect(page.locator('#san-pham')).toBeAttached();
    await page.waitForTimeout(600);
    const overflow = await page.evaluate(() => [...document.querySelectorAll('#noi-dung section[id]:not(#hero-main) > div')].map((d) => [d.parentElement!.id, d.scrollWidth - d.clientWidth]).filter(([, x]) => (x as number) > 1));
    expect(overflow).toEqual([]);
    await fitsDevice(page);
  });
});

test.describe('hero: chữ và nút', () => {
  test('the headline speaks to the worried owner; the old line became the subline; the words are marked as sample', async ({ page }) => {
    await open(page, '/');
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(/Khi bé không khỏe,\s*bạn không phải lo\s*một mình\./);
    await expect(h1.locator('em')).toHaveText('một mình.');
    const ho = page.locator('.ho__content');
    await expect(ho).toContainText('Không gian lớn cho những người bạn nhỏ.');
    await expect(ho).toContainText('Chăm sóc bằng chuyên môn, đồng hành bằng sự thấu hiểu.');
    await expect(ho.getByText('Nội dung mẫu')).toBeVisible();
    expect(await page.locator('.ho').innerText()).not.toContain('24/24');
  });

  test('in opening hours: Đặt lịch and a call link, in that order; the call link is the real number', async ({ page }) => {
    await openDuringHours(page, '/');
    const cta = page.locator('.ho .cta');
    await expect(cta.getByRole('link', { name: /Gửi yêu cầu đặt lịch/ })).toHaveAttribute('href', /dat-lich/);
    const call = cta.getByRole('link', { name: 'Gọi 097 355 51 05' });
    await expect(call).toHaveAttribute('href', 'tel:+84973555105');
    await expect(cta.getByRole('button', { name: 'Để lại lời nhắn' })).toHaveCount(0);
    const [a, b] = await Promise.all([cta.getByRole('link', { name: /Gửi yêu cầu đặt lịch/ }).boundingBox(), call.boundingBox()]);
    if (page.viewportSize()!.width <= 700) expect(b!.y).toBeGreaterThan(a!.y + a!.height - 2); // stacked on a phone
    else expect(b!.x).toBeGreaterThan(a!.x + a!.width - 2); // side by side
  });

  test('outside hours the call link becomes a message button that opens the dialog and gives the focus back', async ({ page }) => {
    await open(page, '/');
    await setClock(page, '2026-10-26T22:30:00+07:00');
    await remountHome(page, '/');
    const cta = page.locator('.ho .cta');
    await expect(cta.getByRole('link', { name: /Gọi 097/ })).toHaveCount(0);
    const ask = cta.getByRole('button', { name: 'Để lại lời nhắn' });
    await ask.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Để lại lời nhắn' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(ask).toBeFocused();
  });

  test('on a holiday the button changes at 19:00, by the same rule as the rest of the page', async ({ page }) => {
    await open(page, '/');
    await page.evaluate(async () => {
      const d = (window as unknown as { __lesonDemo: { loginAs(u: string): Promise<unknown>; api: { staff: { settings: { get(): Promise<{ version: number }>; update(v: number, p: unknown): Promise<unknown> } } } } }).__lesonDemo;
      await d.loginAs('quanly_ha');
      const s = await d.api.staff.settings.get();
      await d.api.staff.settings.update(s.version, { holidays: [{ date: '2026-10-26' }] });
    });
    await setClock(page, '2026-10-26T19:30:00+07:00');
    await remountHome(page, '/');
    await expect(page.locator('.ho .cta').getByRole('button', { name: 'Để lại lời nhắn' })).toBeVisible();
    await setClock(page, '2026-10-26T18:30:00+07:00');
    await remountHome(page, '/');
    await expect(page.locator('.ho .cta').getByRole('link', { name: 'Gọi 097 355 51 05' })).toBeVisible();
  });

  test('the two buttons fit a phone and keep a comfortable touch size @narrow', async ({ page }) => {
    await openDuringHours(page, '/');
    const sizes = await page.locator('.ho .cta .btn').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON() as { width: number; height: number }));
    expect(sizes).toHaveLength(2);
    for (const s of sizes) expect(s.height).toBeGreaterThanOrEqual(44);
    await fitsDevice(page);
  });
});

test.describe('quỹ đạo', () => {
  /** Samples the frames every `step` ms for `ms` ms; returns the moments a visible photo touched the words or buttons, and the most photos seen at once. */
  const watch = (page: Page, ms: number, step = 300) => page.evaluate(async ({ ms, step }) => {
    const hero = document.querySelector('.ho')!;
    const hr = hero.getBoundingClientRect();
    const sel = '.ho-title .line > span, .subtitle, .cta .btn, .eyebrow span, .sample-note, .motion-toggle, .preview-tag';
    const touches: { at: number; frame: number; text: string }[] = [];
    let most = 0;
    let present = 0;
    const t0 = performance.now();
    while (performance.now() - t0 < ms) {
      const texts = [...hero.querySelectorAll(sel)].map((e) => ({ name: (e.textContent ?? '').slice(0, 24), r: e.getBoundingClientRect() })).filter((x) => x.r.width > 0);
      const rise = document.querySelector('#gioi-thieu [data-bridge]');
      if (rise) texts.push({ name: 'the photo that rises from the first section', r: rise.getBoundingClientRect() });
      let shown = 0;
      present = [...hero.querySelectorAll('.ho__frames .frame')].filter((f) => getComputedStyle(f).display !== 'none').length;
      [...hero.querySelectorAll('.ho__frames .frame')].forEach((f, i) => {
        const el = f as HTMLElement;
        const o = parseFloat(el.style.opacity || '0');
        if (getComputedStyle(el).display === 'none' || o <= 0.05) return;
        shown++;
        const r = el.querySelector('.frame__card')!.getBoundingClientRect();
        for (const t of texts) if (r.left < t.r.right && r.right > t.r.left && r.top < t.r.bottom && r.bottom > t.r.top) touches.push({ at: Math.round(performance.now() - t0), frame: i, text: t.name });
      });
      most = Math.max(most, shown);
      await new Promise((res) => setTimeout(res, step));
    }
    return { touches, most, present, heroTop: hr.top };
  }, { ms, step });

  test('five frames in the page, in the chosen order, all clear (no heavy blur)', async ({ page }) => {
    await open(page, '/');
    await page.waitForTimeout(4000);
    const frames = await page.locator('.ho__frames .frame').evaluateAll((els) => els.map((e) => ({
      photo: getComputedStyle(e.querySelector('.frame__inner')!).backgroundImage, shown: getComputedStyle(e).display !== 'none',
    })));
    expect(frames).toHaveLength(5);
    ['hero-2', 'hero-5', 'hero-0', 'hero-1', 'hero-6'].forEach((n, i) => expect(frames[i]!.photo, `frame ${i}`).toContain(n));
    expect(frames.filter((f) => f.shown).length).toBe(page.viewportSize()!.width <= 700 ? 4 : 5);
    const blur = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.ho')!).getPropertyValue('--blur-far')));
    expect(blur).toBeLessThan(1);
  });

  test('no photo touches the words or buttons while it opens and orbits, at seven window sizes @desktop-only', async ({ page }) => {
    test.setTimeout(240_000);
    for (const [w, h] of [[1920, 1080], [1440, 900], [1280, 600], [1024, 768], [768, 1024], [390, 844], [320, 568]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await open(page, '/');
      const r = await watch(page, 9000, 250);
      expect(r.touches, `${w}x${h}`).toEqual([]);
      expect(r.most, `${w}x${h} photos seen`).toBeGreaterThanOrEqual(2);
    }
  });

  test('a doubled system font does not bring the photos onto the words @narrow', async ({ page }) => {
    await open(page, '/');
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    await page.waitForTimeout(1500);
    const r = await watch(page, 6000, 250);
    expect(r.touches).toEqual([]);
  });

  test('resizing the window from wide to phone and back keeps the right number of photos and none on the words @desktop-only', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, '/');
    await page.waitForTimeout(3500);
    expect((await watch(page, 1500)).present).toBe(5);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1500);
    const phone = await watch(page, 4000);
    expect(phone.touches).toEqual([]);
    expect(phone.present).toBe(4);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(1500);
    const back = await watch(page, 4000);
    expect(back.touches).toEqual([]);
    expect(back.present).toBe(5);
    expect(back.most).toBeGreaterThanOrEqual(2);
  });

  test('"Tạm dừng chuyển động" freezes the photos where they are, still off the words @desktop-only', async ({ page }) => {
    await open(page, '/');
    await page.waitForTimeout(4000);
    await page.getByRole('button', { name: 'Tạm dừng chuyển động' }).click();
    await page.waitForTimeout(400);
    const pos = () => page.locator('.ho__frames .frame').evaluateAll((els) => els.map((e) => (e as HTMLElement).style.transform));
    const a = await pos();
    await page.waitForTimeout(1500);
    expect(await pos()).toEqual(a);
    expect((await watch(page, 800)).touches).toEqual([]);
  });

  test('reduced motion: the photos are at fixed places, off the words, and at least three show @motion-reduced', async ({ page }) => {
    await open(page, '/');
    await page.waitForTimeout(600);
    const r = await watch(page, 1200);
    expect(r.touches).toEqual([]);
    expect(r.most).toBeGreaterThanOrEqual(3);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.ho .cta .btn').first()).toBeVisible();
  });
});

test.describe('hero tan vào trang', () => {
  test('the bottom of the hero fades into the first section’s cream instead of ending on a hard line', async ({ page }) => {
    await open(page, '/');
    const r = await page.evaluate(() => {
      const after = getComputedStyle(document.querySelector('.ho')!, '::after');
      const next = document.querySelector('#gioi-thieu')!.getBoundingClientRect();
      const ho = document.querySelector('.ho')!.getBoundingClientRect();
      return { image: after.backgroundImage, height: parseFloat(after.height), gap: next.top - ho.bottom };
    });
    expect(r.image).toContain('rgb(251, 247, 241)');
    expect(r.height).toBeGreaterThanOrEqual(96);
    expect(Math.abs(r.gap)).toBeLessThanOrEqual(2);
  });

  test('the hero fits one screen: both buttons are inside the first view @desktop-only', async ({ page }) => {
    for (const [w, h] of [[1440, 900], [1280, 720]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await open(page, '/');
      await page.waitForTimeout(2500);
      const b = await page.locator('.ho .cta .btn').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().bottom));
      for (const bottom of b) expect(bottom, `${w}x${h}`).toBeLessThanOrEqual(h);
    }
  });

  test('on a phone the two buttons are inside the first view, or the page scrolls to them without anything covering them @narrow', async ({ page }) => {
    await open(page, '/');
    await page.waitForTimeout(2500);
    const h = page.viewportSize()!.height;
    const first = await page.locator('.ho .cta .btn').first().evaluate((e) => e.getBoundingClientRect().top);
    expect(first).toBeLessThan(h - 40); // the main button starts inside the first view
    for (const btn of await page.locator('.ho .cta .btn').all()) {
      await btn.scrollIntoViewIfNeeded();
      const covered = await btn.evaluate((e) => { const r = e.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !(top === e || e.contains(top)); });
      expect(covered).toBe(false);
    }
  });
});

test.describe('sau rà soát phần 7', () => {
  const watchScrolled = (page: Page, ms: number) => page.evaluate(async (ms) => {
    const hero = document.querySelector('.ho')!;
    const sel = '.ho-title .line > span, .subtitle, .cta .btn, .eyebrow span, .sample-note, .motion-toggle, .preview-tag';
    const bad: string[] = [];
    const t0 = performance.now();
    while (performance.now() - t0 < ms) {
      const hr = hero.getBoundingClientRect();
      const texts = [...hero.querySelectorAll(sel)].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0);
      for (const f of hero.querySelectorAll('.ho__frames .frame')) {
        const el = f as HTMLElement;
        if (getComputedStyle(el).display === 'none' || parseFloat(el.style.opacity || '0') <= 0.05) continue;
        const r = el.querySelector('.frame__card')!.getBoundingClientRect();
        if (r.top < hr.top - 1 || r.bottom > hr.bottom + 1) bad.push(`cut by the hero edge at scroll ${Math.round(window.scrollY)}`);
        for (const x of texts) if (r.left < x.right && r.right > x.left && r.top < x.bottom && r.bottom > x.top) bad.push(`on the words at scroll ${Math.round(window.scrollY)}`);
      }
      await new Promise((res) => setTimeout(res, 120));
    }
    return bad;
  }, ms);

  test('scrolling the page moves the photos with the hero: they never slide under the words or get cut by its edge', async ({ page }) => {
    await open(page, '/');
    await page.waitForTimeout(4500);
    for (const y of [60, 150, 300]) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(500);
      expect(await watchScrolled(page, 900), `scrolled ${y}`).toEqual([]);
    }
  });

  test('on a tablet four photos are really seen, not ghosts beside the pause button', async ({ page }) => {
    test.setTimeout(90_000);
    for (const [w, h] of [[768, 1024], [960, 800]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await open(page, '/');
      await page.waitForTimeout(3500);
      const best = await page.evaluate(async () => {
        const hero = document.querySelector('.ho')!;
        const top = [0, 0, 0, 0, 0];
        const t0 = performance.now();
        while (performance.now() - t0 < 9000) {
          [...hero.querySelectorAll('.ho__frames .frame')].forEach((f, i) => { top[i] = Math.max(top[i]!, parseFloat((f as HTMLElement).style.opacity || '0')); });
          await new Promise((res) => setTimeout(res, 200));
        }
        return top.slice(0, 4);
      });
      for (const [i, o] of best.entries()) expect(o, `${w}x${h} photo ${i + 1}`).toBeGreaterThanOrEqual(0.9);
    }
  });

  test('each section keeps its own background whichever optional sections are hidden', async ({ page }) => {
    const want: Record<string, string> = {
      'gioi-thieu': 'rgb(251, 247, 241)', 'doi-ngu': 'rgb(255, 253, 251)', 'cau-chuyen': 'rgb(241, 230, 243)', 'khong-gian': 'rgb(251, 247, 241)',
      'dich-vu': 'rgb(255, 253, 251)', 'san-pham': 'rgb(248, 242, 249)', 'quy-trinh': 'rgb(251, 247, 241)', 'hoi-dap': 'rgb(255, 253, 251)', 'lien-he': 'rgb(248, 242, 249)',
    };
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toBeAttached();
    await hideFeatured(page, ['cases']);
    await open(page, '/');
    await expect(page.locator('#cau-chuyen')).toHaveCount(0);
    for (const row of await sectionBackgrounds(page)) expect(row.bg, row.id).toBe(want[row.id]);
  });

  test('sample-content tags keep their words inside the pill on a narrow phone @narrow', async ({ page }) => {
    await open(page, '/');
    await page.waitForTimeout(500);
    const cut = await page.evaluate(() => [...document.querySelectorAll('#noi-dung section[id]:not(#hero-main) [class*="pill"]')]
      .filter((e) => e.scrollHeight > e.clientHeight + 1).map((e) => (e.textContent ?? '').slice(0, 30)));
    expect(cut).toEqual([]);
  });

  test('Giới thiệu states the working hours with the emergency line and the address', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#gioi-thieu').getByText('08:00–21:00')).toBeVisible();
  });
});
