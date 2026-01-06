import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import * as v from 'valibot';
import { ExportRequest } from '$lib/api/schemas';
import { withErrorHandling } from '$lib/server/errors/handler.js';
import { resolveDataPath } from '$lib/server/filesystem/filesystem';
import { convertTiles } from '$lib/server/convert/tiles';
import { generateConfig } from '$lib/export/generate-config';
import { INDEX_HTML_TEMPLATE } from '$lib/export/templates';
import { mkdir, writeFile, copyFile, access } from 'fs/promises';
import { join } from 'path';

export const POST: RequestHandler = withErrorHandling(async ({ request }) => {
	const params = v.parse(ExportRequest, await request.json());

	// Resolve output path (within data directory)
	const outputDir = resolveDataPath(params.outputPath);

	// Create output directory
	await mkdir(outputDir, { recursive: true });

	// 1. Export overlay.versatiles using convertTiles
	const overlayPath = join(outputDir, 'overlay.versatiles');
	const progress = convertTiles(params.vpl, overlayPath);

	// Track errors from the conversion
	let conversionError: string | null = null;
	progress.onMessage((message, isError) => {
		if (isError) {
			conversionError = message;
		}
	});

	// Wait for the conversion to complete
	await progress.done();

	// Check if there was an error during conversion
	if (conversionError) {
		throw new Error(`Tile conversion failed: ${conversionError}`);
	}

	// 2. Generate and write config.json
	const config = generateConfig({
		overlaySourceFile: 'overlay.versatiles',
		layerName: params.layerName,
		tilejson: params.tilejson,
		choropleth: params.choropleth,
		backgroundStyle: params.backgroundStyle
	});
	await writeFile(join(outputDir, 'config.json'), JSON.stringify(config, null, 2));

	// 3. Copy choro-lib.js from build output
	const choroLibSource = join(process.cwd(), 'build-choro', 'choro-lib.js');
	try {
		await access(choroLibSource);
		await copyFile(choroLibSource, join(outputDir, 'choro-lib.js'));
	} catch {
		throw new Error(
			'choro-lib.js not found. Please run "npm run build-choro" first to build the library.'
		);
	}

	// 4. Write index.html from embedded template
	await writeFile(join(outputDir, 'index.html'), INDEX_HTML_TEMPLATE);

	return json({ success: true, outputPath: params.outputPath });
});
