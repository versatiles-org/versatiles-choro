import type { RequestHandler } from './$types';
import { resolve } from '$lib/filesystem/filesystem.server';
import { startTileServer } from '$lib/server/tiles/serve';
import * as v from 'valibot';
import { TilesInitRequest, TilesInitResponse } from '$lib/api/types';

export const POST: RequestHandler = async ({ request }) => {
	const { input } = v.parse(TilesInitRequest, await request.json());
	const response = await startTileServer(resolve(input));
	v.assert(TilesInitResponse, response);
	return new Response(JSON.stringify(response), { status: 200 });
};
