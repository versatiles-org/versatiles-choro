import type { TilesInitRequest, TilesInitResponse } from '$lib/api/requests.js';
import { writeFile, unlink } from 'fs/promises';
import { TileServer } from '@versatiles/versatiles-rs';
import { randomUUID } from 'crypto';
import * as v from 'valibot';
import { resolve_temp } from '$lib/server/filesystem/filesystem.js';
import { buildVPL } from './vpl';
import { loggers } from '../logger/index.js';

// Store server instances instead of just ports
const servers = new Map<string, { server: TileServer; tempFile: string }>();
const MIN_PORT = 51001;
const MAX_PORT = 52000;
let nextPort = MIN_PORT;

async function allocatePort(): Promise<number> {
	const usedPorts = new Set(
		await Promise.all(Array.from(servers.values()).map(async (s) => await s.server.port))
	);

	while (usedPorts.has(nextPort)) {
		nextPort++;
		if (nextPort > MAX_PORT) nextPort = MIN_PORT;
	}

	return nextPort++;
}

export async function startTileServer(
	params: v.InferOutput<typeof TilesInitRequest>
): Promise<v.InferOutput<typeof TilesInitResponse>> {
	const port = await allocatePort();
	const id = randomUUID();

	// Create TileServer instance
	const server = new TileServer({
		ip: '127.0.0.1',
		port,
		minimalRecompression: true
	});

	// Write VPL temp file
	const tempFile = resolve_temp(`${id}.vpl`);
	await writeFile(tempFile, buildVPL(params.vpl));

	loggers.tiles.info({ id, port, tempFile }, 'Starting VersaTiles server');

	// Add tile source from VPL file
	await server.addTileSourceFromPath('tiles', tempFile);

	// Start server (this is async and waits for readiness - no polling needed!)
	await server.start();

	// Store server instance for cleanup later
	servers.set(id, { server, tempFile });

	loggers.tiles.info({ id, port }, 'VersaTiles server ready');

	return { id };
}

export async function stopTileServer(id: string): Promise<void> {
	const entry = servers.get(id);
	if (!entry) {
		throw new Error(`Server ${id} not found`);
	}

	loggers.tiles.info({ id }, 'Stopping VersaTiles server');

	// Stop server
	await entry.server.stop();

	// Clean up temp file
	await unlink(entry.tempFile).catch(() => {
		// Ignore errors if file already deleted
	});

	servers.delete(id);

	loggers.tiles.info({ id }, 'VersaTiles server stopped');
}
