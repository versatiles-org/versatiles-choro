import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertPolygonsToVersatiles } from './geometry';
import { ConcatenatedProgress } from '../progress/concatenate';
import { SimpleProgress } from '../progress/simple';

// Mock the spawn module
vi.mock('../spawn/spawn', () => ({
	runTippecanoe: vi.fn(),
	runVersaTilesConvert: vi.fn()
}));

// Mock the utils module
vi.mock('./utils.js', () => ({
	validateOutputExtension: vi.fn(),
	safeDelete: vi.fn()
}));

import { runTippecanoe, runVersaTilesConvert } from '../spawn/spawn';
import { validateOutputExtension, safeDelete } from './utils.js';

describe('convertPolygonsToVersatiles', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('validates output extension', () => {
		const mockProgress = new SimpleProgress(async () => {});
		vi.mocked(runTippecanoe).mockResolvedValue(mockProgress);
		vi.mocked(runVersaTilesConvert).mockResolvedValue(mockProgress);

		convertPolygonsToVersatiles('input.geojson', 'output.versatiles');

		expect(validateOutputExtension).toHaveBeenCalledWith('output.versatiles', '.versatiles');
	});

	it('returns ConcatenatedProgress', () => {
		const mockProgress = new SimpleProgress(async () => {});
		vi.mocked(runTippecanoe).mockResolvedValue(mockProgress);
		vi.mocked(runVersaTilesConvert).mockResolvedValue(mockProgress);

		const progress = convertPolygonsToVersatiles('input.geojson', 'output.versatiles');

		expect(progress).toBeInstanceOf(ConcatenatedProgress);
	});

	it('creates intermediate mbtiles file', async () => {
		const mockProgress = new SimpleProgress(async () => {});
		vi.mocked(runTippecanoe).mockResolvedValue(mockProgress);
		vi.mocked(runVersaTilesConvert).mockResolvedValue(mockProgress);

		const progress = convertPolygonsToVersatiles('input.geojson', 'output.versatiles');

		// Wait for first step to execute
		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(runTippecanoe).toHaveBeenCalledWith('input.geojson', 'output.mbtiles', {
			force: true,
			'maximum-zoom': 'g'
		});
	});

	it('converts mbtiles to versatiles with brotli compression', async () => {
		const mockProgress = new SimpleProgress(async () => {});
		vi.mocked(runTippecanoe).mockResolvedValue(mockProgress);
		vi.mocked(runVersaTilesConvert).mockResolvedValue(mockProgress);

		const progress = convertPolygonsToVersatiles('input.geojson', 'output.versatiles');

		// Wait for steps to execute
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(runVersaTilesConvert).toHaveBeenCalledWith('output.mbtiles', 'output.versatiles', {
			compress: 'brotli'
		});
	});

	it('cleans up temporary mbtiles file', async () => {
		const mockProgress = new SimpleProgress(async () => {});
		vi.mocked(runTippecanoe).mockResolvedValue(mockProgress);
		vi.mocked(runVersaTilesConvert).mockResolvedValue(mockProgress);
		vi.mocked(safeDelete).mockResolvedValue(undefined);

		const progress = convertPolygonsToVersatiles('input.geojson', 'output.versatiles');

		// Wait for all steps to execute
		await new Promise((resolve) => setTimeout(resolve, 150));

		expect(safeDelete).toHaveBeenCalledWith('output.mbtiles');
	});

	it('handles custom output paths', async () => {
		const mockProgress = new SimpleProgress(async () => {});
		vi.mocked(runTippecanoe).mockResolvedValue(mockProgress);
		vi.mocked(runVersaTilesConvert).mockResolvedValue(mockProgress);

		convertPolygonsToVersatiles('data/input.geojson', 'tiles/custom.versatiles');

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(runTippecanoe).toHaveBeenCalledWith(
			'data/input.geojson',
			'tiles/custom.mbtiles',
			expect.any(Object)
		);
	});

	it('derives mbtiles filename from versatiles output', () => {
		const mockProgress = new SimpleProgress(async () => {});
		vi.mocked(runTippecanoe).mockResolvedValue(mockProgress);
		vi.mocked(runVersaTilesConvert).mockResolvedValue(mockProgress);

		convertPolygonsToVersatiles('input.geojson', '/path/to/myfile.versatiles');

		// The mbtiles file should be in the same directory with .mbtiles extension
		expect(runTippecanoe).toHaveBeenCalled();
		const mbtilesPath = vi.mocked(runTippecanoe).mock.calls[0][1];
		expect(mbtilesPath).toBe('/path/to/myfile.mbtiles');
	});

	it('uses force and maximum-zoom options for tippecanoe', async () => {
		const mockProgress = new SimpleProgress(async () => {});
		vi.mocked(runTippecanoe).mockResolvedValue(mockProgress);
		vi.mocked(runVersaTilesConvert).mockResolvedValue(mockProgress);

		convertPolygonsToVersatiles('input.geojson', 'output.versatiles');

		await new Promise((resolve) => setTimeout(resolve, 50));

		const options = vi.mocked(runTippecanoe).mock.calls[0][2];
		expect(options).toEqual({
			force: true,
			'maximum-zoom': 'g'
		});
	});

	it('uses brotli compression for versatiles conversion', async () => {
		const mockProgress = new SimpleProgress(async () => {});
		vi.mocked(runTippecanoe).mockResolvedValue(mockProgress);
		vi.mocked(runVersaTilesConvert).mockResolvedValue(mockProgress);

		convertPolygonsToVersatiles('input.geojson', 'output.versatiles');

		await new Promise((resolve) => setTimeout(resolve, 100));

		const options = vi.mocked(runVersaTilesConvert).mock.calls[0][2];
		expect(options).toEqual({
			compress: 'brotli'
		});
	});

	it('executes steps in correct order', async () => {
		const executionOrder: string[] = [];

		vi.mocked(runTippecanoe).mockImplementation(async () => {
			executionOrder.push('tippecanoe');
			return new SimpleProgress(async () => {});
		});

		vi.mocked(runVersaTilesConvert).mockImplementation(async () => {
			executionOrder.push('convert');
			return new SimpleProgress(async () => {});
		});

		vi.mocked(safeDelete).mockImplementation(async () => {
			executionOrder.push('cleanup');
		});

		convertPolygonsToVersatiles('input.geojson', 'output.versatiles');

		await new Promise((resolve) => setTimeout(resolve, 200));

		expect(executionOrder).toEqual(['tippecanoe', 'convert', 'cleanup']);
	});

});
