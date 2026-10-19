// Verifies generated media against the plan (Task 14): no audio stream, sizes, durations, budgets.
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const failures = [];
const manifest = readFileSync(join(root, 'scripts/media.manifest.tsv'), 'utf8').trim().split('\n').slice(1).map((l) => l.split('\t'));
for (const [id, , , dur, width] of manifest) {
  const file = join(root, 'src/assets/media', `${id}.mp4`);
  let probe;
  try {
    probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]).toString());
  } catch {
    failures.push(`${id}: missing or unreadable`);
    continue;
  }
  if (probe.streams.some((s) => s.codec_type === 'audio')) failures.push(`${id}: has an audio stream`);
  const v = probe.streams.find((s) => s.codec_type === 'video');
  if (!v || String(v.width) !== width) failures.push(`${id}: width ${v?.width} ≠ ${width}`);
  if (Math.abs(Number(probe.format.duration) - Number(dur)) > 0.2) failures.push(`${id}: duration ${probe.format.duration} ≠ ${dur}`);
  if (statSync(file).size > 2 * 1024 * 1024) failures.push(`${id}: larger than 2 MB`);
  for (const ext of ['poster.jpg', 'thumb.jpg']) {
    const f = join(root, 'src/assets/media', `${id}.${ext}`);
    try { if (statSync(f).size > 120 * 1024) failures.push(`${id}.${ext}: larger than 120 KB`); } catch { failures.push(`${id}.${ext}: missing`); }
  }
}
const img = join(root, 'src/assets/img');
const photos = readdirSync(img).filter((f) => f.endsWith('.webp'));
if (photos.length < 9 + 7) failures.push(`expected ≥ 16 webp photos (9 hero + 7 cards), found ${photos.length}`);
for (const f of photos) if (statSync(join(img, f)).size > 250 * 1024) failures.push(`${f}: larger than 250 KB`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`media ok: ${manifest.length} clips, ${photos.length} photos`);
