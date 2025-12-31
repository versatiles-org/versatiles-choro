import type { RequestHandler } from './$types';
import { progressToStream } from '$lib/server/progress';
import { resolve_data } from '$lib/server/filesystem/filesystem';
import { downloadTestData } from '$lib/server/download/test-data';
import { mkdir } from 'fs/promises';
import { errorToResponse, logError } from '$lib/server/errors/index.js';

export const POST: RequestHandler = async ({ request, route }) => {
	try {
		const folder = resolve_data('/test-data');
		await mkdir(folder, { recursive: true });
		const progress = downloadTestData(folder);
		return progressToStream(progress, request.signal);
	} catch (error) {
		logError(error, `API:${route.id}`);
		return errorToResponse(error);
	}
};
