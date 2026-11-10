import { defineConfig, devices } from '@playwright/test';

const authenticated = process.env.QA_E2E_AUTH === '1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node scripts/qa-e2e-preview.mjs',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // Same-origin Worker. Do not bake a remote API or a Supabase host into the preview.
      VITE_APP_URL: '',
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
      ...(authenticated ? { QA_E2E_AUTH: '1' } : {}),
    },
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /authenticated\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'authenticated',
      testMatch: /authenticated\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
