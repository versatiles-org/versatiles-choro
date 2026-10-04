import { describe, it, expect, vi } from 'vitest';
import { createBackgroundStyle, type BackgroundMap } from './style-background';

// Mock @versatiles/style
vi.mock('@versatiles/style', () => ({
	osm: vi.fn((options) => ({
		version: 8,
		sources: { tiles: { type: 'vector' } },
		layers: [
			{ id: 'background', type: 'background' },
			{ id: 'water', type: 'fill' },
			{ id: 'land', type: 'fill' },
			{ id: 'building', type: 'fill' },
			{ id: 'street-major', type: 'line' },
			{ id: 'street-minor', type: 'line' },
			{ id: 'aerialway', type: 'line' },
			{ id: 'label-city', type: 'symbol' },
			{ id: 'boundary-country', type: 'line' }
		],
		...options
	}))
}));

import { osm } from '@versatiles/style';

const base = {
	theme: 'colorful',
	text: { language: 'de' },
	urls: {
		base: 'https://tiles.versatiles.org',
		osm: expect.objectContaining({
			tiles: ['https://tiles.versatiles.org/tiles/osm/{z}/{x}/{y}'],
			maxzoom: 14,
			attribution: expect.stringContaining('OpenStreetMap')
		})
	},
	projection: 'mercator',
	sky: false
};

describe('createBackgroundStyle', () => {
	it('creates colorful style', () => {
		const style = createBackgroundStyle('Colorful');

		expect(osm).toHaveBeenCalledWith(base);

		expect(style.version).toBe(8);
	});

	it('creates gray style with saturate -1', () => {
		const style = createBackgroundStyle('Gray');

		expect(osm).toHaveBeenCalledWith({ ...base, recolor: { saturate: -1 } });
	});

	it('creates gray bright style with white blend', () => {
		const style = createBackgroundStyle('GrayBright');

		expect(osm).toHaveBeenCalledWith({
			...base,
			recolor: { saturate: -1, blend: { color: '#ffffff', amount: 0.5 } }
		});
	});

	it('creates gray dark style with black blend and inverted brightness', () => {
		const style = createBackgroundStyle('GrayDark');

		expect(osm).toHaveBeenCalledWith({
			...base,
			recolor: { saturate: -1, invertBrightness: true, blend: { color: '#000000', amount: 0.5 } }
		});
	});

	it('creates empty style for None', () => {
		const style = createBackgroundStyle('None');

		expect(style).toEqual({
			version: 8,
			sources: {},
			layers: []
		});
	});

	it('creates empty style for undefined', () => {
		const style = createBackgroundStyle(undefined);

		expect(style).toEqual({
			version: 8,
			sources: {},
			layers: []
		});
	});

	it('throws error for unknown background map', () => {
		expect(() => createBackgroundStyle('Unknown' as BackgroundMap)).toThrow(
			'Unknown background map: Unknown'
		);
	});

	it('filters out street layers', () => {
		const style = createBackgroundStyle('Colorful');

		const streetLayers = style.layers?.filter((layer) => layer.id.startsWith('street-'));
		expect(streetLayers?.length).toBe(0);
	});

	it('filters out transport layers', () => {
		const style = createBackgroundStyle('Colorful');

		const hasTransport = style.layers?.some((layer) => layer.id.startsWith('transport'));
		expect(hasTransport).toBe(false);
	});

	it('filters out aerialway layers', () => {
		const style = createBackgroundStyle('Colorful');

		const hasAerialway = style.layers?.some((layer) => layer.id.startsWith('aerialway'));
		expect(hasAerialway).toBe(false);
	});

	it('filters out symbol layers', () => {
		const style = createBackgroundStyle('Colorful');

		const hasSymbol = style.layers?.some((layer) => layer.id.startsWith('symbol'));
		expect(hasSymbol).toBe(false);
	});

	it('filters out poi layers', () => {
		const style = createBackgroundStyle('Colorful');

		const hasPoi = style.layers?.some((layer) => layer.id.startsWith('poi'));
		expect(hasPoi).toBe(false);
	});

	it('keeps background layers', () => {
		const style = createBackgroundStyle('Colorful');

		const backgroundLayers = style.layers?.filter((layer) => layer.id.startsWith('background'));
		expect(backgroundLayers?.length).toBeGreaterThan(0);
	});

	it('keeps boundary layers', () => {
		const style = createBackgroundStyle('Colorful');

		const boundaryLayers = style.layers?.filter((layer) => layer.id.startsWith('boundary'));
		expect(boundaryLayers?.length).toBeGreaterThan(0);
	});

	it('keeps building layers', () => {
		const style = createBackgroundStyle('Colorful');

		const buildingLayers = style.layers?.filter((layer) => layer.id.startsWith('building'));
		expect(buildingLayers?.length).toBeGreaterThan(0);
	});

	it('keeps water layers', () => {
		const style = createBackgroundStyle('Colorful');

		const waterLayers = style.layers?.filter((layer) => layer.id.startsWith('water'));
		expect(waterLayers?.length).toBeGreaterThan(0);
	});

	it('keeps land layers', () => {
		const style = createBackgroundStyle('Colorful');

		const landLayers = style.layers?.filter((layer) => layer.id.startsWith('land'));
		expect(landLayers?.length).toBeGreaterThan(0);
	});

	it('uses de language by default', () => {
		createBackgroundStyle('Colorful');

		expect(osm).toHaveBeenCalledWith(
			expect.objectContaining({
				text: { language: 'de' }
			})
		);
	});

	it('uses versatiles.org base URL', () => {
		createBackgroundStyle('Colorful');

		expect(osm).toHaveBeenCalledWith(
			expect.objectContaining({
				urls: expect.objectContaining({ base: 'https://tiles.versatiles.org' })
			})
		);
	});
});
