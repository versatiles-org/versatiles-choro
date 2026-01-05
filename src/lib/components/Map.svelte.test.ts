import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import MapWrapper from './Map.test-wrapper.svelte';
import type { InferOutput } from 'valibot';
import type { TilesInitRequest } from '$lib/api/schemas';
import { getTileSource, TileSource } from './map/tile-source';

// Mock maplibre-gl
vi.mock('maplibre-gl', () => ({
	default: {
		Map: vi.fn(function () {
			return {
				remove: vi.fn(),
				setStyle: vi.fn(),
				getCanvas: vi.fn(() => ({
					style: {},
					getContext: vi.fn(() => null)
				})),
				on: vi.fn(),
				off: vi.fn()
			};
		})
	}
}));

// Mock tile source
vi.mock('./map/tile-source', () => ({
	getTileSource: vi.fn(async () => ({
		getStyle: vi.fn(() => ({
			version: 8,
			sources: {},
			layers: [{ id: 'test-layer', type: 'fill' }]
		})),
		getTileJson: vi.fn(() => ({ tiles: ['http://example.com/{z}/{x}/{y}'] })),
		getBounds: vi.fn(() => undefined)
	}))
}));

describe('Map', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders map container', () => {
		const { container } = render(MapWrapper, {
			props: {
				backgroundMap: 'Colorful'
			}
		});

		const mapContainer = container.querySelector('.map-container');
		expect(mapContainer).toBeInTheDocument();
	});

	it('shows loading state initially', () => {
		const { container } = render(MapWrapper, {
			props: {
				backgroundMap: 'Gray'
			}
		});

		const loading = container.querySelector('.map-loading');
		expect(loading).toBeInTheDocument();
		expect(loading).toHaveTextContent('Loading map...');
	});

	it('accepts backgroundMap prop', () => {
		const { container } = render(MapWrapper, {
			props: {
				backgroundMap: 'GrayBright'
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('accepts overlay prop', async () => {
		const { container } = render(MapWrapper, {
			props: {
				backgroundMap: 'Colorful',
				overlay_source: await getTileSource({
					vpl: { from_container: { filename: 'test.versatiles' } }
				})
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('accepts inspectOverlay prop', () => {
		const { container } = render(MapWrapper, {
			props: {
				backgroundMap: 'Colorful',
				inspectOverlay: true
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('renders without backgroundMap (undefined)', () => {
		const { container } = render(MapWrapper, {
			props: {}
		});

		const mapContainer = container.querySelector('.map-container');
		expect(mapContainer).toBeInTheDocument();
	});

	it('renders map container with correct class', () => {
		const { container } = render(MapWrapper, {
			props: {
				backgroundMap: 'None'
			}
		});

		const mapContainer = container.querySelector('.map-container');
		expect(mapContainer).toHaveClass('map-container');
	});

	it('does not show inspector info when inspectOverlay is false', () => {
		const { container } = render(MapWrapper, {
			props: {
				backgroundMap: 'Colorful',
				inspectOverlay: false
			}
		});

		const info = container.querySelector('#info');
		expect(info).not.toBeInTheDocument();
	});

	it('handles different background map styles', async () => {
		const backgrounds: Array<'Colorful' | 'Gray' | 'GrayBright' | 'GrayDark' | 'None' | undefined> =
			['Colorful', 'Gray', 'GrayBright', 'GrayDark', 'None', undefined];

		for (const bg of backgrounds) {
			const { container } = render(MapWrapper, {
				props: {
					backgroundMap: bg
				}
			});

			const mapContainer = container.querySelector('.map-container');
			expect(mapContainer).toBeInTheDocument();
		}
	});

	it('calls getTileSource when overlay changes', async () => {
		const { getTileSource } = await import('./map/tile-source');

		const state = $state({
			overlay_source: undefined as TileSource | undefined
		});

		render(MapWrapper, {
			props: {
				backgroundMap: 'Colorful',
				get overlay_source() {
					return state.overlay_source;
				}
			}
		});

		// Wait for map initialization
		await tick();
		await tick();

		// Clear previous calls
		vi.mocked(getTileSource).mockClear();

		// Change overlay
		state.overlay_source = await getTileSource({
			vpl: { from_container: { filename: 'test1.versatiles' } }
		});

		// Wait for effect to run and async updateOverlay to complete
		await tick();
		await tick();

		// Verify getTileSource was called with the new overlay
		expect(getTileSource).toHaveBeenCalledWith({
			vpl: { from_container: { filename: 'test1.versatiles' } }
		});
	});

	it('calls getTileSource when overlay changes multiple times', async () => {
		const { getTileSource } = await import('./map/tile-source');

		const state = $state({
			overlay_source: undefined as TileSource | undefined
		});

		render(MapWrapper, {
			props: {
				backgroundMap: 'Colorful',
				get overlay_source() {
					return state.overlay_source;
				}
			}
		});

		// Wait for map initialization
		await tick();
		await tick();

		vi.mocked(getTileSource).mockClear();

		// First overlay change
		state.overlay_source = await getTileSource({
			vpl: { from_container: { filename: 'test1.versatiles' } }
		});

		await tick();
		await tick();

		expect(getTileSource).toHaveBeenCalledTimes(1);
		expect(getTileSource).toHaveBeenCalledWith({
			vpl: { from_container: { filename: 'test1.versatiles' } }
		});

		vi.mocked(getTileSource).mockClear();

		// Second overlay change
		state.overlay_source = await getTileSource({
			vpl: { from_container: { filename: 'test2.versatiles' } }
		});

		await tick();
		await tick();

		expect(getTileSource).toHaveBeenCalledTimes(1);
		expect(getTileSource).toHaveBeenCalledWith({
			vpl: { from_container: { filename: 'test2.versatiles' } }
		});
	});
});
