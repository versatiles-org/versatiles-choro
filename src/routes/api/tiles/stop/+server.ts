import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stopTileServer } from '$lib/server/tiles/serve';
import { logError } from '$lib/server/errors';

export const POST: RequestHandler = async ({ request, route }) => {
	try {
		const { id } = await request.json();
		await stopTileServer(id);
		return json({ success: true });
	} catch (error) {
		logError(error, `API:${route.id}`);
		return json({ error: String(error) }, { status: 500 });
	}
};
