import { describe, it, expect } from 'vitest';
import type { TileJSONSpecificationVector } from '@versatiles/style';
import { generateConfig } from './generate-config';
import { inferno } from '#lib/choro/color-schemes.js';

const tilejson = {
	tilejson: '3.0.0',
	tiles: ['http://localhost/tiles/{z}/{x}/{y}'],
	bounds: [5, 47, 15, 55],
	vector_layers: [
		{ id: 'regions', fields: { AGS: 'String', income: 'Number' } },
		{ id: 'labels', fields: { name: 'String' } }
	]
} as TileJSONSpecificationVector;

const params = {
	overlaySourceFile: 'overlay.versatiles',
	layerName: 'regions',
	tilejson,
	choropleth: { field: 'income', colorScheme: 'inferno' as const, min: 0, max: 100 },
	backgroundStyle: 'GrayBright' as const
};

describe('generateConfig', () => {
	it('describes how color_0 was computed', () => {
		const config = generateConfig(params);
		expect(config.version).toBe('2.0');
		expect(config.choropleth).toEqual({
			field: 'income',
			colorScheme: 'inferno',
			min: 0,
			max: 100,
			colors: inferno
		});
		expect(config.tooltip).toBe(false);
		expect(config.bounds).toEqual([5, 47, 15, 55]);
	});

	it('lists only the exported fields and clears the tile URLs', () => {
		const config = generateConfig({
			...params,
			choropleth: { ...params.choropleth, tooltipTemplate: '{AGS}' }
		});
		expect(config.tooltip).toBe(true);
		expect(config.overlay.tilejson.tiles).toEqual([]);
		expect(config.overlay.tilejson.vector_layers).toEqual([
			{ id: 'regions', fields: { color_0: 'String', tooltip_text: 'String' } },
			{ id: 'labels', fields: {} }
		]);
	});

	it('leaves out the tooltip field without a template', () => {
		const config = generateConfig(params);
		expect(config.overlay.tilejson.vector_layers[0].fields).toEqual({ color_0: 'String' });
	});
});
