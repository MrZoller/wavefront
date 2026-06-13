import { defineConfig, devices } from '@playwright/test';

const desktopChrome = devices['Desktop Chrome'];

/**
 * Playwright config for automated screenshot capture (brief §14).
 *
 * `npm run screenshots` builds nothing extra — it boots the Vite dev server, drives the app
 * headlessly, and writes marquee/module shots to docs/images/ so the visual docs never go stale.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    ...desktopChrome,
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 800 },
    colorScheme: 'dark',
    deviceScaleFactor: 2,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
