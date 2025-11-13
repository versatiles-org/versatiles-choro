import type { RequestHandler } from './$types';
import { engine, progressToStream } from '$lib/server/progress';
import { resolve } from '$lib/filesystem/filesystem.server';

export const POST: RequestHandler = async ({ request }) => {
	const params = await request.json();
	const input = params.input;
	const output = params.output;

	if (typeof input !== 'string' || typeof output !== 'string') {
		return new Response('Invalid input or output parameter', { status: 400 });
	}

	const progress = engine.convertPolygonsToVersatiles(resolve(input), resolve(output));
	return progressToStream(progress, request.signal);
};
