import type { RequestHandler } from './$types';
import { startTileServer } from '$lib/server/tiles/serve';
import { parse } from 'valibot';
import { TilesInitRequest } from '$lib/api/requests';
import { errorToResponse, logError } from '$lib/server/errors/index.js';

export const POST: RequestHandler = async ({ request, route }) => {
	try {
		const params = parse(TilesInitRequest, await request.json());
		const response = await startTileServer(params);
		return new Response(JSON.stringify(response), { status: 200 });
	} catch (error) {
		logError(error, `API:${route.id}`);
		return errorToResponse(error);
	}
};
