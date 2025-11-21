import type { RequestHandler } from './$types';
import { progressToStream } from '$lib/server/progress';
import { resolve } from '$lib/server/filesystem/filesystem';
import { downloadTestData } from '$lib/server/download/test-data';
import { mkdir } from 'fs/promises';

export const POST: RequestHandler = async ({ request }) => {
	const folder = resolve('/test-data');
	await mkdir(folder, { recursive: true });
	const progress = downloadTestData(folder);
	return progressToStream(progress, request.signal);
};
