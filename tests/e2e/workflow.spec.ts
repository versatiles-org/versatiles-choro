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

		// Step 9: Click on "5_gemeinden.geojson" file
		await page.getByRole('button', { name: '5_gemeinden.geojson' }).click();

		// Step 10: FileSaver popup should appear automatically, click "Save"
		await expect(page.getByRole('heading', { name: 'Save Output File' })).toBeVisible();
		await page.getByRole('button', { name: 'Save' }).click();

		// Step 11: If a "Replace" button appears (file exists), click it
		const replaceButton = page.getByRole('button', { name: 'Replace' });
		if (await replaceButton.isVisible({ timeout: 1000 }).catch(() => false)) {
			await replaceButton.click();
		}

		// Step 12: Wait for conversion to complete
		await expect(
			page.getByRole('heading', { name: 'Converting Polygons to Vector Tiles' })
		).toBeVisible();

		// Wait for progress dialog to disappear (conversion complete)
		await expect(
			page.getByRole('heading', { name: 'Converting Polygons to Vector Tiles' })
		).not.toBeVisible({ timeout: 60000 });
	});

	test('create choropleth map and export', async ({ page }) => {
		// Increase timeout for this longer test
		test.setTimeout(180000);

		// Step 1: Go to /map
		await page.goto('/map');
		await expect(page.getByRole('heading', { name: 'Vector Data' })).toBeVisible();

		// Step 2: Click first "Select File" button (Vector Data section)
		await page.locator('button:has-text("Select File")').first().click();

		// Step 3: Navigate to test-data folder in the dialog
		await expect(page.locator('dialog h3:has-text("Select File")').first()).toBeVisible();
		await page.locator('dialog button:has-text("test-data")').first().click();

		// Step 4: Select 5_gemeinden.versatiles
		await page.locator('dialog button:has-text("5_gemeinden.versatiles")').first().click();

		// Wait for dialog to close and tile source to load
		await page.waitForTimeout(2000);

		// Step 5: Enable "Add Data" in Numeric Data section - check the Active checkbox
		await page.locator('label:has-text("Active") input[type="checkbox"]').check();

		// Step 6: Click "Select File" for data file in the Numeric Data section
		await page
			.getByRole('region', { name: 'Add Data' })
			.getByRole('button', { name: 'Select Data File:' })
			.click();

		// Step 7: Navigate and select the TSV file
		// Use the visible dialog (the one that's open)
		const visibleDialog = page.locator('dialog:visible');
		await expect(visibleDialog.locator('h3:has-text("Select File")')).toBeVisible();
		// Navigate to test-data only if there's an enabled folder button (not already in that folder)
		const testDataFolderButton = visibleDialog.locator('button.folder:has-text("test-data")');
		if (await testDataFolderButton.isVisible({ timeout: 500 }).catch(() => false)) {
			await testDataFolderButton.click();
		}
		await visibleDialog.locator('button:has-text("73111-01-01-5-Einkommen.tsv")').click();

		// Wait for dialog to close and CSV fields to load
		await page.waitForTimeout(2000);

		// Step 8: Select Layer Name (required to properly bind the value)
		await page.locator('label:has-text("Layer Name") select').selectOption('5_gemeinden');

		// Step 9: Set ID Field (Tiles) to "AGS" - find by label text
		await page.locator('label:has-text("ID Field (Tiles)") select').selectOption('AGS');

		// Step 10: Set ID Field (Data) to "Schlüssel"
		await page.locator('label:has-text("ID Field (Data)") select').selectOption('Schlüssel');

		// Wait for Svelte reactivity to update the params and propagate to parent
		await page.waitForTimeout(1000);

		// Step 11: Enable Choropleth
		await page.locator('label:has-text("Enable Choropleth") input[type="checkbox"]').check();

		// Step 12: Wait for choropleth form to show Value Field (means layer binding propagated)
		await expect(page.locator('label:has-text("Value Field") select')).toBeVisible({
			timeout: 10000
		});

		// Step 13: Set Value Field to "Lohnsteuer/EW"
		await page.locator('label:has-text("Value Field") select').selectOption('Lohnsteuer/EW');

		// Step 14: Set Color Scheme to "inferno"
		await page.locator('label:has-text("Color Scheme") select').selectOption('inferno');

		// Step 15: Set Min value to 30000
		await page.locator('label:has-text("Min") input[type="number"]').fill('30000');

		// Step 16: Set Max value to 50000
		await page.locator('label:has-text("Max") input[type="number"]').fill('50000');

		// Step 17: Wait for Export button to be enabled (canExport should be true now)
		await expect(page.getByRole('button', { name: 'Export Map' })).toBeEnabled({ timeout: 10000 });

		// Step 18: Click "Export Map" button
		await page.getByRole('button', { name: 'Export Map' }).click();

		// Step 19: FileSaver dialog should appear with default filename
		await expect(page.getByRole('heading', { name: 'Export Choropleth Map' })).toBeVisible();

		// The filename input should have "choropleth-export" as default
		await expect(page.locator('input[type="text"]').first()).toHaveValue('choropleth-export');

		// Step 20: Click Save
		await page.getByRole('button', { name: 'Save' }).click();

		// Step 21: If a "Replace" button appears (folder exists), click it
		const replaceButton = page.getByRole('button', { name: 'Replace' });
		if (await replaceButton.isVisible({ timeout: 1000 }).catch(() => false)) {
			await replaceButton.click();
		}

		// Step 22: Wait for export progress dialog to appear and complete
		await expect(page.getByRole('heading', { name: 'Exporting Map' })).toBeVisible();

		// Wait for export to complete (dialog disappears)
		await expect(page.getByRole('heading', { name: 'Exporting Map' })).not.toBeVisible({
			timeout: 120000
		});
	});
});
