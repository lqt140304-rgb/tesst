const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:4173/a/b/';
const OUT = process.argv[3] || '.';
const log = (...a) => console.log(...a);
const rafCounter = `(() => { const o = window.requestAnimationFrame.bind(window); window.__raf = 0;
  window.requestAnimationFrame = (cb) => { window.__raf++; return o(cb); }; })();`;
(async () => {
  const browser = await chromium.launch();
  for (const vp of [{ w: 1440, h: 900, name: '1440' }, { w: 390, h: 844, name: '390' }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(rafCounter);
    await page.goto(BASE);
    await page.waitForSelector('.ho.is-ready', { timeout: 5000 });
    await page.waitForTimeout(3500);
    const frames = await page.locator('.ho__frames .frame:not([style*="display: none"])').count();
    const fontsOk = await page.evaluate(() => ({
      lora700i: document.fonts.check('italic 700 40px Lora', 'người bạn nhỏ'),
      bvp400: document.fonts.check('400 16px "Be Vietnam Pro"', 'Chăm sóc bằng chuyên môn'),
      loaded: performance.getEntriesByType('resource').filter(r => r.name.endsWith('.woff2')).map(r => r.name.split('/').pop().replace(/-[A-Za-z0-9_]{8}\.woff2$/, '')),
    }));
    log(`[${vp.name}] frames visible=${frames} fonts=`, JSON.stringify(fontsOk));
    await page.screenshot({ path: `${OUT}/probe-home-${vp.name}.png` });
    const axeHome = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    log(`[${vp.name}] axe home violations: ${axeHome.violations.map(v => v.id + '(' + v.nodes.length + ')').join(', ') || 'none'}`);
    // navigate via link, sample opacity mid-transition
    await page.click('nav a:has-text("Đăng nhập")');
    const mid = await page.evaluate(() => new Promise(r => setTimeout(() => { const el = document.querySelector('[data-testid=page]'); r(el ? getComputedStyle(el).opacity : 'none'); }, 60)));
    await page.waitForSelector('h1:has-text("Đăng nhập tài khoản Lê Sơn")');
    await page.waitForSelector('[data-testid=pets]:has-text("Mướp")');
    log(`[${vp.name}] url=${page.url().replace(BASE, '<BASE>')} midTransitionOpacity=${mid} heroGone=${await page.locator('.ho').count() === 0}`);
    await page.waitForTimeout(800);
    const r0 = await page.evaluate(() => window.__raf); await page.waitForTimeout(1000); const r1 = await page.evaluate(() => window.__raf);
    log(`[${vp.name}] rAF calls/second after leaving hero: ${r1 - r0}`);
    const axeLogin = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    log(`[${vp.name}] axe login violations: ${axeLogin.violations.map(v => v.id + '(' + v.nodes.length + ')').join(', ') || 'none'}`);
    await page.screenshot({ path: `${OUT}/probe-login-${vp.name}.png` });
    await page.goBack();
    await page.waitForSelector('.ho.is-ready', { timeout: 5000 });
    await page.waitForTimeout(2500);
    const framesAgain = await page.locator('.ho__frames .frame').count();
    const q0 = await page.evaluate(() => window.__raf); await page.waitForTimeout(1000); const q1 = await page.evaluate(() => window.__raf);
    log(`[${vp.name}] back on home: frame elements=${framesAgain} (expect 9), rAF/s=${q1 - q0}`);
    // reload deep link
    await page.goto(BASE + '#/dang-nhap'); await page.reload(); await page.waitForSelector('h1:has-text("Đăng nhập tài khoản")');
    log(`[${vp.name}] deep link + full reload ok: ${await page.locator('h1').innerText()}`);
    log(`[${vp.name}] page errors: ${errors.length ? errors.join(' | ') : 'none'}`);
    await ctx.close();
  }
  // localStorage + history blocked
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
      History.prototype.pushState = function () { throw new DOMException('blocked', 'SecurityError'); };
      History.prototype.replaceState = function () { throw new DOMException('blocked', 'SecurityError'); };
    });
    await page.goto(BASE);
    await page.waitForSelector('.ho.is-ready', { timeout: 5000 });
    await page.click('nav a:has-text("Đăng nhập")');
    await page.waitForSelector('[data-testid=pets]:has-text("Mướp")', { timeout: 3000 });
    log(`[sandboxed] memory-router navigation + in-memory data OK; url=${page.url().replace(BASE,'<BASE>')}; errors=${errors.length ? errors.join(' | ') : 'none'}`);
    await ctx.close();
  }
  // file://
  {
    const ctx = await browser.newContext(); const page = await ctx.newPage(); const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)); });
    await page.goto('file://' + require('path').resolve('dist/index.html'));
    await page.waitForTimeout(1500);
    log(`[file://] hero present=${await page.locator('.ho').count() > 0}; console errors: ${errors.join(' | ') || 'none'}`);
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
