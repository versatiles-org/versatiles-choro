import type { RequestHandler } from './$types';
import { progressToStream } from '$lib/server/progress';
import { resolve_data } from '$lib/server/filesystem/filesystem';
import { downloadTestData } from '$lib/server/download/test-data';
import { mkdir } from 'fs/promises';

export const POST: RequestHandler = async ({ request }) => {
	const folder = resolve_data('/test-data');
	await mkdir(folder, { recursive: true });
	const progress = downloadTestData(folder);
	return progressToStream(progress, request.signal);
};
