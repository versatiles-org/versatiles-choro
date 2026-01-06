/**
 * Bundle entry point for choro-lib.js
 *
 * This file is the entry point for the standalone browser bundle.
 * It exports all choro library functionality as a global `choroLib` object.
 */

import {
	COLOR_SCHEMES,
	COLOR_SCHEME_NAMES,
	type ChoroplethParams,
	type ColorSchemeName
} from './color-schemes';
import { mergeStyles, getChoroplethStyle, getColorStops } from './style';
import { createBackgroundStyle, type BackgroundMap } from './style-background';
import type { TileJSONSpecificationVector } from '@versatiles/style';
import type { StyleSpecification, Map as MaplibreMap, LngLatBoundsLike } from 'maplibre-gl';

/**
 * Export configuration structure for the choropleth map.
 */
export interface ExportConfig {
	version: '1.0';
	overlay: {
		source: string;
		layer: string;
		tilejson: TileJSONSpecificationVector;
	};
	choropleth: {
		field: string;
		colorScheme: ColorSchemeName;
		min: number;
		max: number;
		colors: string[];
	};
	background: {
		style: BackgroundMap;
	};
	bounds?: [number, number, number, number];
}

/**
 * Creates a complete MapLibre style for a choropleth map from export configuration.
 */
export function createStyleFromConfig(config: ExportConfig): StyleSpecification {
	// Create background style
	const backgroundStyle = createBackgroundStyle(config.background.style);

	// Create overlay style from tilejson
	const overlayTilejson: TileJSONSpecificationVector = {
		...config.overlay.tilejson,
		// Override tiles to point to local file via versatiles server
		tiles: [`{versatiles_url}/${config.overlay.source}/{z}/{x}/{y}`]
	};

	const overlayStyle = getChoroplethStyle(overlayTilejson, config.overlay.layer, {
		field: config.choropleth.field,
		colorScheme: config.choropleth.colorScheme,
		min: config.choropleth.min,
		max: config.choropleth.max
	});

	// Merge styles
	return mergeStyles(backgroundStyle, overlayStyle);
}

/**
 * Initializes a MapLibre map with the choropleth configuration.
 *
 * @param containerId - The ID of the HTML element to contain the map
 * @param configUrl - URL to the config.json file
 * @param versatilesTileUrl - Base URL for the VersaTiles tile server (e.g., 'http://localhost:8080')
 * @returns Promise resolving to the initialized MapLibre map
 */
export async function initMap(
	containerId: string,
	configUrl: string,
	versatilesTileUrl: string
): Promise<MaplibreMap> {
	// Fetch configuration
	const response = await fetch(configUrl);
	if (!response.ok) {
		throw new Error(`Failed to load config: ${response.statusText}`);
	}
	const config: ExportConfig = await response.json();

	// Create background style
	const backgroundStyle = createBackgroundStyle(config.background.style);

	// Create overlay tilejson with correct tile URL
	const overlayTilejson: TileJSONSpecificationVector = {
		...config.overlay.tilejson,
		tiles: [`${versatilesTileUrl}/${config.overlay.source}/{z}/{x}/{y}`]
	};

	const overlayStyle = getChoroplethStyle(overlayTilejson, config.overlay.layer, {
		field: config.choropleth.field,
		colorScheme: config.choropleth.colorScheme,
		min: config.choropleth.min,
		max: config.choropleth.max
	});

	// Merge styles
	const style = mergeStyles(backgroundStyle, overlayStyle);

	// Access maplibregl from global scope (loaded via CDN)
	const maplibregl = (window as unknown as { maplibregl: typeof import('maplibre-gl') }).maplibregl;

	// Initialize map
	const map = new maplibregl.Map({
		container: containerId,
		style
	});

	// Fit to bounds if available
	if (config.bounds) {
		const bounds: LngLatBoundsLike = [
			[config.bounds[0], config.bounds[1]],
			[config.bounds[2], config.bounds[3]]
		];
		map.fitBounds(bounds, { padding: 20 });
	}

	return map;
}

// Export all utilities for advanced usage
export {
	COLOR_SCHEMES,
	COLOR_SCHEME_NAMES,
	mergeStyles,
	getChoroplethStyle,
	getColorStops,
	createBackgroundStyle
};

export type {
	ChoroplethParams,
	ColorSchemeName,
	BackgroundMap,
	TileJSONSpecificationVector,
	StyleSpecification
};
