import { expect, type Page } from '@playwright/test';

/** Collect console + page errors for a test. */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

/** Open the app at a hash route with instant mock latency (and optionally as a demo user). */
export async function open(page: Page, route = '/', opts: { as?: string } = {}) {
  await page.goto('./#/');
  await page.waitForFunction(() => '__lesonDemo' in window);
  await page.evaluate(async (as) => {
    const d = (window as unknown as { __lesonDemo: { setLatency(ms: number): void; loginAs(u: string): Promise<unknown>; logout(): Promise<void> } }).__lesonDemo;
    d.setLatency(0);
    if (as) await d.loginAs(as);
  }, opts.as ?? null);
  await page.evaluate((r) => { location.hash = r; }, route);
  await page.waitForTimeout(150);
}

export async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}
