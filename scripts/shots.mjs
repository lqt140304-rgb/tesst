// npm run shots: build, capture every manifest screen at 1440 and 390 (SHOTS=1), then write review/index.html.
import { execSync } from 'node:child_process';

const run = (cmd, env = {}) => execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } });
run('npm run build');
run('npx playwright test e2e/shots.spec.ts --project=desktop-1440 --project=phone-390', { SHOTS: '1' });
run('node scripts/contact-sheet.mjs');
