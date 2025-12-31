/**
 * MapLibre GL mock to prevent WebGL errors in jsdom
 */

import { vi } from 'vitest';

// Mock the entire maplibre-gl module
vi.mock('maplibre-gl', () => {
	const mockMap = {
		on: vi.fn(),
		off: vi.fn(),
		once: vi.fn(),
		fire: vi.fn(),
		setStyle: vi.fn(),
		getStyle: vi.fn(() => ({})),
		addLayer: vi.fn(),
		removeLayer: vi.fn(),
		addSource: vi.fn(),
		removeSource: vi.fn(),
		getSource: vi.fn(),
		setLayoutProperty: vi.fn(),
		setPaintProperty: vi.fn(),
		setFilter: vi.fn(),
		flyTo: vi.fn(),
		easeTo: vi.fn(),
		jumpTo: vi.fn(),
		panTo: vi.fn(),
		zoomTo: vi.fn(),
		rotateTo: vi.fn(),
		resetNorth: vi.fn(),
		snapToNorth: vi.fn(),
		fitBounds: vi.fn(),
		fitScreenCoordinates: vi.fn(),
		getCanvas: vi.fn(() => ({
			style: {},
			getContext: vi.fn(() => null)
		})),
		getCanvasContainer: vi.fn(() => document.createElement('div')),
		getContainer: vi.fn(() => document.createElement('div')),
		getBounds: vi.fn(() => ({
			getNorth: () => 90,
			getSouth: () => -90,
			getEast: () => 180,
			getWest: () => -180
		})),
		getCenter: vi.fn(() => ({ lng: 0, lat: 0 })),
		getZoom: vi.fn(() => 0),
		getBearing: vi.fn(() => 0),
		getPitch: vi.fn(() => 0),
		project: vi.fn((lngLat) => ({ x: 0, y: 0 })),
		unproject: vi.fn((point) => ({ lng: 0, lat: 0 })),
		queryRenderedFeatures: vi.fn(() => []),
		querySourceFeatures: vi.fn(() => []),
		setMaxBounds: vi.fn(),
		setMinZoom: vi.fn(),
		setMaxZoom: vi.fn(),
		setMinPitch: vi.fn(),
		setMaxPitch: vi.fn(),
		resize: vi.fn(),
		remove: vi.fn(),
		loaded: vi.fn(() => true),
		areTilesLoaded: vi.fn(() => true),
		triggerRepaint: vi.fn(),
		showCollisionBoxes: false,
		showTileBoundaries: false
	};

	const mockImplementation = {
		Map: vi.fn(() => mockMap),
		NavigationControl: vi.fn(() => ({
			onAdd: vi.fn(),
			onRemove: vi.fn()
		})),
		GeolocateControl: vi.fn(() => ({
			onAdd: vi.fn(),
			onRemove: vi.fn(),
			trigger: vi.fn()
		})),
		AttributionControl: vi.fn(() => ({
			onAdd: vi.fn(),
			onRemove: vi.fn()
		})),
		ScaleControl: vi.fn(() => ({
			onAdd: vi.fn(),
			onRemove: vi.fn()
		})),
		FullscreenControl: vi.fn(() => ({
			onAdd: vi.fn(),
			onRemove: vi.fn()
		})),
		Popup: vi.fn(() => ({
			setLngLat: vi.fn().mockReturnThis(),
			setHTML: vi.fn().mockReturnThis(),
			setText: vi.fn().mockReturnThis(),
			setDOMContent: vi.fn().mockReturnThis(),
			addTo: vi.fn().mockReturnThis(),
			remove: vi.fn(),
			isOpen: vi.fn(() => false),
			on: vi.fn(),
			off: vi.fn()
		})),
		Marker: vi.fn(() => ({
			setLngLat: vi.fn().mockReturnThis(),
			setPopup: vi.fn().mockReturnThis(),
			addTo: vi.fn().mockReturnThis(),
			remove: vi.fn(),
			getLngLat: vi.fn(() => ({ lng: 0, lat: 0 })),
			setDraggable: vi.fn().mockReturnThis(),
			on: vi.fn(),
			off: vi.fn()
		})),
		LngLat: vi.fn((lng, lat) => ({ lng, lat })),
		LngLatBounds: vi.fn(() => ({
			extend: vi.fn().mockReturnThis(),
			getCenter: vi.fn(() => ({ lng: 0, lat: 0 })),
			getNorth: vi.fn(() => 90),
			getSouth: vi.fn(() => -90),
			getEast: vi.fn(() => 180),
			getWest: vi.fn(() => -180)
		})),
		Point: vi.fn((x, y) => ({ x, y })),
		MercatorCoordinate: vi.fn(() => ({
			x: 0,
			y: 0,
			z: 0
		})),
		supported: vi.fn(() => true),
		setRTLTextPlugin: vi.fn(),
		getRTLTextPluginStatus: vi.fn(() => 'loaded')
	};

	// Support both static and dynamic imports
	// - import maplibre from 'maplibre-gl' (uses default)
	// - const m = await import('maplibre-gl') (uses default)
	return {
		...mockImplementation,
		default: mockImplementation
	};
});
