// Fails when the Artifact build breaks a budget (tech §13.2, fonts raised by R5, initial JS by ledger ruling).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const dir = 'dist-artifact';
const assets = join(dir, 'assets');
const KB = 1024;
const all = readdirSync(dir, { recursive: true }).map(String).filter((p) => statSync(join(dir, p)).isFile());
const files = readdirSync(assets);
const gz = (f) => gzipSync(readFileSync(join(assets, f))).length;
const raw = (f) => statSync(join(assets, f)).size;
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const initial = [...html.matchAll(/(?:src|href)="\.\/assets\/([^"]+\.js)"/g)].map((m) => m[1]);
const js = files.filter((f) => f.endsWith('.js'));
const zone = (name) => js.filter((f) => f.startsWith(`${name}-`));
const fonts = files.filter((f) => f.endsWith('.woff2') || f.endsWith('.woff'));
const faces = new Set(fonts.map((f) => f.replace(/-(latin|vietnamese)-/, '-').replace(/-[\w-]{8}\.woff2?$/, '')));
const videos = files.filter((f) => f.endsWith('.mp4'));
const photos = files.filter((f) => /\.(webp|png)$/.test(f) && !f.startsWith('logo'));
const posters = files.filter((f) => f.includes('.poster'));
const isPhoto = (p) => /\.(webp|jpe?g)$/.test(p) || (/\.png$/.test(p) && !p.includes('logo'));
const sum = (list, fn) => list.reduce((n, f) => n + fn(f), 0);

const checks = [
  ['Initial JS (entry + modulepreload, gz)', sum(initial, gz), 240 * KB],
  ['Auth chunk (gz)', sum(zone('auth'), gz), 30 * KB],
  ['Customer chunk (gz)', sum(zone('customer'), gz), 90 * KB],
  ['Staff chunk (gz)', sum(zone('staff'), gz), 120 * KB],
  ['Total JS (gz)', sum(js, gz), 450 * KB],
  ['CSS (gz)', sum(files.filter((f) => f.endsWith('.css')), gz), 50 * KB],
  ['Font faces', faces.size, 10],
  ['Font files', fonts.length, 20],
  ['Fonts (raw)', sum(fonts, raw), 360 * KB],
  ['Largest video', Math.max(0, ...videos.map(raw)), 2 * KB * KB],
  ['All video', sum(videos, raw), 10 * KB * KB],
  ['Largest photo', Math.max(0, ...photos.map(raw)), 250 * KB],
  ['Largest poster', Math.max(0, ...posters.map(raw)), 120 * KB],
  ['dist-artifact total', all.reduce((n, p) => n + statSync(join(dir, p)).size, 0), 15 * KB * KB],
  // Photos are lazy-loaded and counted on their own (redesign §5.6); everything else keeps the 80-file ceiling.
  ['Non-photo files', all.filter((p) => !isPhoto(p)).length, 80],
  ['Photo files', all.filter(isPhoto).length, 60],
  ['All photos (raw)', all.filter(isPhoto).reduce((n, p) => n + statSync(join(dir, p)).size, 0), 4 * KB * KB],
];
let failed = 0;
const fmt = (n, limit) => (limit > 1000 ? `${(n / KB).toFixed(1)} KB` : String(n));
for (const [name, value, limit] of checks) {
  const ok = value <= limit;
  if (!ok) failed += 1;
  console.log(`${ok ? '✓' : '✗'} ${name.padEnd(40)} ${fmt(value, limit).padStart(12)}  ≤ ${fmt(limit, limit)}`);
}
if (failed) { console.error(`${failed} budget(s) exceeded`); process.exit(1); }
