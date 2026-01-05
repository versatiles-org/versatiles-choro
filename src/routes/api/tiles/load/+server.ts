import { TilesLoadRequest } from '$lib/api/schemas';
import { getTileServerPort } from '$lib/server/tiles/serve';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import { withErrorHandling } from '$lib/server/errors/handler.js';

export const GET: RequestHandler = withErrorHandling(async ({ request }) => {
	const params = new URL(request.url).searchParams;
	const { id, path } = v.parse(TilesLoadRequest, {
		id: params.get('id'),
		path: params.get('path')
	});

	// Get the fixed port of the global TileServer
	const port = getTileServerPort();

	// Construct correct URL: /tiles/{name}/{z}/{x}/{y}
	const url = `http://localhost:${port}/tiles/${id}/${path}`;

	// Fetch from internal server
	const response = await fetch(url, { method: 'GET' });

	if (!response.ok) {
		return new Response(`Tile not found for path=${path}`, { status: 404 });
	}

	// Return tile with proper headers
	const buffer = await response.bytes();

	return new Response(buffer, {
		status: response.status,
		headers: {
			'content-type': response.headers.get('content-type') || 'application/octet-stream',
			'cache-control': 'private, max-age=0, must-revalidate',
			expires: new Date().toUTCString(),
			'content-length': String(buffer.length)
		}
	});
});
