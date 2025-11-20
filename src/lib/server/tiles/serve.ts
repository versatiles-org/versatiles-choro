import type { TilesInitResponse } from '$lib/api/types.js';
import { runVersaTilesServer } from '../spawn/spawn.js';
import * as v from 'valibot';

const ports = new Set<number>();
const MIN_PORT = 51001;
const MAX_PORT = 52000;
let port = MIN_PORT;

export async function startTileServer(
	filename: string
): Promise<v.InferOutput<typeof TilesInitResponse>> {
	console.log(`Starting tile server for file ${filename}`);
	while (ports.has(port)) {
		port++;
		if (port > MAX_PORT) port = MIN_PORT;
	}
	ports.add(port);
	runVersaTilesServer(filename, port);

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
