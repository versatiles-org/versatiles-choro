import { describe, it, expect, vi } from 'vitest';
import { overlayStyles, getInspectorStyle } from './style';
import type { StyleSpecification } from 'maplibre-gl';
import type { TileJSONSpecificationVector } from '@versatiles/style';

// Mock @versatiles/style Color
vi.mock('@versatiles/style', () => ({
	Color: {
		HSV: {
			randomColor: vi.fn((options) => ({
				asString: () => `rgba(${options.seed?.length || 0}, 100, 150, 0.6)`
			}))
		}
	}
}));

describe('overlayStyles', () => {
	it('merges sources from both styles', () => {
		const style1: StyleSpecification = {
			version: 8,
			sources: { source1: { type: 'raster' } },
			layers: []
		};

		const style2: StyleSpecification = {
			version: 8,
			sources: { source2: { type: 'vector' } },
			layers: []
		};

		const result = overlayStyles(style1, style2);

		expect(result.sources).toEqual({
			source1: { type: 'raster' },
			source2: { type: 'vector' }
		});
	});

	it('concatenates layers from both styles', () => {
		const style1: StyleSpecification = {
			version: 8,
			sources: {},
			layers: [{ id: 'layer1', type: 'background' }]
		};

		const style2: StyleSpecification = {
			version: 8,
			sources: {},
			layers: [{ id: 'layer2', type: 'fill', source: 'test-source' }]
		};

		const result = overlayStyles(style1, style2);

		expect(result.layers).toHaveLength(2);
		expect(result.layers?.[0].id).toBe('layer1');
		expect(result.layers?.[1].id).toBe('layer2');
	});

	it('sets version to 8', () => {
		const style1: StyleSpecification = { version: 8, sources: {}, layers: [] };
		const style2: StyleSpecification = { version: 8, sources: {}, layers: [] };

		const result = overlayStyles(style1, style2);

		expect(result.version).toBe(8);
	});

	it('handles undefined layers', () => {
		const style1: StyleSpecification = { version: 8, sources: {}, layers: [] };
		const style2: StyleSpecification = { version: 8, sources: {}, layers: [] };

		const result = overlayStyles(style1, style2);

		expect(result.layers).toEqual([]);
	});

	it('prioritizes style2 sources when keys overlap', () => {
		const style1: StyleSpecification = {
			version: 8,
			sources: { shared: { type: 'raster' } },
			layers: []
		};

		const style2: StyleSpecification = {
			version: 8,
			sources: { shared: { type: 'vector' } },
			layers: []
		};

		const result = overlayStyles(style1, style2);

		expect(result.sources.shared).toEqual({ type: 'vector' });
	});
});

describe('getInspectorStyle', () => {
	const createMockSpec = (layerIds: string[]): TileJSONSpecificationVector => ({
		tilejson: '3.0.0',
		tiles: ['http://example.com/{z}/{x}/{y}.pbf'],
		vector_layers: layerIds.map((id) => ({
			id,
			fields: {},
			minzoom: 0,
			maxzoom: 14
		})),
		minzoom: 0,
		maxzoom: 14
	});

	it('creates style specification with version 8', () => {
		const spec = createMockSpec(['layer1']);
		const style = getInspectorStyle(spec);

		expect(style.version).toBe(8);
	});

	it('creates vector source from spec', () => {
		const spec = createMockSpec(['layer1']);
		const style = getInspectorStyle(spec);

		expect(style.sources.vectorSource).toEqual({
			tiles: ['http://example.com/{z}/{x}/{y}.pbf'],
			type: 'vector',
			minzoom: 0,
			maxzoom: 14
		});
	});

	it('creates three layers per vector layer (point, line, polygon)', () => {
		const spec = createMockSpec(['layer1']);
		const style = getInspectorStyle(spec);

		// Should have fill, line, and point layers
		expect(style.layers?.length).toBe(3);
	});

	it('creates point layer with circle type', () => {
		const spec = createMockSpec(['testlayer']);
		const style = getInspectorStyle(spec);

		const pointLayer = style.layers?.find((l) => l.id.includes('point'));
		expect(pointLayer?.type).toBe('circle');
		expect((pointLayer as { filter?: unknown })?.filter).toEqual(['==', '$type', 'Point']);
	});

	it('creates line layer with line type', () => {
		const spec = createMockSpec(['testlayer']);
		const style = getInspectorStyle(spec);

		const lineLayer = style.layers?.find((l) => l.id.includes('line'));
		expect(lineLayer?.type).toBe('line');
		expect((lineLayer as { filter?: unknown })?.filter).toEqual(['==', '$type', 'LineString']);
	});

	it('creates fill layer with polygon type', () => {
		const spec = createMockSpec(['testlayer']);
		const style = getInspectorStyle(spec);

		const fillLayer = style.layers?.find((l) => l.id.includes('polygon'));
		expect(fillLayer?.type).toBe('fill');
		expect((fillLayer as { filter?: unknown })?.filter).toEqual(['==', '$type', 'Polygon']);
	});

	it('handles multiple vector layers', () => {
		const spec = createMockSpec(['layer1', 'layer2', 'layer3']);
		const style = getInspectorStyle(spec);

		// 3 layers per vector layer = 9 total
		expect(style.layers?.length).toBe(9);
	});

	it('includes attribution if present in spec', () => {
		const spec = createMockSpec(['layer1']);
		spec.attribution = 'Test Attribution';

		const style = getInspectorStyle(spec);

		expect((style.sources.vectorSource as { attribution?: string }).attribution).toBe(
			'Test Attribution'
		);
	});

	it('includes scheme if present in spec', () => {
		const spec = createMockSpec(['layer1']);
		spec.scheme = 'tms';

		const style = getInspectorStyle(spec);

		expect((style.sources.vectorSource as { scheme?: string }).scheme).toBe('tms');
	});

	it('orders layers as fill, line, point', () => {
		const spec = createMockSpec(['layer1']);
		const style = getInspectorStyle(spec);

		const types = style.layers?.map((l) => l.type);
		expect(types).toEqual(['fill', 'line', 'circle']);
	});

	it('uses layer id in generated layer names', () => {
		const spec = createMockSpec(['water']);
		const style = getInspectorStyle(spec);

		const layerIds = style.layers?.map((l) => l.id);
		expect(layerIds).toContain('vectorSource-water-point');
		expect(layerIds).toContain('vectorSource-water-line');
		expect(layerIds).toContain('vectorSource-water-polygon');
	});

	it('sets source-layer for all generated layers', () => {
		const spec = createMockSpec(['testlayer']);
		const style = getInspectorStyle(spec);

		style.layers?.forEach((layer) => {
			expect((layer as { 'source-layer'?: string })['source-layer']).toBe('testlayer');
		});
	});

	it('sets vectorSource as source for all layers', () => {
		const spec = createMockSpec(['testlayer']);
		const style = getInspectorStyle(spec);

		style.layers?.forEach((layer) => {
			expect((layer as { source?: string }).source).toBe('vectorSource');
		});
	});

	it('handles spec without minzoom', () => {
		const spec = createMockSpec(['layer1']);
		delete spec.minzoom;

		const style = getInspectorStyle(spec);

		expect((style.sources.vectorSource as { minzoom?: number }).minzoom).toBeUndefined();
	});

	it('handles spec without maxzoom', () => {
		const spec = createMockSpec(['layer1']);
		delete spec.maxzoom;

		const style = getInspectorStyle(spec);

		expect((style.sources.vectorSource as { maxzoom?: number }).maxzoom).toBeUndefined();
	});

	it('handles spec without attribution', () => {
		const spec = createMockSpec(['layer1']);
		const style = getInspectorStyle(spec);

		expect((style.sources.vectorSource as { attribution?: string }).attribution).toBeUndefined();
	});

	it('sets fill opacity to 0.3', () => {
		const spec = createMockSpec(['layer1']);
		const style = getInspectorStyle(spec);

		const fillLayer = style.layers?.find((l) => l.type === 'fill');
		expect((fillLayer as { paint?: { 'fill-opacity'?: number } })?.paint?.['fill-opacity']).toBe(
			0.3
		);
	});

	it('sets circle radius to 2', () => {
		const spec = createMockSpec(['layer1']);
		const style = getInspectorStyle(spec);

		const circleLayer = style.layers?.find((l) => l.type === 'circle');
		expect(
			(circleLayer as { paint?: { 'circle-radius'?: number } })?.paint?.['circle-radius']
		).toBe(2);
	});

	it('sets line join and cap to round', () => {
		const spec = createMockSpec(['layer1']);
		const style = getInspectorStyle(spec);

		const lineLayer = style.layers?.find((l) => l.type === 'line');
		expect(
			(lineLayer as { layout?: { 'line-join'?: string; 'line-cap'?: string } })?.layout?.[
				'line-join'
			]
		).toBe('round');
		expect(
			(lineLayer as { layout?: { 'line-join'?: string; 'line-cap'?: string } })?.layout?.[
				'line-cap'
			]
		).toBe('round');
	});
});
