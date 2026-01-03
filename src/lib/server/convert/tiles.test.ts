import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertTiles } from './tiles';
import { ConcatenatedProgress } from '../progress/concatenate';
import { SimpleProgress } from '../progress/simple';

// Mock fs/promises
vi.mock('fs/promises', () => ({
	mkdtemp: vi.fn(),
	writeFile: vi.fn()
}));

// Mock os
vi.mock('os', () => ({
	tmpdir: vi.fn()
}));

// Mock path
vi.mock('path', () => ({
	join: vi.fn((...args: string[]) => args.join('/'))
}));

// Mock spawn module
vi.mock('../spawn/spawn', () => ({
	runVersaTilesConvert: vi.fn()
}));

// Mock tiles/vpl module
vi.mock('../tiles/vpl', () => ({
	buildVPL: vi.fn()
}));

// Mock utils module
vi.mock('./utils.js', () => ({
	validateOutputExtension: vi.fn(),
	safeDelete: vi.fn()
}));

import { mkdtemp, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { runVersaTilesConvert } from '../spawn/spawn';
import { buildVPL } from '../tiles/vpl';
import { validateOutputExtension, safeDelete } from './utils.js';

describe('convertTiles', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(tmpdir).mockReturnValue('/tmp');
		vi.mocked(mkdtemp).mockResolvedValue('/tmp/versatiles-abc123');
		vi.mocked(buildVPL).mockReturnValue('VPL content');
		vi.mocked(writeFile).mockResolvedValue(undefined);
		vi.mocked(runVersaTilesConvert).mockResolvedValue(new SimpleProgress(async () => {}));
		vi.mocked(safeDelete).mockResolvedValue(undefined);
	});

	it('validates output extension', () => {
		const vpl = { from_container: { filename: 'input.versatiles' } };

		convertTiles(vpl, 'output.versatiles');

		expect(validateOutputExtension).toHaveBeenCalledWith('output.versatiles', '.versatiles');
	});

	it('returns ConcatenatedProgress', () => {
		const vpl = { from_container: { filename: 'input.versatiles' } };

		const progress = convertTiles(vpl, 'output.versatiles');

		expect(progress).toBeInstanceOf(ConcatenatedProgress);
	});

	it('creates temporary directory', async () => {
		const vpl = { from_container: { filename: 'input.versatiles' } };

		convertTiles(vpl, 'output.versatiles');

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(mkdtemp).toHaveBeenCalledWith('/tmp/versatiles-');
	});

	it('builds VPL file content', async () => {
		const vpl = {
			from_container: { filename: 'input.versatiles' },
			update_properties: {
				data_source_path: 'data.csv',
				layer_name: 'regions',
				id_field_tiles: 'id',
				id_field_data: 'data_id'
			}
		};

		convertTiles(vpl, 'output.versatiles');

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(buildVPL).toHaveBeenCalledWith(vpl);
	});

	it('writes VPL file to temporary directory', async () => {
		const vpl = { from_container: { filename: 'input.versatiles' } };

		convertTiles(vpl, 'output.versatiles');

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(writeFile).toHaveBeenCalledWith('/tmp/versatiles-abc123/tiles.vpl', 'VPL content');
	});

	it('runs versatiles convert with VPL file', async () => {
		const vpl = { from_container: { filename: 'input.versatiles' } };

		convertTiles(vpl, 'output.versatiles');

		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(runVersaTilesConvert).toHaveBeenCalledWith(
			'/tmp/versatiles-abc123/tiles.vpl',
			'output.versatiles'
		);
	});

	it('cleans up temporary VPL file', async () => {
		const vpl = { from_container: { filename: 'input.versatiles' } };

		const progress = convertTiles(vpl, 'output.versatiles');

		await progress.done();

		expect(safeDelete).toHaveBeenCalledWith('/tmp/versatiles-abc123/tiles.vpl');
	});

	it('handles VPL with update_properties', async () => {
		const vpl = {
			from_container: { filename: 'input.versatiles' },
			update_properties: {
				data_source_path: 'population.csv',
				layer_name: 'countries',
				id_field_tiles: 'iso_code',
				id_field_data: 'country_code'
			}
		};

		convertTiles(vpl, 'output.versatiles');

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(buildVPL).toHaveBeenCalledWith(vpl);
	});

	it('handles custom output paths', async () => {
		const vpl = { from_container: { filename: 'input.versatiles' } };

		convertTiles(vpl, '/custom/path/output.versatiles');

		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(runVersaTilesConvert).toHaveBeenCalledWith(
			'/tmp/versatiles-abc123/tiles.vpl',
			'/custom/path/output.versatiles'
		);
	});

	it('executes steps in correct order', async () => {
		const executionOrder: string[] = [];

		vi.mocked(writeFile).mockImplementation(async () => {
			executionOrder.push('write-vpl');
		});

		vi.mocked(runVersaTilesConvert).mockImplementation(async () => {
			executionOrder.push('convert');
			return new SimpleProgress(async () => {});
		});

		vi.mocked(safeDelete).mockImplementation(async () => {
			executionOrder.push('cleanup');
		});

		const vpl = { from_container: { filename: 'input.versatiles' } };

		convertTiles(vpl, 'output.versatiles');

		await new Promise((resolve) => setTimeout(resolve, 200));

		expect(executionOrder).toEqual(['write-vpl', 'convert', 'cleanup']);
	});

	it('uses secure temporary directory with mkdtemp', async () => {
		const vpl = { from_container: { filename: 'input.versatiles' } };

		convertTiles(vpl, 'output.versatiles');

		await new Promise((resolve) => setTimeout(resolve, 50));

		// mkdtemp creates a directory with a random suffix for security
		expect(mkdtemp).toHaveBeenCalledWith(expect.stringContaining('versatiles-'));
	});

	it('creates VPL file in temporary directory', async () => {
		vi.mocked(mkdtemp).mockResolvedValue('/tmp/versatiles-xyz789');

		const vpl = { from_container: { filename: 'input.versatiles' } };

		convertTiles(vpl, 'output.versatiles');

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(writeFile).toHaveBeenCalledWith('/tmp/versatiles-xyz789/tiles.vpl', 'VPL content');
	});

	it('handles errors during VPL file creation', async () => {
		vi.mocked(mkdtemp).mockRejectedValue(new Error('Permission denied'));

		const vpl = { from_container: { filename: 'input.versatiles' } };

		const progress = convertTiles(vpl, 'output.versatiles');

		// Progress should handle the error internally
		expect(progress).toBeInstanceOf(ConcatenatedProgress);
	});

	it('handles VPL from_container parameter', async () => {
		const vpl = {
			from_container: {
				filename: 'source.versatiles'
			}
		};

		convertTiles(vpl, 'output.versatiles');

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(buildVPL).toHaveBeenCalledWith(vpl);
	});

	it('passes VPL parameters correctly', async () => {
		const vpl = {
			from_container: { filename: 'base.versatiles' },
			update_properties: {
				data_source_path: 'stats.csv',
				layer_name: 'regions',
				id_field_tiles: 'region_id',
				id_field_data: 'id',
				properties: {
					population: { type: 'number' },
					name: { type: 'string' }
				}
			}
		};

		convertTiles(vpl, 'output.versatiles');

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(buildVPL).toHaveBeenCalledWith(vpl);
	});
});
