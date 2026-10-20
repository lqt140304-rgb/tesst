// Turns Vite's dist-artifact/index.html into the Artifact page format: the host wraps the page in its own
// <!doctype><head><body> skeleton (charset + viewport), so publish only title/meta/links/scripts + body content (tech §13.3).
import { readFileSync, writeFileSync } from 'node:fs';

const dir = process.argv[2] ?? 'dist-artifact';
const src = readFileSync(`${dir}/index.html`, 'utf8');
const head = src.match(/<head>([\s\S]*?)<\/head>/i)[1];
const body = src.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];
const title = head.match(/<title>[\s\S]*?<\/title>/i)[0];
const rest = head
  .replace(/<meta\s+charset[^>]*>\s*/i, '')
  .replace(/<meta\s+name="viewport"[^>]*>\s*/i, '')
  .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
  .trim();
// The fragment starts with <title>; viewport-fit-sides only together with the max(16px, env(…)) gutters (tokens.css).
const out = `${title}\n<meta name="claude:viewport-fit-sides" content="cover">\n${rest}\n${body.trim()}\n`;
writeFileSync(`${dir}/index.artifact.html`, out);
console.log(`${dir}/index.artifact.html`, out.length, 'bytes');
