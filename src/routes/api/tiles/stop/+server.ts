import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import { TilesStopRequest } from '$lib/api/requests';
import { removeTileSource } from '$lib/server/tiles/serve';
import { withErrorHandling } from '$lib/server/errors/handler.js';

export const POST: RequestHandler = withErrorHandling(async ({ request }) => {
	const { id } = v.parse(TilesStopRequest, await request.json());
	const removed = await removeTileSource(id);
	return json({ success: removed });
});
