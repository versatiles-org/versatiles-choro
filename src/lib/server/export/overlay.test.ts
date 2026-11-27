import { describe, it, expect } from 'vitest';
import { buildExportVPL, computeOverlayData, getTemplateFields } from './overlay';
import { viridis } from '#lib/choro/color-schemes.js';

const table = {
	header: ['key', 'name', 'value'],
	rows: [
		['01', 'Berlin', '0'],
		['02', 'Hamburg', '80'],
		['03', 'Bremen', '-']
	]
};

const update = { id_field_data: 'key' };
const choropleth = { field: 'value', colorScheme: 'viridis' as const, min: 0, max: 80 };

describe('getTemplateFields', () => {
	it('returns each placeholder once', () => {
		expect(getTemplateFields('<b>{name}</b> {value} {name}')).toEqual(['name', 'value']);
		expect(getTemplateFields('no placeholders')).toEqual([]);
	});
});

describe('computeOverlayData', () => {
	it('computes the color of each row and keeps the raw id', () => {
		expect(computeOverlayData(table, update, choropleth)).toEqual([
			['key', 'color_0'],
			['01', viridis[0]],
			['02', viridis[8]],
			['03', '']
		]);
	});

	it('adds the tooltip text when a template is set', () => {
		const rows = computeOverlayData(table, update, {
			...choropleth,
			tooltipTemplate: '<b>{name}</b>: {value}'
		});
		expect(rows[0]).toEqual(['key', 'color_0', 'tooltip_text']);
		expect(rows[1][2]).toBe('<b>Berlin</b>: 0');
		expect(rows[3][2]).toBe('<b>Bremen</b>: -');
	});

	it('reads numbers with the decimal separator', () => {
		const rows = computeOverlayData(
			{ header: ['key', 'value'], rows: [['01', '80,0']] },
			{ id_field_data: 'key', decimal_separator: ',' },
			choropleth
		);
		expect(rows[1]).toEqual(['01', viridis[8]]);
	});

	it('rejects a color field or placeholder that is not a column of the data file', () => {
		expect(() =>
			computeOverlayData(table, update, {
				...choropleth,
				field: 'AGS',
				tooltipTemplate: '{GEN} {name} {GEN}'
			})
		).toThrow('columns of the data file, but these are not: AGS, GEN.');
	});

	it('rejects a missing id column', () => {
		expect(() => computeOverlayData(table, { id_field_data: 'id' }, choropleth)).toThrow(
			'no column "id"'
		);
	});
});

describe('buildExportVPL', () => {
	const vpl = {
		from_container: { filename: 'geo.versatiles' },
		update_properties: {
			data_source_path: 'data/values.csv',
			layer_name: 'regions.2024',
			id_field_tiles: 'AGS',
			id_field_data: 'key',
			remove_non_matching: true,
			field_separator: ';',
			decimal_separator: ','
		},
		meta_update: { name: 'Map' }
	};

	it('joins the computed data file and keeps only the exported properties', () => {
		expect(buildExportVPL(vpl, 'exports/map')).toEqual({
			from_container: { filename: 'geo.versatiles' },
			update_properties: {
				data_source_path: 'exports/map/.overlay-data.csv',
				layer_name: 'regions.2024',
				id_field_tiles: 'AGS',
				id_field_data: 'key',
				remove_non_matching: true
			},
			filter_properties: {
				regex: '^regions\\.2024/(color_0|tooltip_text)$',
				invert: true
			},
			meta_update: { name: 'Map' }
		});
	});

	it('requires a joined data file', () => {
		expect(() => buildExportVPL({ from_container: { filename: 'geo.versatiles' } }, 'x')).toThrow(
			'needs a data file'
		);
	});
});
