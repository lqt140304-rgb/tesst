import { expect, test, type Page } from '@playwright/test';
import { open } from './helpers';
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
