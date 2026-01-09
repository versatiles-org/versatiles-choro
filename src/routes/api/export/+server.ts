import type { RequestHandler } from './$types';
import * as v from 'valibot';
import { ExportRequest } from '$lib/api/schemas';
import { withErrorHandling } from '$lib/server/errors/handler.js';
import { resolveDataPath } from '$lib/server/filesystem/filesystem';
import { convertTiles } from '$lib/server/convert/tiles';
import { generateConfig } from '$lib/export/generate-config';
import { INDEX_HTML_TEMPLATE } from '$lib/export/templates';
import { mkdir, writeFile, copyFile, access } from 'fs/promises';
import { join } from 'path';
import { ConcatenatedProgress, SimpleProgress, progressToStream } from '$lib/server/progress';

export const POST: RequestHandler = withErrorHandling(async ({ request }) => {
	const params = v.parse(ExportRequest, await request.json());

	// Resolve output path (within data directory)
	const outputDir = resolveDataPath(params.outputPath);

	// Create progress that handles all export steps
	const exportProgress = new ConcatenatedProgress([
		// 1. Create output directory
		() =>
			new SimpleProgress(async () => {
				await mkdir(outputDir, { recursive: true });
			}, 'Creating output directory'),

		// 2. Export overlay.versatiles using convertTiles (main work)
		() => convertTiles(params.vpl, join(outputDir, 'overlay.versatiles')),

		// 3. Generate and write config.json
		() =>
			new SimpleProgress(async () => {
				const config = generateConfig({
					overlaySourceFile: 'overlay.versatiles',
					layerName: params.layerName,
					tilejson: params.tilejson,
					choropleth: params.choropleth,
					backgroundStyle: params.backgroundStyle
				});
				await writeFile(join(outputDir, 'config.json'), JSON.stringify(config, null, 2));
			}, 'Writing config.json'),

		// 4. Copy choro-lib.js from build output
		() =>
			new SimpleProgress(async () => {
				const choroLibSource = join(process.cwd(), 'build-lib', 'choro-lib.js');
				try {
					await access(choroLibSource);
					await copyFile(choroLibSource, join(outputDir, 'choro-lib.js'));
				} catch {
					throw new Error(
						'choro-lib.js not found. Please run "npm run build-lib" first to build the library.'
					);
				}
			}, 'Copying choro-lib.js'),

		// 5. Write index.html from embedded template
		() =>
			new SimpleProgress(async () => {
				await writeFile(join(outputDir, 'index.html'), INDEX_HTML_TEMPLATE);
			}, 'Writing index.html')
	]);

	return progressToStream(exportProgress, request.signal);
});
