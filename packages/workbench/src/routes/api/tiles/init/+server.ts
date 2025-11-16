import type { RequestHandler } from './$types';
import { resolve } from '$lib/filesystem/filesystem.server';
import { startTileServer } from '$lib/engine/tiles/serve';

export const GET: RequestHandler = async ({ request }) => {
	const file = new URL(request.url).searchParams.get('file');

	if (typeof file !== 'string') {
		return new Response(`Invalid file parameter "${file}"`, { status: 400 });
	}

	const { port } = await startTileServer(resolve(file));
	return new Response(JSON.stringify({ id: port }), { status: 200 });
};
