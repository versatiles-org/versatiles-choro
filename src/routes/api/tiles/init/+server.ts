import type { RequestHandler } from './$types';
import { startTileServer } from '$lib/server/tiles/serve';
import { parse } from 'valibot';
import { TilesInitRequest } from '$lib/api/types';

export const POST: RequestHandler = async ({ request }) => {
	const params = parse(TilesInitRequest, await request.json());
	const response = await startTileServer(params);
	return new Response(JSON.stringify(response), { status: 200 });
};
