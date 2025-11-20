import type { RequestHandler } from './$types';
import { resolve } from '$lib/filesystem/filesystem.server';
import { startTileServer } from '$lib/server/tiles/serve';
import * as v from 'valibot';
import { TilesInitRequest, TilesInitResponse } from '$lib/api/types';

export const POST: RequestHandler = async ({ request }) => {
	const params = v.parse(TilesInitRequest, await request.json());
	params.input = resolve(params.input);
	if (params.update_properties) {
		params.update_properties.data_source_path = resolve(params.update_properties.data_source_path);
	}
	const response = await startTileServer(params);
	v.assert(TilesInitResponse, response);
	return new Response(JSON.stringify(response), { status: 200 });
};
