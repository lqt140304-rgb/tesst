// Turns Vite's dist/index.html into the Artifact page format: the host wraps the page in its own
// <!doctype><head><body> skeleton (charset + viewport-fit=cover), so publish only title/meta/links/scripts + body content.
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync('dist/index.html', 'utf8');
const head = src.match(/<head>([\s\S]*?)<\/head>/i)[1];
const body = src.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];
const keep = head
  .replace(/<meta\s+charset[^>]*>\s*/i, '')
  .replace(/<meta\s+name="viewport"[^>]*>\s*/i, '')
  .trim();
const out = `${keep}\n<meta name="robots" content="noindex">\n${body.trim()}\n`;
writeFileSync('dist/index.artifact.html', out);
console.log('dist/index.artifact.html', out.length, 'bytes');
