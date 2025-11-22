import { TilesLoadRequest } from '$lib/api/requests';
import type { RequestHandler } from './$types';
import * as v from 'valibot';

export const GET: RequestHandler = async ({ request }) => {
	const params = new URL(request.url).searchParams;
	const { id, path } = v.parse(TilesLoadRequest, {
		id: params.get('id'),
		path: params.get('path')
	});

	// Proxy the request to the tile server
	const url = `http://localhost:${id}/tiles/${id}/${path}`;
	const newRequest = new Request(url, {
		method: 'GET'
	});

	request.headers.forEach((value, key) => {
		if (key.toLowerCase() === 'host') return; // Skip host header
		newRequest.headers.set(key, value);
	});

	const response = await fetch(newRequest);
	const buffer = await response.bytes();

	return new Response(buffer, {
		status: response.status,
		headers: {
			'content-type': response.headers.get('content-type') || 'application/octet-stream',
			'cache-control': 'no-cache',
			'content-length': String(buffer.length)
		}
	});
};
