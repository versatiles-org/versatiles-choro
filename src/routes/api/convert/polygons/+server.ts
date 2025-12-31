import type { RequestHandler } from './$types';
import { resolve_data } from '$lib/server/filesystem/filesystem';
import { convertPolygonsToVersatiles } from '$lib/server/convert/geometry';
import * as v from 'valibot';
import { ConvertPolygonsRequest } from '$lib/api/requests';
import { progressToStream } from '$lib/server/progress';
import { errorToResponse, logError } from '$lib/server/errors/index.js';

export const POST: RequestHandler = async ({ request, route }) => {
	try {
		const { input, output } = v.parse(ConvertPolygonsRequest, await request.json());
		const progress = convertPolygonsToVersatiles(resolve_data(input), resolve_data(output));
		return progressToStream(progress, request.signal);
	} catch (error) {
		logError(error, `API:${route.id}`);
		return errorToResponse(error);
	}
};
