import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import MapWrapper from './Map.test-wrapper.svelte';

// Mock maplibre-gl
vi.mock('maplibre-gl', () => ({
	default: {
		Map: vi.fn(function () {
			return {
				remove: vi.fn(),
				setStyle: vi.fn(),
				getCanvas: vi.fn(() => document.createElement('canvas')),
				on: vi.fn(),
				off: vi.fn()
			};
		})
	}
}));

// Mock tile source
vi.mock('./map/tile_source', () => ({
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

	it('accepts overlay prop', () => {
		const { container } = render(MapWrapper, {
			props: {
				backgroundMap: 'Colorful',
				overlay: {
					vpl: { from_container: { filename: 'test.versatiles' } }
				}
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
});
