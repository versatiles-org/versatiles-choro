import type { RequestHandler } from "../$types";

export const GET: RequestHandler = async ({ request }) => {
	const params = new URL(request.url).searchParams;
	const port = params.get('port');
	const path = params.get('path');

	if (typeof port !== 'string' || typeof path !== 'string') {
		return new Response('Invalid port or path parameter', { status: 400 });
	}

	const url = `http://localhost:${port}/tiles/${port}/${path}`;
	const newRequest = new Request(url, {
		method: 'GET',

	});

	request.headers.forEach((value, key) => {
		if (key.toLowerCase() === 'host') return; // Skip host header
		newRequest.headers.set(key, value);
	});

	let response = await fetch(newRequest);
	let buffer = await response.bytes();

	return new Response(buffer, {
		status: response.status,
		headers: {
			'content-type': response.headers.get('content-type') || 'application/octet-stream',
			'cache-control': 'no-cache',
			'content-length': String(buffer.length),
		}
	});
};
