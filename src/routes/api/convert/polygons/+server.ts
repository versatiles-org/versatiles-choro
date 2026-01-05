import type { RequestHandler } from './$types';
import { resolve_data } from '$lib/server/filesystem/filesystem';
import { convertPolygonsToVersatiles } from '$lib/server/convert/geometry';
import * as v from 'valibot';
import { ConvertPolygonsRequest } from '$lib/api/schemas';
import { progressToStream } from '$lib/server/progress';
import { withErrorHandling } from '$lib/server/errors/handler.js';

export const POST: RequestHandler = withErrorHandling(async ({ request }) => {
	const { input, output } = v.parse(ConvertPolygonsRequest, await request.json());
	const progress = convertPolygonsToVersatiles(resolve_data(input), resolve_data(output));
	return progressToStream(progress, request.signal);
});
