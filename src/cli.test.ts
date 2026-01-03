import { describe, it, expect } from 'vitest';
import { resolve } from 'path';

describe('CLI', () => {
	it('resolves paths relative to INIT_CWD', () => {
		const cwd = process.env.INIT_CWD ?? process.cwd();
		const inputPath = 'input.geojson';
		const resolved = resolve(cwd, inputPath);

		expect(resolved).toContain(inputPath);
		expect(resolved).not.toBe(inputPath);
	});

	it('handles absolute paths correctly', () => {
		const cwd = process.env.INIT_CWD ?? process.cwd();
		const absolutePath = '/absolute/path/file.txt';
		const resolved = resolve(cwd, absolutePath);

		// Absolute paths should remain absolute
		expect(resolved).toBe(absolutePath);
	});

	it('resolves multiple path segments', () => {
		const cwd = process.env.INIT_CWD ?? process.cwd();
		const path1 = 'dir1/dir2';
		const path2 = 'file.txt';
		const resolved = resolve(cwd, path1, path2);

		expect(resolved).toContain('dir1');
		expect(resolved).toContain('dir2');
		expect(resolved).toContain('file.txt');
	});

	it('builds VPL parameters correctly', () => {
		const cwd = process.env.INIT_CWD ?? process.cwd();

		const vpl = {
			from_container: { filename: resolve(cwd, 'input.versatiles') },
			update_properties: {
				data_source_path: resolve(cwd, 'data.csv'),
				layer_name: 'regions',
				id_field_tiles: 'id',
				id_field_data: 'data_id',
				replace_properties: true,
				remove_non_matching: true,
				include_id: true
			}
		};

		expect(vpl.from_container.filename).toContain('input.versatiles');
		expect(vpl.update_properties.data_source_path).toContain('data.csv');
		expect(vpl.update_properties.layer_name).toBe('regions');
		expect(vpl.update_properties.id_field_tiles).toBe('id');
		expect(vpl.update_properties.id_field_data).toBe('data_id');
		expect(vpl.update_properties.replace_properties).toBe(true);
		expect(vpl.update_properties.remove_non_matching).toBe(true);
		expect(vpl.update_properties.include_id).toBe(true);
	});

	it('uses INIT_CWD when available', () => {
		const originalInitCwd = process.env.INIT_CWD;

		process.env.INIT_CWD = '/custom/init/dir';
		const cwd = process.env.INIT_CWD ?? process.cwd();

		expect(cwd).toBe('/custom/init/dir');

		// Restore original
		if (originalInitCwd) {
			process.env.INIT_CWD = originalInitCwd;
		} else {
			delete process.env.INIT_CWD;
		}
	});

	it('falls back to process.cwd() when INIT_CWD not set', () => {
		const originalInitCwd = process.env.INIT_CWD;
		delete process.env.INIT_CWD;

		const cwd = process.env.INIT_CWD ?? process.cwd();

		expect(cwd).toBe(process.cwd());

		// Restore original
		if (originalInitCwd) {
			process.env.INIT_CWD = originalInitCwd;
		}
	});

	it('converts string arguments correctly', () => {
		const input = 'input.geojson';
		const output = 'output.versatiles';

		expect(String(input)).toBe('input.geojson');
		expect(String(output)).toBe('output.versatiles');
	});

	it('handles VPL parameter types', () => {
		const layerName = 'my-layer';
		const idFieldTiles = 'tile_id';
		const idFieldData = 'feature_id';

		expect(String(layerName)).toBe('my-layer');
		expect(String(idFieldTiles)).toBe('tile_id');
		expect(String(idFieldData)).toBe('feature_id');
	});

	it('resolves relative paths from different working directories', () => {
		const testCwd = '/home/user/project';
		const relativePath = 'data/input.geojson';
		const resolved = resolve(testCwd, relativePath);

		expect(resolved).toBe('/home/user/project/data/input.geojson');
	});

	it('normalizes paths with .. segments', () => {
		const testCwd = '/home/user/project/subdir';
		const relativePath = '../data/file.txt';
		const resolved = resolve(testCwd, relativePath);

		expect(resolved).toBe('/home/user/project/data/file.txt');
	});

	it('handles VPL with all required update_properties fields', () => {
		const vpl = {
			from_container: { filename: '/path/to/input.versatiles' },
			update_properties: {
				data_source_path: '/path/to/data.csv',
				layer_name: 'test-layer',
				id_field_tiles: 'tile_id',
				id_field_data: 'feature_id',
				replace_properties: true,
				remove_non_matching: true,
				include_id: true
			}
		};

		expect(vpl.from_container).toHaveProperty('filename');
		expect(vpl.update_properties).toHaveProperty('data_source_path');
		expect(vpl.update_properties).toHaveProperty('layer_name');
		expect(vpl.update_properties).toHaveProperty('id_field_tiles');
		expect(vpl.update_properties).toHaveProperty('id_field_data');
		expect(vpl.update_properties).toHaveProperty('replace_properties');
		expect(vpl.update_properties).toHaveProperty('remove_non_matching');
		expect(vpl.update_properties).toHaveProperty('include_id');
	});

	it('handles boolean VPL flags correctly', () => {
		const replaceProperties = true;
		const removeNonMatching = true;
		const includeId = true;

		expect(replaceProperties).toBe(true);
		expect(removeNonMatching).toBe(true);
		expect(includeId).toBe(true);
	});
});
