import { expect, test, type Page } from '@playwright/test';
import { open } from './helpers';

type Demo = { api: { auth: { login(i: { identifier: string; password: string; remember?: boolean }): Promise<unknown>; current(): unknown } } };
const login = (page: Page, remember: boolean) => page.evaluate((r) => (window as unknown as { __lesonDemo: Demo }).__lesonDemo.api.auth.login({ identifier: 'lan_nguyen', password: 'leson-demo', remember: r }), remember);
const current = (page: Page) => page.evaluate(() => (window as unknown as { __lesonDemo: Demo }).__lesonDemo.api.auth.current());

/** Part 2 §4.2 in a real browser: the tick keeps the customer signed in in a new tab; without it, only this tab. */
test('"Ghi nhớ đăng nhập" carries the customer session to a new tab @desktop-only', async ({ page, context }) => {
  await open(page, '/');
  await login(page, false);
  const plain = await context.newPage();
  await open(plain, '/');
  expect(await current(plain)).toBeNull();

  await login(page, true);
  const remembered = await context.newPage();
  await open(remembered, '/');
  expect(await current(remembered)).toEqual({ kind: 'customer', accountId: 'acc-lan_nguyen' });
});
