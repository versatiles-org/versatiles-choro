import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import * as v from 'valibot';
import { GetCSVFieldsRequest } from '$lib/api/schemas';
import { getCSVFieldNames } from '$lib/server/csv/fields';
import { resolveDataPath } from '$lib/server/filesystem/filesystem';
import { withErrorHandling } from '$lib/server/errors/handler.js';

export const POST: RequestHandler = withErrorHandling(async ({ request }) => {
	// Parse and validate request
	const { filePath } = v.parse(GetCSVFieldsRequest, await request.json());

	// Resolve path securely (prevents directory traversal)
	const absolutePath = resolveDataPath(filePath);

	// Get field names from CSV/TSV file
	const fields = getCSVFieldNames(absolutePath);

	// Return JSON response
	return json({ fields });
});
