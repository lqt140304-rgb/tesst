import { chromium } from '/home/user/tesst/.worktrees/giao-dien/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1480, height: 900 } });
await p.goto('file://' + process.argv[2]);
await p.screenshot({ path: process.argv[3], fullPage: true });
await b.close();
