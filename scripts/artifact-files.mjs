// Prints the Artifact `files` map for dist-artifact (every file but the page itself), with `null` for paths published
// before and gone now (tech §13.3 republish). `--commit` records the current set in scripts/artifact-published.json.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const dir = 'dist-artifact';
const skip = new Set(['index.html', 'index.artifact.html', '.published.json']);
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const files = walk(dir).map((p) => relative(dir, p)).filter((p) => !skip.has(p)).sort();
// Kept outside dist-artifact: every build empties that folder.
const ledger = 'scripts/artifact-published.json';
const before = existsSync(ledger) ? JSON.parse(readFileSync(ledger, 'utf8')) : [];
const map = Object.fromEntries(files.map((p) => [p, `${dir}/${p}`]));
for (const old of before) if (!files.includes(old)) map[old] = null;
if (process.argv.includes('--commit')) writeFileSync(ledger, JSON.stringify(files, null, 2));
console.log(JSON.stringify(map, null, 2));
