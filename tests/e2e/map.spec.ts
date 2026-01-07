import { test, expect } from '@playwright/test';

test.describe('Map Page', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/map');
	});

	test('loads map page with sidebar and map container', async ({ page }) => {
		// Check sidebar section headings exist
		await expect(page.getByRole('heading', { name: 'Vector Data' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Numeric Data' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Design' })).toBeVisible();

		// Check map container exists (MapLibre adds maplibregl-map class)
		await expect(page.locator('.maplibregl-map')).toBeVisible();
	});

	test('export button is disabled until form is complete', async ({ page }) => {
		const exportButton = page.getByRole('button', { name: 'Export Map' });

		// Export should be disabled initially
		await expect(exportButton).toBeDisabled();
	});

	test('inspector mode checkbox is visible and toggleable', async ({ page }) => {
		const checkbox = page.getByRole('checkbox', { name: 'Inspector Mode' });

		await expect(checkbox).toBeVisible();
		await expect(checkbox).toBeChecked();

		// Toggle off
		await checkbox.uncheck();
		await expect(checkbox).not.toBeChecked();

		// Toggle back on
		await checkbox.check();
		await expect(checkbox).toBeChecked();
	});
});

test.describe('Homepage', () => {
	test('redirects or loads homepage', async ({ page }) => {
		const response = await page.goto('/');

		// Check the page loads successfully (200 or redirect)
		expect(response?.ok()).toBeTruthy();
	});
});
