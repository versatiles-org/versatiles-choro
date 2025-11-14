import type { RequestHandler } from './$types';
import { engine } from '$lib/server/progress';
import { resolve } from '$lib/filesystem/filesystem.server';

export const GET: RequestHandler = async ({ request }) => {
	const file = new URL(request.url).searchParams.get('file');

	if (typeof file !== 'string') {
		return new Response('Invalid file parameter', { status: 400 });
	}

	const { port } = await engine.startTileServer(resolve(file));
	return new Response(JSON.stringify({ port }), { status: 200 });
};
