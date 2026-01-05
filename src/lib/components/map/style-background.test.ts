import { describe, it, expect, vi } from 'vitest';
import { createBackgroundStyle, type BackgroundMap } from './style_background';

// Mock @versatiles/style
vi.mock('@versatiles/style', () => ({
	colorful: vi.fn((options) => ({
		version: 8,
		sources: { tiles: { type: 'vector' } },
		layers: [
			{ id: 'background', type: 'background' },
			{ id: 'water', type: 'fill' },
			{ id: 'land', type: 'fill' },
			{ id: 'building', type: 'fill' },
			{ id: 'street-major', type: 'line' },
			{ id: 'street-minor', type: 'line' },
			{ id: 'label-city', type: 'symbol' },
			{ id: 'boundary-country', type: 'line' }
		],
		...options
	}))
}));

import { colorful } from '@versatiles/style';

describe('createBackgroundStyle', () => {
	it('creates colorful style', () => {
		const style = createBackgroundStyle('Colorful');

		expect(colorful).toHaveBeenCalledWith({
			baseUrl: 'https://tiles.versatiles.org',
			language: 'de'
		});

		expect(style.version).toBe(8);
	});

	it('creates gray style with saturate -1', () => {
		const style = createBackgroundStyle('Gray');

		expect(colorful).toHaveBeenCalledWith({
			baseUrl: 'https://tiles.versatiles.org',
			language: 'de',
			recolor: { saturate: -1 }
		});
	});

	it('creates gray bright style with white blend', () => {
		const style = createBackgroundStyle('GrayBright');

		expect(colorful).toHaveBeenCalledWith({
			baseUrl: 'https://tiles.versatiles.org',
			language: 'de',
			recolor: { saturate: -1, blendColor: '#ffffff', blend: 0.5 }
		});
	});

	it('creates gray dark style with black blend and inverted brightness', () => {
		const style = createBackgroundStyle('GrayDark');

		expect(colorful).toHaveBeenCalledWith({
			baseUrl: 'https://tiles.versatiles.org',
			language: 'de',
			recolor: { saturate: -1, invertBrightness: true, blendColor: '#000000', blend: 0.5 }
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

		expect(colorful).toHaveBeenCalledWith(
			expect.objectContaining({
				language: 'de'
			})
		);
	});

	it('uses versatiles.org base URL', () => {
		createBackgroundStyle('Colorful');

		expect(colorful).toHaveBeenCalledWith(
			expect.objectContaining({
				baseUrl: 'https://tiles.versatiles.org'
			})
		);
	});
});
