import { describe, it, expect } from 'vitest';
import type { TileJSONSpecificationVector } from '@versatiles/style';
import type { FillLayerSpecification } from 'maplibre-gl';
import { getChoroplethLayerId, getChoroplethStyle, getExportedChoroplethStyle } from './style';

const spec = {
	tilejson: '3.0.0',
	tiles: ['https://example.org/{z}/{x}/{y}'],
	vector_layers: [{ id: 'regions', fields: {} }]
} as TileJSONSpecificationVector;

function fillLayer(style: ReturnType<typeof getChoroplethStyle>): FillLayerSpecification {
	return style.layers.find((layer) => layer.type === 'fill') as FillLayerSpecification;
}

describe('getChoroplethLayerId', () => {
	it('is the id of the fill layer of both styles', () => {
		const id = getChoroplethLayerId('regions');
		const params = { field: 'v', colorScheme: 'viridis' as const, min: 0, max: 1 };
		expect(fillLayer(getChoroplethStyle(spec, 'regions', params)).id).toBe(id);
		expect(fillLayer(getExportedChoroplethStyle(spec, 'regions')).id).toBe(id);
	});
});

describe('getExportedChoroplethStyle', () => {
	it('reads the fill color from color_0, black when missing', () => {
		const layer = fillLayer(getExportedChoroplethStyle(spec, 'regions'));
		expect(layer['source-layer']).toBe('regions');
		expect(layer.paint?.['fill-color']).toEqual(['to-color', ['get', 'color_0'], '#000000']);
	});

	it('keeps the outline layer of the preview', () => {
		const params = { field: 'v', colorScheme: 'viridis' as const, min: 0, max: 1 };
		const outline = (style: ReturnType<typeof getChoroplethStyle>) =>
			style.layers.find((layer) => layer.type === 'line');
		expect(outline(getExportedChoroplethStyle(spec, 'regions'))).toEqual(
			outline(getChoroplethStyle(spec, 'regions', params))
		);
	});
});
