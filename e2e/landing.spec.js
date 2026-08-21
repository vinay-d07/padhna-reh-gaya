const { test, expect } = require('@playwright/test');

// Deeper flows (create workspace, upload, chat) require a signed-in Clerk
// session, which needs Clerk testing tokens wired into CI — see
// e2e/README.md. This smoke test covers what's reachable without auth: the
// landing page renders and its primary CTAs point at the right routes.
test.describe('landing page', () => {
  test('renders the hero and links to sign-up', async ({ page }) => {
    await page.goto('/');

    // The same CTA appears twice on the page (hero + a later section) —
    // .first() targets the hero's, which is all this smoke test cares about.
    await expect(page.getByRole('link', { name: 'Create a workspace' }).first()).toHaveAttribute(
      'href',
      '/auth/sign-up'
    );
    await expect(page.getByRole('link', { name: 'See how it works' })).toBeVisible();
  });

  test('sign-up CTA navigates to the Clerk sign-up route', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Create a workspace' }).first().click();

    await expect(page).toHaveURL(/\/auth\/sign-up/);
  });
});
