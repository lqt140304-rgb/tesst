import { expect, type Page } from '@playwright/test';

/**
 * No sideways overflow on the emulated device. Mobile emulation widens the layout viewport to fit overflowing content,
 * so window.innerWidth hides the problem; compare with the device width itself.
 */
export async function fitsDevice(page: Page) {
  const width = page.viewportSize()!.width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
}
