import { describe, it, expect, vi } from 'vitest';
import {
	buildVPL,
	buildVPLFilter,
	buildVPLFilterLayers,
	buildVPLFilterProperties,
	buildVPLMetaUpdate,
	buildVPLUpdateProperties
} from './vpl';
import * as v from 'valibot';
import type { VPLParam } from '$lib/api/vpl';

vi.mock('$lib/server/filesystem/filesystem', () => ({
	resolve_data: (path: string) => 'data/' + path,
	resolve_temp: (path: string) => 'temp/' + path
}));

describe('buildVPLUpdateProperties', () => {
	it('returns correct string for only required fields', () => {
		const res = buildVPLUpdateProperties({
			data_source_path: 'data.csv',
			layer_name: 'mylayer',
			id_field_tiles: 'tile_id',
			id_field_data: 'data_id'
		});
		expect(res).toBe(
			'vector_update_properties data_source_path="data.csv" layer_name="mylayer" id_field_tiles="tile_id" id_field_data="data_id"'
		);
	});
	it('includes replace_properties and include_id when true, omits remove_non_matching when false', () => {
		const res = buildVPLUpdateProperties({
			data_source_path: 'data.csv',
			layer_name: 'mylayer',
			id_field_tiles: 'tile_id',
			id_field_data: 'data_id',
			replace_properties: true,
			remove_non_matching: false,
			include_id: true
		});
		expect(res).toContain('replace_properties="true"');
		expect(res).toContain('include_id="true"');
		expect(res).not.toContain('remove_non_matching');
	});
});

describe('buildVPLFilterLayers', () => {
	it('returns correct string for given layer_names and invert=false', () => {
		const res = buildVPLFilterLayers({
			layer_names: ['a', ' b '],
			invert: false
		});
		expect(res).toBe('vector_filter_layers filter="a,b"');
	});
	it('returns correct string for given layer_names and invert=true', () => {
		const res = buildVPLFilterLayers({
			layer_names: ['a', ' b '],
			invert: true
		});
		expect(res).toBe('vector_filter_layers filter="a,b" invert="true"');
	});
});

describe('buildVPLFilterProperties', () => {
	it('returns correct string for regex and invert=false', () => {
		const res = buildVPLFilterProperties({
			regex: '^foo',
			invert: false
		});
		expect(res).toBe('vector_filter_properties regex="^foo"');
	});
	it('returns correct string for regex and invert=true', () => {
		const res = buildVPLFilterProperties({
			regex: '^foo',
			invert: true
		});
		expect(res).toBe('vector_filter_properties regex="^foo" invert="true"');
	});
});

describe('buildVPLFilter', () => {
	it('returns correct string for only minZoom', () => {
		const res = buildVPLFilter({ minZoom: 3 });
		expect(res).toBe('filter min_zoom="3"');
	});
	it('returns correct string for only maxZoom', () => {
		const res = buildVPLFilter({ maxZoom: 10 });
		expect(res).toBe('filter max_zoom="10"');
	});
	it('returns correct string for only bounds', () => {
		const res = buildVPLFilter({ bounds: [1, 2, 3, 4] });
		expect(res).toBe('filter bounds="1,2,3,4"');
	});
	it('returns correct string for minZoom, maxZoom, and bounds', () => {
		const res = buildVPLFilter({ minZoom: 3, maxZoom: 10, bounds: [1, 2, 3, 4] });
		expect(res).toBe('filter min_zoom="3" max_zoom="10" bounds="1,2,3,4"');
	});
});

describe('buildVPLMetaUpdate', () => {
	it('returns null when all properties are undefined', () => {
		expect(buildVPLMetaUpdate({})).toBeNull();
	});
	it('returns correct string for all properties defined', () => {
		const res = buildVPLMetaUpdate({
			attribution: 'Attr',
			name: 'Name',
			description: 'Desc'
		});
		expect(res).toBe('meta_update attribution="Attr" name="Name" description="Desc"');
	});
});

describe('buildVPL', () => {
	it('returns correct string for only input and others null', () => {
		const params = {
			from_container: { filename: 'input.versatiles' },
			update_properties: undefined,
			filter_layers: undefined,
			filter_properties: undefined,
			filter: undefined,
			meta_update: undefined
		};
		expect(buildVPL(params)).toBe('from_container filename="data/input.versatiles"');
	});
	it('returns correct string for fully populated parameter object', () => {
		const params = {
			from_container: { filename: 'input.versatiles' },
			update_properties: {
				data_source_path: 'data.csv',
				layer_name: 'mylayer',
				id_field_tiles: 'tile_id',
				id_field_data: 'data_id',
				replace_properties: true,
				remove_non_matching: true,
				include_id: true
			},
			filter_layers: {
				layer_names: ['a', ' b '],
				invert: true
			},
			filter_properties: {
				regex: '^foo',
				invert: false
			},
			filter: {
				minZoom: 3,
				maxZoom: 10,
				bounds: [1, 2, 3, 4]
			},
			meta_update: {
				attribution: 'Attr',
				name: 'Name',
				description: 'Desc'
			}
		} as v.InferOutput<typeof VPLParam>;
		const expected = [
			'from_container filename="data/input.versatiles"',
			'   | vector_update_properties data_source_path="data.csv" layer_name="mylayer" id_field_tiles="tile_id" id_field_data="data_id" replace_properties="true" remove_non_matching="true" include_id="true"',
			'   | vector_filter_layers filter="a,b" invert="true"',
			'   | vector_filter_properties regex="^foo"',
			'   | filter min_zoom="3" max_zoom="10" bounds="1,2,3,4"',
			'   | meta_update attribution="Attr" name="Name" description="Desc"'
		].join('\n');
		expect(buildVPL(params)).toBe(expected);
	});
});
