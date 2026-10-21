import { expect, test, type Page } from '@playwright/test';
import { open } from './helpers';
import { SCREENS } from './manifest';

/** Owner's type and number standard (docs/tham-khao/quy-chuan-font-chu-va-so-2026-10-21.md). The hero is out of scope. */
test.skip(({ viewport }) => (viewport?.width ?? 0) < 1000, 'computed styles are checked once, at desktop width');

const family = (page: Page, sel: string) => page.locator(sel).first().evaluate((el) => {
  const c = getComputedStyle(el);
  return { family: c.fontFamily.split(',')[0]!.replace(/["']/g, '').trim(), weight: c.fontWeight, style: c.fontStyle };
});

/** Leaf elements that carry a number, money, code, phone or time but are set in Lora; the hero is skipped. */
async function numbersInLora(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    const visible = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('.ho, svg, script, style') || el.children.length > 0 || !visible(el)) continue;
      const t = (el.textContent ?? '').trim();
      if (!t || t.length > 40 || !/\d/.test(t)) continue;
      // Mostly numeric text (money, dates, times, phones) or a code such as HD-1027 / YC-0235; a heading that merely mentions "24/24" may stay in Lora.
      const numeric = [...t].filter((ch) => /[\d.,:/₫%–-]/.test(ch)).length / t.length;
      if (numeric < 0.5 && !/\b[A-Z]{2,3}-\d+/.test(t)) continue;
      const f = getComputedStyle(el).fontFamily.split(',')[0]!.replace(/["']/g, '').trim();
      if (f === 'Lora') out.push(`${el.tagName.toLowerCase()}.${(el as HTMLElement).className.toString().slice(0, 40)}: "${t}"`);
    }
    return out;
  });
}

/** Uppercase text (typed in capitals or set by CSS) that is tracked too wide or set too tight; the hero is skipped. */
async function wideLabels(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll('body *')) {
      // The kicker beside the logo is part of the logo lockup, which the standard says not to restyle.
      if (el.closest('.ho, svg, script, style, a[aria-label*="Về trang chủ"]') || el.children.length > 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const t = (el.textContent ?? '').trim();
      const cs = getComputedStyle(el);
      const upper = cs.textTransform === 'uppercase' || (t.length > 3 && t === t.toUpperCase() && /\p{L}/u.test(t));
      const fs = parseFloat(cs.fontSize);
      if (!upper) continue;
      const ls = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing) / fs;
      const max = fs >= 20 ? 0.021 : 0.081; // headings 0–0.02em, small labels 0.04–0.08em
      const lh = cs.lineHeight === 'normal' ? 1.4 : parseFloat(cs.lineHeight) / fs;
      if (ls > max || (fs < 20 && lh < 1.39)) out.push(`${(el as HTMLElement).className.toString().slice(0, 40)}: "${t.slice(0, 30)}" tracking ${ls.toFixed(2)}em, line ${lh.toFixed(2)}`);
    }
    return out;
  });
}

const ROUTES = SCREENS.filter((s) => s.zone !== 'print' && ['trang-chu', 'dat-lich', 'giao-dien', 'tong-quan', 'thu-cung-miu', 'noi-tru-miu', 'hoa-don-chi-tiet',
  'yeu-cau', 'lich-hen', 'ho-so-khach', 'hoa-don', 'doanh-thu', 'bang-gia', 'noi-tru-chi-tiet'].includes(s.slug));

test.describe('type and number standard', () => {
  for (const sc of ROUTES) {
    test(`${sc.zone}/${sc.slug}: numbers, money, codes and phones are not set in Lora`, async ({ page }) => {
      await open(page, sc.route, sc.as ? { as: sc.as } : {});
      await page.waitForTimeout(500);
      expect(await numbersInLora(page)).toEqual([]);
    });

    test(`${sc.zone}/${sc.slug}: uppercase labels: tracking 0.08em at most (headings 0.02em), line height 1.4 at least`, async ({ page }) => {
      await open(page, sc.route, sc.as ? { as: sc.as } : {});
      await page.waitForTimeout(500);
      expect(await wideLabels(page)).toEqual([]);
    });
  }

  test('page titles: customer in Lora 600, staff in Be Vietnam Pro 600', async ({ page }) => {
    await open(page, '/khach-hang/thu-cung', { as: 'lan_nguyen' });
    await expect(page.locator('[data-zone="customer"] main h1')).toBeVisible();
    await expect.poll(() => family(page, '[data-zone="customer"] main h1')).toMatchObject({ family: 'Lora', weight: '600' });
    await open(page, '/nv/yeu-cau', { as: 'quanly_ha' });
    await expect(page.locator('[data-zone="staff"] main h1')).toBeVisible();
    await expect.poll(() => family(page, '[data-zone="staff"] main h1')).toMatchObject({ family: 'Be Vietnam Pro', weight: '600' });
    // The dashboard greeting is a staff title too: upright, not the italic brand accent.
    await open(page, '/nv', { as: 'quanly_ha' });
    await expect(page.locator('[data-zone="staff"] main h1')).toBeVisible();
    await expect.poll(() => family(page, '[data-zone="staff"] main h1')).toMatchObject({ family: 'Be Vietnam Pro', weight: '600', style: 'normal' });
  });

  test('money cells in tables are right-aligned', async ({ page }) => {
    await open(page, '/nv/hoa-don/inv-27', { as: 'quanly_ha' });
    const bad = await page.evaluate(() => [...document.querySelectorAll('td, th')]
      .filter((c) => /₫/.test(c.textContent ?? '') && !/[A-Za-zÀ-ỹ]{4,}/.test((c.textContent ?? '').replace(/₫/g, '')))
      .filter((c) => !['right', 'end'].includes(getComputedStyle(c).textAlign)).map((c) => (c.textContent ?? '').trim()));
    expect(bad).toEqual([]);
  });

  test('the type sample on #/_giao-dien shows all five styles with the right font, weight and tracking', async ({ page }) => {
    await open(page, '/_giao-dien');
    const get = (k: string) => page.locator(`[data-type-sample="${k}"]`).first().evaluate((el) => {
      const c = getComputedStyle(el);
      const fs = parseFloat(c.fontSize);
      return {
        family: c.fontFamily.split(',')[0]!.replace(/["']/g, '').trim(), weight: c.fontWeight, style: c.fontStyle, transform: c.textTransform,
        tracking: c.letterSpacing === 'normal' ? 0 : Math.round((parseFloat(c.letterSpacing) / fs) * 100) / 100,
      };
    });
    expect(await get('regular')).toMatchObject({ family: 'Be Vietnam Pro', weight: '400', transform: 'none' });
    expect(await get('bold')).toMatchObject({ family: 'Be Vietnam Pro', weight: '700', transform: 'none' });
    expect(await get('upper')).toMatchObject({ family: 'Be Vietnam Pro', transform: 'uppercase' });
    const upperBold = await get('upper-bold');
    expect(upperBold).toMatchObject({ family: 'Be Vietnam Pro', weight: '700', transform: 'uppercase' });
    expect(upperBold.tracking).toBeGreaterThanOrEqual(0.04);
    expect(upperBold.tracking).toBeLessThanOrEqual(0.08);
    expect(await get('italic')).toMatchObject({ family: 'Lora', weight: '600', style: 'italic' });
    expect(await get('number')).toMatchObject({ family: 'Be Vietnam Pro', style: 'normal' });
  });

  test('the faces the standard needs are loaded: Be Vietnam Pro 700 and ₫, Lora italic 600', async ({ page }) => {
    await open(page, '/');
    const ok = await page.evaluate(async () => {
      await Promise.all([document.fonts.load('700 16px "Be Vietnam Pro"', '₫'), document.fonts.load('italic 600 16px Lora', 'Đồng hành')]);
      return document.fonts.check('700 16px "Be Vietnam Pro"', '₫') && document.fonts.check('italic 600 16px Lora', 'Đồng hành');
    });
    expect(ok).toBe(true);
  });
});
