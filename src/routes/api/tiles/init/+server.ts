import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { addTileSource } from '$lib/server/tiles/serve';
import * as v from 'valibot';
import { TilesInitRequest } from '$lib/api/requests';
import { withErrorHandling } from '$lib/server/errors/handler.js';

export const POST: RequestHandler = withErrorHandling(async ({ request }) => {
	const params = v.parse(TilesInitRequest, await request.json());
	console.log('Initializing tile source with params:', params);
	const id = await addTileSource(params.vpl);
	return json({ id });
});
