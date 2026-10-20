// review/index.html: every screen at 1440 and 390 side by side, grouped by zone (tech §12.3).
import { existsSync, readdirSync, writeFileSync } from 'node:fs';

const desk = 'review/shots/desktop-1440';
const phone = 'review/shots/phone-390';
const names = existsSync(desk) ? readdirSync(desk).filter((f) => f.endsWith('.png')).sort() : [];
const ZONE = { public: 'Trang công khai', auth: 'Đăng nhập', customer: 'Khu khách hàng', staff: 'Khu nhân viên', print: 'Bản in' };
const groups = {};
for (const n of names) (groups[n.split('__')[0]] ??= []).push(n);
const rows = Object.entries(groups).map(([zone, list]) => `
  <h2>${ZONE[zone] ?? zone}</h2>
  ${list.map((n) => `<figure><figcaption>${n.replace(/^.*?__/, '').replace(/\.png$/, '')}</figcaption>
    <div class="pair"><img src="shots/desktop-1440/${n}" alt="${n} 1440" loading="lazy">${existsSync(`${phone}/${n}`) ? `<img class="ph" src="shots/phone-390/${n}" alt="${n} 390" loading="lazy">` : ''}</div></figure>`).join('')}`).join('');
writeFileSync('review/index.html', `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bộ ảnh duyệt Lê Sơn</title>
<style>
  body { margin: 0; padding: 24px 16px 64px; font: 15px/1.5 system-ui, sans-serif; background: #F6F2F5; color: #231627; }
  h1 { font: 600 26px Georgia, serif; color: #421247; } h2 { margin-top: 40px; color: #5A1E5E; }
  figure { margin: 0 0 28px; } figcaption { font-weight: 600; margin-bottom: 8px; }
  .pair { display: flex; gap: 16px; align-items: flex-start; overflow-x: auto; }
  .pair img { width: min(900px, 70vw); border: 1px solid #E9DEEA; border-radius: 8px; background: #fff; }
  .pair img.ph { width: min(260px, 26vw); }
</style>
<h1>Bộ ảnh duyệt · bản demo Lê Sơn (dữ liệu mẫu)</h1>
<p>${names.length} màn hình · 1440 px và 390 px · đồng hồ cố định 09:00 thứ Hai 19/10/2026.</p>
${rows}
</html>`);
console.log('review/index.html', names.length, 'screens');
