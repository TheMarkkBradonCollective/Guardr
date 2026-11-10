import { test, expect, type Page } from '@playwright/test';
import { QA_ACCOUNTS, qaSeedPassword } from '../scripts/qa-accounts.ts';

/**
 * Signs in through the existing auth screen against the local Worker.
 * Skipped unless QA_E2E_AUTH=1 and the preview was given QA_DATABASE_URL.
 * Seed the branch first: npm run db:seed:qa
 *
 * The account shell is the signed-in page. Guard and customer browsers can keep
 * a role path in the address bar while rendering that shell, so the assertion
 * is the heading and the account email, not a single URL.
 */
const enabled = process.env.QA_E2E_AUTH === '1';

async function waitForAppReady(page: Page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 10_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 30_000 }).catch(() => {});
}

test.describe('signed-in QA accounts', () => {
  test.skip(!enabled, 'Set QA_E2E_AUTH=1 and QA_DATABASE_URL after npm run db:seed:qa');
  test.describe.configure({ mode: 'serial' });

  for (const account of QA_ACCOUNTS) {
    test(`${account.email} opens a signed-in page`, async ({ page }) => {
      test.setTimeout(90_000);
      const password = qaSeedPassword();
      await page.goto(account.signInPath);
      await waitForAppReady(page);

      const form = page.locator('form').filter({ has: page.locator('input[type="email"]') });
      await form.locator('input[type="email"]').fill(account.email);
      await form.locator('input[type="password"]').fill(password);
      await form.getByRole('button', { name: 'Sign in', exact: true }).click();

      await expect(page.getByRole('heading', { name: account.heading })).toBeVisible({ timeout: 45_000 });
      if (account.kind === 'staff') {
        await expect(page.getByRole('heading', { name: /Finish onboarding/ })).toHaveCount(0);
      } else {
        await expect(page.getByText(account.email).first()).toBeVisible();
      }
      await expect(page).not.toHaveURL(/auth=sign-in/);
    });
  }
});
