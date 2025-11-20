import type { RequestHandler } from './$types';
import { progressToStream } from '$lib/server/progress';
import { resolve } from '$lib/filesystem/filesystem.server';
import { convertPolygonsToVersatiles } from '$lib/server/geometry/convert';
import * as v from 'valibot';
import { ConvertPolygonsRequest } from '$lib/api/types';

export const POST: RequestHandler = async ({ request }) => {
	const { input, output } = v.parse(ConvertPolygonsRequest, await request.json());
	const progress = convertPolygonsToVersatiles(resolve(input), resolve(output));
	return progressToStream(progress, request.signal);
};
