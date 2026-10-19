const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  await p.goto('file://' + path.resolve('dist-single/index.html'));
  await p.waitForSelector('.ho.is-ready', { timeout: 8000 });
  const fonts = await p.evaluate(() => document.fonts.check('italic 700 40px Lora', 'người bạn nhỏ'));
  await p.click('nav a:has-text("Đăng nhập")');
  await p.waitForSelector('[data-testid=pets]:has-text("Mướp")', { timeout: 4000 });
  console.log('[single-file over file://] hero OK, Lora Vietnamese loaded:', fonts, '| route change OK | url', p.url().split('/').pop(), '| errors:', errs.join(' | ') || 'none');
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
