import { test, expect } from '@playwright/test';
import { existsSync, rmSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Data directory used by E2E tests (matches DATA_PATH=temp in playwright.config.ts)
const DATA_DIR = join(process.cwd(), 'temp');

// Helper to list files recursively in a directory
function listFiles(dir: string, prefix = ''): string[] {
	if (!existsSync(dir)) return [];
	const entries = readdirSync(dir);
	const files: string[] = [];
	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const relativePath = prefix ? `${prefix}/${entry}` : entry;
		if (statSync(fullPath).isDirectory()) {
			files.push(...listFiles(fullPath, relativePath));
		} else {
			files.push(relativePath);
		}
	}
	return files.sort();
}

// Expected files after each step
const EXPECTED_DOWNLOADED_FILES = [
	'test-data/1_bundeslaender.geojson',
	'test-data/2_regierungsbezirke.geojson',
	'test-data/3_kreise.geojson',
	'test-data/4_verwaltungsgemeinschaften.geojson',
	'test-data/5_gemeinden.geojson',
	'test-data/73111-01-01-5-Einkommen.tsv'
];

const EXPECTED_CONVERTED_FILE = 'test-data/5_gemeinden.versatiles';

const EXPECTED_EXPORT_FILES = [
	'choropleth-export/choro-lib.js',
	'choropleth-export/config.json',
	'choropleth-export/index.html',
	'choropleth-export/overlay.versatiles'
];

test.describe('Full Workflow', () => {
	test('download test data, convert polygons, create choropleth map and export', async ({
		page
	}) => {
		// Increase timeout for this longer test
		test.setTimeout(300000);

		// ============================================================
		// SETUP: Clean data directory to start fresh
		// ============================================================

		// Remove temp directory if it exists to ensure a clean slate
		if (existsSync(DATA_DIR)) {
			rmSync(DATA_DIR, { recursive: true, force: true });
		}

		// Verify we start with an empty data directory
		expect(existsSync(DATA_DIR)).toBe(false);

		// ============================================================
		// PART 1: Download Test Data
		// ============================================================

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

		// Verify: All expected files were downloaded
		const filesAfterDownload = listFiles(DATA_DIR);
		for (const expectedFile of EXPECTED_DOWNLOADED_FILES) {
			expect(filesAfterDownload, `Expected file ${expectedFile} to exist after download`).toContain(
				expectedFile
			);
		}

		// ============================================================
		// PART 2: Convert Polygons to Vector Tiles
		// ============================================================

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
		let replaceButton = page.getByRole('button', { name: 'Replace' });
		if (await replaceButton.isVisible({ timeout: 1000 }).catch(() => false)) {
			await replaceButton.click();
		}

		// Step 12: Wait for conversion to complete
		await expect(
			page.getByRole('heading', { name: 'Converting Polygons to Vector Tiles' })
		).toBeVisible();

		// Wait for progress dialog to disappear (conversion complete)
		// CI runners (especially Firefox/WebKit) can be slower, allow up to 120 seconds
		await expect(
			page.getByRole('heading', { name: 'Converting Polygons to Vector Tiles' })
		).not.toBeVisible({ timeout: 120000 });

		// Verify: Converted .versatiles file was created
		const filesAfterConversion = listFiles(DATA_DIR);
		expect(
			filesAfterConversion,
			`Expected file ${EXPECTED_CONVERTED_FILE} to exist after conversion`
		).toContain(EXPECTED_CONVERTED_FILE);

		// ============================================================
		// PART 3: Create Choropleth Map and Export
		// ============================================================

		// Step 13: Go to /map
		await page.goto('/map');
		await expect(page.getByRole('heading', { name: 'Vector Data' })).toBeVisible();

		// Step 14: Click first "Select File" button (Vector Data section)
		await page.locator('button:has-text("Select File")').first().click();

		// Step 15: Navigate to test-data folder in the dialog
		await expect(page.locator('dialog h3:has-text("Select File")').first()).toBeVisible();
		await page.locator('dialog button:has-text("test-data")').first().click();

		// Step 16: Select 5_gemeinden.versatiles
		await page.locator('dialog button:has-text("5_gemeinden.versatiles")').first().click();

		// Wait for dialog to close and tile source to load
		await page.waitForTimeout(2000);

		// Step 17: Enable "Add Data" in Numeric Data section - check the Active checkbox
		await page.locator('label:has-text("Active") input[type="checkbox"]').check();

		// Step 18: Click "Select File" for data file in the Numeric Data section
		await page
			.getByRole('region', { name: 'Add Data' })
			.getByRole('button', { name: 'Select Data File:' })
			.click();

		// Step 19: Navigate and select the TSV file
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

		// Step 20: Select Layer Name (required to properly bind the value)
		await page.locator('label:has-text("Layer Name") select').selectOption('5_gemeinden');

		// Step 21: Set ID Field (Tiles) to "AGS" - find by label text
		await page.locator('label:has-text("ID Field (Tiles)") select').selectOption('AGS');

		// Step 22: Set ID Field (Data) to "Schlüssel"
		await page.locator('label:has-text("ID Field (Data)") select').selectOption('Schlüssel');

		// Wait for Svelte reactivity to update the params and propagate to parent
		await page.waitForTimeout(1000);

		// Step 23: Enable Choropleth
		await page.locator('label:has-text("Enable Choropleth") input[type="checkbox"]').check();

		// Step 24: Wait for choropleth form to show Value Field (means layer binding propagated)
		await expect(page.locator('label:has-text("Value Field") select')).toBeVisible({
			timeout: 10000
		});

		// Step 25: Set Value Field to "Lohnsteuer/EW"
		await page.locator('label:has-text("Value Field") select').selectOption('Lohnsteuer/EW');

		// Step 26: Set Color Scheme to "inferno"
		await page.locator('label:has-text("Color Scheme") select').selectOption('inferno');

		// Step 27: Set Min value to 30000
		await page.locator('label:has-text("Min") input[type="number"]').fill('30000');

		// Step 28: Set Max value to 50000
		await page.locator('label:has-text("Max") input[type="number"]').fill('50000');

		// Step 29: Wait for Export button to be enabled (canExport should be true now)
		await expect(page.getByRole('button', { name: 'Export Map' })).toBeEnabled({ timeout: 10000 });

		// Step 30: Click "Export Map" button
		await page.getByRole('button', { name: 'Export Map' }).click();

		// Step 31: FileSaver dialog should appear with default filename
		await expect(page.getByRole('heading', { name: 'Export Choropleth Map' })).toBeVisible();

		// The filename input should have "choropleth-export" as default
		await expect(page.locator('input[type="text"]').first()).toHaveValue('choropleth-export');

		// Step 32: Click Save
		await page.getByRole('button', { name: 'Save' }).click();

		// Step 33: If a "Replace" button appears (folder exists), click it
		replaceButton = page.getByRole('button', { name: 'Replace' });
		if (await replaceButton.isVisible({ timeout: 1000 }).catch(() => false)) {
			await replaceButton.click();
		}

		// Step 34: Wait for export progress dialog to appear and complete
		await expect(page.getByRole('heading', { name: 'Exporting Map' })).toBeVisible();

		// Wait for export to complete (dialog disappears)
		await expect(page.getByRole('heading', { name: 'Exporting Map' })).not.toBeVisible({
			timeout: 120000
		});

		// Verify: All expected export files were created
		const filesAfterExport = listFiles(DATA_DIR);
		for (const expectedFile of EXPECTED_EXPORT_FILES) {
			expect(filesAfterExport, `Expected file ${expectedFile} to exist after export`).toContain(
				expectedFile
			);
		}

		// Final verification: List all files created during the workflow
		const allExpectedFiles = [
			...EXPECTED_DOWNLOADED_FILES,
			EXPECTED_CONVERTED_FILE,
			...EXPECTED_EXPORT_FILES
		];
		for (const expectedFile of allExpectedFiles) {
			expect(filesAfterExport, `Final check: ${expectedFile} should exist`).toContain(expectedFile);
		}
	});
});
