import type { RequestHandler } from './$types';
import { startTileServer } from '$lib/server/tiles/serve';
import * as v from 'valibot';
import { TilesInitRequest, TilesInitResponse } from '$lib/api/types';

export const POST: RequestHandler = async ({ request }) => {
	const params = v.parse(TilesInitRequest, await request.json());
	const response = await startTileServer(params);
	v.assert(TilesInitResponse, response);
	return new Response(JSON.stringify(response), { status: 200 });
};
