const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  const t0 = Date.now();
  await p.goto('http://127.0.0.1:5179/'); await p.waitForSelector('.ho.is-ready', { timeout: 15000 });
  await p.waitForTimeout(2000);
  console.log('dev(StrictMode) frame elements =', await p.locator('.ho__frames .frame').count(), '| orbit paths =', await p.locator('.ho__orbits svg path').count(), '| errors:', errs.join(' | ') || 'none', '| first load ms', Date.now() - t0);
  await b.close();
})();
