import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import { TilesStopRequest } from '$lib/api/requests';
import { stopTileServer } from '$lib/server/tiles/serve';
import { withErrorHandling } from '$lib/server/errors/handler.js';

export const POST: RequestHandler = withErrorHandling(async ({ request }) => {
	const { id } = v.parse(TilesStopRequest, await request.json());
	await stopTileServer(id);
	return json({ success: true });
});
