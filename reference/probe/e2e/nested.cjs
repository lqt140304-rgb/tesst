const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:4173/a/b/';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 120)); });
  await p.goto(BASE + '#/nv'); await p.waitForSelector('h1:has-text("Tổng quan hôm nay")');
  await p.evaluate(() => { document.querySelector('[data-testid=sidebar]').dataset.tag = 'same-node'; });
  await p.click('nav a:has-text("Yêu cầu")');
  await p.waitForSelector('h1:has-text("Yêu cầu đặt lịch")');
  const sidebarKept = await p.evaluate(() => document.querySelector('[data-testid=sidebar]').dataset.tag === 'same-node');
  console.log('in-zone nav: sidebar DOM node kept =', sidebarKept);
  // zone change: sample DOM every 30ms during the transition
  const samples = await p.evaluate(() => new Promise((res) => {
    const out = []; const t0 = performance.now();
    document.querySelector('nav a[href$="#/"]').click();
    const iv = setInterval(() => {
      const z = document.querySelector('[data-testid=zone]');
      out.push(Math.round(performance.now() - t0) + 'ms:' + (z ? z.dataset.zone + '/' + (z.querySelector('h1')?.textContent || '-').slice(0, 22) + '/op=' + Number(getComputedStyle(z).opacity).toFixed(2) : 'none'));
      if (performance.now() - t0 > 700) { clearInterval(iv); res(out); }
    }, 40);
  }));
  console.log('zone change staff -> public samples:\n ' + samples.join('\n '));
  await p.waitForSelector('.ho.is-ready');
  console.log('errors/warnings:', errs.join(' | ') || 'none');
  await b.close();
})();
