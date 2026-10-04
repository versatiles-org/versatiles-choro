import type { RequestHandler } from './$types';
import * as v from 'valibot';
import { TilesStopRequest } from '#lib/api/schemas/index.js';
import { removeTileSource } from '#lib/server/tiles/serve.js';
import { withErrorHandling } from '#lib/server/errors/handler.js';

export const POST: RequestHandler = withErrorHandling(async ({ request }) => {
	const { id } = v.parse(TilesStopRequest, await request.json());
	const removed = await removeTileSource(id);
	return Response.json({ success: removed });
});
