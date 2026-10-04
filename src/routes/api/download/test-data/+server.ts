import type { RequestHandler } from './$types';
import { progressToStream } from '#lib/server/progress/index.js';
import { resolveDataPath } from '#lib/server/filesystem/filesystem.js';
import { downloadTestData } from '#lib/server/download/test-data.js';
import { mkdir } from 'fs/promises';
import { withErrorHandling } from '#lib/server/errors/handler.js';

export const POST: RequestHandler = withErrorHandling(async ({ request }) => {
	const folder = resolveDataPath('/test-data');
	await mkdir(folder, { recursive: true });
	const progress = downloadTestData(folder);
	return progressToStream(progress, request.signal);
});
