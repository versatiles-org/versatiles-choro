import { TileServer, TileSource } from '@versatiles/versatiles-rs';
import { randomUUID } from 'crypto';
import type * as v from 'valibot';
import { buildVPL } from './vpl';
import { loggers } from '../logger/index.js';
import type { VPLParam } from '$lib/api/vpl';

// Singleton TileServer instance
let globalServer: TileServer | null = null;

// Track active tile sources by name
const tileSources = new Map<string, TileSource>();

// Lazy initialization promise to ensure single initialization
let initPromise: Promise<void> | null = null;

const PORT = 8080;

/**
 * Initialize the global TileServer (called once at app startup or lazily on first use)
 */
async function initializeTileServer(): Promise<void> {
	if (globalServer) {
		loggers.tiles.warn('TileServer already initialized');
		return;
	}

	loggers.tiles.info('Initializing TileServer');

	globalServer = new TileServer({
		ip: '127.0.0.1', // Localhost only for security
		port: PORT,
		minimalRecompression: true
	});

	await globalServer.start();

	if (globalServer.port !== PORT) {
		throw new Error(
			`Failed to bind TileServer to port ${PORT}, got port ${globalServer.port} instead`
		);
	}

	loggers.tiles.info('TileServer started');
}

/**
 * Ensure TileServer is initialized (lazy initialization)
 */
async function ensureInitialized(): Promise<void> {
	if (globalServer) return;
	if (!initPromise) {
		initPromise = initializeTileServer();
		await initPromise;
	}
}

/**
 * Get the global TileServer instance
 */
function getTileServer(): TileServer {
	if (!globalServer) {
		throw new Error('TileServer not initialized. Call ensureInitialized() first.');
	}
	return globalServer;
}

/**
 * Add a new tile source from VPL parameters
 * Returns the unique name for accessing this tile source
 */
export async function addTileSource(vpl: v.InferOutput<typeof VPLParam>): Promise<string> {
	await ensureInitialized();

	const server = getTileServer();
	const name = randomUUID();

	try {
		// Build VPL string from parameters
		const vplString = buildVPL(vpl);

		// Validate VPL
		if (!vplString.trim()) {
			throw new Error('VPL string is empty');
		}

		loggers.tiles.info({ name, vpl: vplString }, 'Adding tile source');

		// Create TileSource from VPL (no temp file needed!)
		const source = await TileSource.fromVpl(vplString);

		// Add to server
		await server.addTileSource(name, source);

		// Track in registry
		tileSources.set(name, source);

		loggers.tiles.info({ name }, 'Tile source added successfully');

		return name;
	} catch (error) {
		loggers.tiles.error({ name, error }, 'Failed to add tile source');
		throw new Error(
			`Failed to create tile source: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Remove a tile source by name
 */
export async function removeTileSource(name: string): Promise<boolean> {
	await ensureInitialized();

	const server = getTileServer();

	try {
		loggers.tiles.info({ name }, 'Removing tile source');

		// Remove from server
		const removed = await server.removeTileSource(name);

		if (removed) {
			tileSources.delete(name);
			loggers.tiles.info({ name }, 'Tile source removed successfully');
		} else {
			loggers.tiles.warn({ name }, 'Tile source not found');
		}

		return removed;
	} catch (error) {
		loggers.tiles.error({ name, error }, 'Failed to remove tile source');
		throw error;
	}
}

/**
 * Get the port of the global TileServer
 */
export function getTileServerPort(): number {
	return PORT;
}

/**
 * Shutdown the global TileServer (cleanup)
 */
export async function shutdownTileServer(): Promise<void> {
	if (!globalServer) return;

	loggers.tiles.info('Shutting down TileServer');

	// Clear all tile sources
	tileSources.clear();

	// Stop server
	await globalServer.stop();
	globalServer = null;
	initPromise = null;

	loggers.tiles.info('TileServer shut down');
}
