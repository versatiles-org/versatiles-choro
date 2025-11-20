import type { TilesInitRequest, TilesInitResponse } from '$lib/api/types.js';
import { writeFileSync } from 'fs';
import { runVersaTilesServer } from '$lib/server/spawn/spawn.js';
import * as v from 'valibot';
import { resolve } from 'path';
import { TEMP_PATH } from '$lib/filesystem/filesystem.server.js';

const ports = new Set<number>();
const MIN_PORT = 51001;
const MAX_PORT = 52000;
let port = MIN_PORT;

export async function startTileServer(
	params: v.InferOutput<typeof TilesInitRequest>
): Promise<v.InferOutput<typeof TilesInitResponse>> {
	while (ports.has(port)) {
		port++;
		if (port > MAX_PORT) port = MIN_PORT;
	}
	ports.add(port);

	const vpl = [`from_container="${params.input}"`].join('\n   | ');

	const tempFile = resolve(TEMP_PATH, `${port}.vpl`);
	writeFileSync(tempFile, vpl);

	runVersaTilesServer(tempFile, port);

	// wait until there is a response at `http://localhost:${port}/tiles/index.json`
	await new Promise<void>((resolve) => {
		const url = `http://localhost:${port}/tiles/index.json`;
		const interval = setInterval(async () => {
			try {
				const res = await fetch(url);
				if (res.ok) {
					clearInterval(interval);
					resolve();
				}
			} catch (_) {
				// Ignore connection errors (ECONNREFUSED, timeouts, etc.) and retry
			}
		}, 100);
	});

	return { id: String(port) };
}
