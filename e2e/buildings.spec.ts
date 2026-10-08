import { test, expect } from '@playwright/test';

test('opening the app shows building markers loaded from Supabase', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('building-marker').first()).toBeVisible();
});
