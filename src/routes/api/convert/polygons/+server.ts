import type { RequestHandler } from './$types';
import { resolveDataPath } from '#lib/server/filesystem/filesystem.js';
import { convertPolygonsToVersatiles } from '#lib/server/convert/geometry.js';
import * as v from 'valibot';
import { ConvertPolygonsRequest } from '#lib/api/schemas/index.js';
import { progressToStream } from '#lib/server/progress/index.js';
import { withErrorHandling } from '#lib/server/errors/handler.js';

export const POST: RequestHandler = withErrorHandling(async ({ request }) => {
	const { input, output } = v.parse(ConvertPolygonsRequest, await request.json());
	const progress = convertPolygonsToVersatiles(resolveDataPath(input), resolveDataPath(output));
	return progressToStream(progress, request.signal);
});
