import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { addTileSource, removeTileSource } from '$lib/server/tiles/serve';
import * as v from 'valibot';
import { TilesInitRequest } from '$lib/api/schemas';
import { withErrorHandling } from '$lib/server/errors/handler.js';

// Track pending cleanup timeouts to cancel if new request comes in for same old_id
const pendingCleanups = new Map<string, ReturnType<typeof setTimeout>>();

const CLEANUP_DELAY_MS = 2000;

export const POST: RequestHandler = withErrorHandling(async ({ request }) => {
	const params = v.parse(TilesInitRequest, await request.json());
	const id = await addTileSource(params.vpl);

	// Schedule cleanup of old tile source if provided
	if (params.old_id) {
		const oldId = params.old_id;

		// Cancel any existing pending cleanup for this old_id (handles rapid changes)
		const existingTimeout = pendingCleanups.get(oldId);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
		}

		// Schedule delayed cleanup
		const timeout = setTimeout(async () => {
			pendingCleanups.delete(oldId);
			try {
				await removeTileSource(oldId);
			} catch {
				// Cleanup is best-effort, don't throw
			}
		}, CLEANUP_DELAY_MS);

		pendingCleanups.set(oldId, timeout);
	}

	return json({ id });
});
