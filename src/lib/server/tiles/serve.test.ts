import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { addTileSource, removeTileSource, getTileServerPort, shutdownTileServer } from './serve';

// Mock @versatiles/versatiles-rs
const mockTileServer = {
	start: vi.fn(),
	stop: vi.fn(),
	addTileSource: vi.fn(),
	removeTileSource: vi.fn(),
	port: 8080
};

const mockTileSource = {
	getTileJson: vi.fn(() => ({ tiles: ['http://example.com/{z}/{x}/{y}'] }))
};

vi.mock('@versatiles/versatiles-rs', () => ({
	TileServer: vi.fn(function () {
		return mockTileServer;
	}),
	TileSource: {
		fromVpl: vi.fn(async () => mockTileSource)
	}
}));

// Mock buildVPL
vi.mock('./vpl', () => ({
	buildVPL: vi.fn((vpl) => {
		if (vpl.from_container) {
			return `from_container("${vpl.from_container.filename}")`;
		}
		return 'vpl_pipeline';
	})
}));

// Mock logger
vi.mock('../logger/index.js', () => ({
	loggers: {
		tiles: {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn()
		}
	}
}));

describe('Tile Server Management', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset mock implementations to default behavior
		mockTileServer.start.mockResolvedValue(undefined);
		mockTileServer.stop.mockResolvedValue(undefined);
		mockTileServer.addTileSource.mockResolvedValue(undefined);
		mockTileServer.removeTileSource.mockResolvedValue(true);
		mockTileServer.port = 8080;
	});

	afterEach(async () => {
		// Clean up server instance after each test
		await shutdownTileServer();
	});

	describe('getTileServerPort', () => {
		it('returns the correct port', () => {
			expect(getTileServerPort()).toBe(8080);
		});
	});

	describe('addTileSource', () => {
		it('initializes tile server on first use', async () => {
			const vpl = {
				from_container: { filename: 'test.versatiles' }
			};

			await addTileSource(vpl);

			expect(mockTileServer.start).toHaveBeenCalledOnce();
		});

		it('adds tile source and returns UUID', async () => {
			const vpl = {
				from_container: { filename: 'test.versatiles' }
			};

			const name = await addTileSource(vpl);

			expect(name).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
			expect(mockTileServer.addTileSource).toHaveBeenCalledWith(name, mockTileSource);
		});

		it('builds VPL string from parameters', async () => {
			const { buildVPL } = await import('./vpl');
			const vpl = {
				from_container: { filename: 'test.versatiles' }
			};

			await addTileSource(vpl);

			expect(buildVPL).toHaveBeenCalledWith(vpl);
		});

		it('creates TileSource from VPL string', async () => {
			const { TileSource } = await import('@versatiles/versatiles-rs');
			const vpl = {
				from_container: { filename: 'test.versatiles' }
			};

			await addTileSource(vpl);

			expect(TileSource.fromVpl).toHaveBeenCalledWith('from_container("test.versatiles")');
		});

		it('does not reinitialize server on subsequent calls', async () => {
			const vpl1 = { from_container: { filename: 'test1.versatiles' } };
			const vpl2 = { from_container: { filename: 'test2.versatiles' } };

			await addTileSource(vpl1);
			await addTileSource(vpl2);

			// start() should only be called once
			expect(mockTileServer.start).toHaveBeenCalledOnce();
		});

		it('throws error if VPL string is empty', async () => {
			const { buildVPL } = await import('./vpl');
			vi.mocked(buildVPL).mockReturnValueOnce('   '); // Empty/whitespace string

			const vpl = { from_container: { filename: 'test.versatiles' } };

			await expect(addTileSource(vpl)).rejects.toThrow('VPL string is empty');
		});

		it('throws error if TileSource creation fails', async () => {
			const { TileSource } = await import('@versatiles/versatiles-rs');
			vi.mocked(TileSource.fromVpl).mockRejectedValueOnce(new Error('Invalid VPL'));

			const vpl = { from_container: { filename: 'test.versatiles' } };

			await expect(addTileSource(vpl)).rejects.toThrow('Failed to create tile source: Invalid VPL');
		});

		it('handles non-Error objects in catch block', async () => {
			const { TileSource } = await import('@versatiles/versatiles-rs');
			vi.mocked(TileSource.fromVpl).mockRejectedValueOnce('string error');

			const vpl = { from_container: { filename: 'test.versatiles' } };

			await expect(addTileSource(vpl)).rejects.toThrow(
				'Failed to create tile source: Unknown error'
			);
		});

		it('initializes only once when called concurrently', async () => {
			const vpl1 = { from_container: { filename: 'test1.versatiles' } };
			const vpl2 = { from_container: { filename: 'test2.versatiles' } };

			// Call addTileSource concurrently
			await Promise.all([addTileSource(vpl1), addTileSource(vpl2)]);

			// start() should only be called once despite concurrent initialization
			expect(mockTileServer.start).toHaveBeenCalledOnce();
		});
	});

	describe('removeTileSource', () => {
		it('removes existing tile source', async () => {
			// First add a source
			const vpl = { from_container: { filename: 'test.versatiles' } };
			const name = await addTileSource(vpl);

			// Mock successful removal
			mockTileServer.removeTileSource.mockResolvedValueOnce(true);

			// Then remove it
			const removed = await removeTileSource(name);

			expect(removed).toBe(true);
			expect(mockTileServer.removeTileSource).toHaveBeenCalledWith(name);
		});

		it('returns false for non-existent tile source', async () => {
			// Initialize server first
			const vpl = { from_container: { filename: 'test.versatiles' } };
			await addTileSource(vpl);

			// Mock failed removal
			mockTileServer.removeTileSource.mockResolvedValueOnce(false);

			const removed = await removeTileSource('non-existent-uuid');

			expect(removed).toBe(false);
		});

		it('throws error if removal fails', async () => {
			// Initialize server first
			const vpl = { from_container: { filename: 'test.versatiles' } };
			await addTileSource(vpl);

			// Mock error during removal
			const removalError = new Error('Removal failed');
			mockTileServer.removeTileSource.mockRejectedValueOnce(removalError);

			await expect(removeTileSource('some-uuid')).rejects.toThrow(removalError);
		});

		it('initializes server if not already initialized', async () => {
			// Don't add a source first - removeTileSource should initialize the server
			mockTileServer.removeTileSource.mockResolvedValueOnce(false);

			await removeTileSource('some-uuid');

			expect(mockTileServer.start).toHaveBeenCalled();
		});
	});

	describe('shutdownTileServer', () => {
		it('shuts down initialized server', async () => {
			// Initialize server by adding a source
			const vpl = { from_container: { filename: 'test.versatiles' } };
			await addTileSource(vpl);

			await shutdownTileServer();

			expect(mockTileServer.stop).toHaveBeenCalledOnce();
		});

		it('does nothing if server is not initialized', async () => {
			await shutdownTileServer();

			expect(mockTileServer.stop).not.toHaveBeenCalled();
		});

		it('clears all tile sources on shutdown', async () => {
			const vpl1 = { from_container: { filename: 'test1.versatiles' } };
			const vpl2 = { from_container: { filename: 'test2.versatiles' } };

			await addTileSource(vpl1);
			await addTileSource(vpl2);

			await shutdownTileServer();

			// After shutdown, the server should be reinitialized on next use
			await addTileSource(vpl1);

			// start() should be called twice: once for initial, once after shutdown
			expect(mockTileServer.start).toHaveBeenCalledTimes(2);
		});
	});

	describe('logging', () => {
		it('logs tile source addition', async () => {
			const { loggers } = await import('../logger/index.js');
			const vpl = { from_container: { filename: 'test.versatiles' } };

			const name = await addTileSource(vpl);

			expect(loggers.tiles.info).toHaveBeenCalledWith(
				{ name, vpl: 'from_container("test.versatiles")' },
				'Adding tile source'
			);
			expect(loggers.tiles.info).toHaveBeenCalledWith({ name }, 'Tile source added successfully');
		});

		it('logs errors during tile source addition', async () => {
			const { loggers } = await import('../logger/index.js');
			const { TileSource } = await import('@versatiles/versatiles-rs');

			const error = new Error('VPL error');
			vi.mocked(TileSource.fromVpl).mockRejectedValueOnce(error);

			const vpl = { from_container: { filename: 'test.versatiles' } };

			await expect(addTileSource(vpl)).rejects.toThrow();

			expect(loggers.tiles.error).toHaveBeenCalledWith(
				expect.objectContaining({ error }),
				'Failed to add tile source'
			);
		});

		it('logs tile source removal', async () => {
			const { loggers } = await import('../logger/index.js');
			const vpl = { from_container: { filename: 'test.versatiles' } };

			const name = await addTileSource(vpl);

			vi.clearAllMocks();
			mockTileServer.removeTileSource.mockResolvedValueOnce(true);

			await removeTileSource(name);

			expect(loggers.tiles.info).toHaveBeenCalledWith({ name }, 'Removing tile source');
			expect(loggers.tiles.info).toHaveBeenCalledWith({ name }, 'Tile source removed successfully');
		});

		it('logs warning when tile source not found', async () => {
			const { loggers } = await import('../logger/index.js');
			const vpl = { from_container: { filename: 'test.versatiles' } };

			await addTileSource(vpl);

			vi.clearAllMocks();
			mockTileServer.removeTileSource.mockResolvedValueOnce(false);

			await removeTileSource('non-existent');

			expect(loggers.tiles.warn).toHaveBeenCalledWith(
				{ name: 'non-existent' },
				'Tile source not found'
			);
		});

		it('logs server initialization', async () => {
			const { loggers } = await import('../logger/index.js');
			const vpl = { from_container: { filename: 'test.versatiles' } };

			await addTileSource(vpl);

			expect(loggers.tiles.info).toHaveBeenCalledWith('Initializing TileServer');
			expect(loggers.tiles.info).toHaveBeenCalledWith('TileServer started');
		});

		it('logs server shutdown', async () => {
			const { loggers } = await import('../logger/index.js');
			const vpl = { from_container: { filename: 'test.versatiles' } };

			await addTileSource(vpl);

			vi.clearAllMocks();

			await shutdownTileServer();

			expect(loggers.tiles.info).toHaveBeenCalledWith('Shutting down TileServer');
			expect(loggers.tiles.info).toHaveBeenCalledWith('TileServer shut down');
		});
	});
});
