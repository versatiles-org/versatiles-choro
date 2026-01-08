import { test, expect } from '@playwright/test';

test.describe('Full Workflow', () => {
	test('download test data and convert polygons', async ({ page }) => {
		// Increase timeout for this longer test
		test.setTimeout(120000);

		// Step 1: Go to frontpage
		await page.goto('/');
		await expect(page.getByRole('heading', { name: 'VersaTiles Choro' })).toBeVisible();

		// Step 2: Click on "Download Test Data"
		await page.getByRole('link', { name: 'Download Test Data' }).click();
		await expect(page.getByRole('heading', { name: 'Download Test Data' })).toBeVisible();

		// Step 3: Click "Start Download" button
		await page.getByRole('button', { name: 'Start Download' }).click();

		// Step 4: Wait for download to complete (button changes to "Downloaded Successfully")
		await expect(page.getByRole('button', { name: /Downloaded Successfully/ })).toBeVisible({
			timeout: 60000
		});

		// Step 5: Go back to frontpage
		await page.goto('/');
		await expect(page.getByRole('heading', { name: 'VersaTiles Choro' })).toBeVisible();

		// Step 6: Click on "Convert Polygons"
		await page.getByRole('link', { name: 'Convert Polygons' }).click();
		await expect(
			page.getByRole('heading', { name: 'Convert Polygons to Vector Tiles' })
		).toBeVisible();

		// Step 7: Click "Select GeoJSON File" button
		await page.getByRole('button', { name: 'Select GeoJSON File' }).click();

		// Step 8: Wait for file browser dialog and click on "test-data" folder
		await expect(page.getByRole('heading', { name: 'Select Input File (GeoJSON)' })).toBeVisible();
		await page.getByRole('button', { name: 'test-data' }).click();

		// Step 9: Click on "1_bundeslaender.geojson" file
		await page.getByRole('button', { name: '1_bundeslaender.geojson' }).click();

		// Step 10: FileSaver popup should appear automatically, click "Save"
		await expect(page.getByRole('heading', { name: 'Save Output File' })).toBeVisible();
		await page.getByRole('button', { name: 'Save' }).click();

		// Step 11: If a "Replace" button appears (file exists), click it
		const replaceButton = page.getByRole('button', { name: 'Replace' });
		if (await replaceButton.isVisible({ timeout: 1000 }).catch(() => false)) {
			await replaceButton.click();
		}

		// Step 12: Wait for conversion to start (progress should appear)
		await expect(
			page.getByRole('heading', { name: 'Converting Polygons to Vector Tiles' })
		).toBeVisible();

		// Wait for conversion to complete - page resets to Step 1 when done
		await expect(page.getByRole('heading', { name: 'Step 1: Select Input File' })).toBeVisible({
			timeout: 60000
		});
	});
});
