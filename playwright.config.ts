import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  fullyParallel: true,
  reporter: [['list']],
  webServer: { command: 'npm run preview', port: 4173, reuseExistingServer: true, timeout: 60_000 },
  use: { baseURL: 'http://127.0.0.1:4173/', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', trace: 'off' },
  projects: [
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, grepInvert: /@motion-reduced/ },
    { name: 'phone-390', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, grepInvert: /@desktop-only|@motion-reduced/ },
    { name: 'phone-320', use: { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true }, grep: /@header/ },
    { name: 'reduced-motion', use: { viewport: { width: 1440, height: 900 }, contextOptions: { reducedMotion: 'reduce' } }, grep: /@motion-reduced/ },
  ],
});
