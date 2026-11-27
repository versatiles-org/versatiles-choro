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
import {
	mergeStyles,
	getChoroplethStyle,
	getChoroplethLayerId,
	getColorStops,
	getExportedChoroplethStyle
} from './style';
import { createBackgroundStyle, type BackgroundMap } from './style-background';
import { interpolateTemplate } from './tooltip';
import { COLOR_PROPERTY, TOOLTIP_PROPERTY, type ExportConfig } from './export-config';
import type { TileJSONSpecificationVector } from '@versatiles/style';
import type { StyleSpecification, Map as MaplibreMap, LngLatBoundsLike } from 'maplibre-gl';

/**
 * Creates a complete MapLibre style for a choropleth map from export configuration.
 */
export function createStyleFromConfig(
	config: ExportConfig,
	versatilesTileUrl: string = '{versatiles_url}'
): StyleSpecification {
	const backgroundStyle = createBackgroundStyle(config.background.style);

	// Point the overlay tiles at the VersaTiles server that serves the export
	const overlayTilejson: TileJSONSpecificationVector = {
		...config.overlay.tilejson,
		tiles: [`${versatilesTileUrl}/${config.overlay.source}/{z}/{x}/{y}`]
	};

	const overlayStyle = getExportedChoroplethStyle(overlayTilejson, config.overlay.layer);

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

	const style = createStyleFromConfig(config, versatilesTileUrl);

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

	if (config.tooltip) {
		setupTooltip(map, getChoroplethLayerId(config.overlay.layer));
	}

	return map;
}

/**
 * Sets up a tooltip that follows the mouse cursor and shows each feature's `tooltip_text`.
 */
function setupTooltip(map: MaplibreMap, layerId: string): void {
	// Create tooltip element
	const tooltip = document.createElement('div');
	tooltip.style.cssText = `
		position: absolute;
		max-width: 300px;
		background: white;
		border: 1px solid #ccc;
		border-radius: 4px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
		font-size: 12px;
		padding: 8px 12px;
		pointer-events: none;
		z-index: 1000;
		display: none;
	`;
	document.body.appendChild(tooltip);

	let hideTimeout: ReturnType<typeof setTimeout> | null = null;

	function hide() {
		tooltip.style.display = 'none';
		map.getCanvas().style.cursor = '';
	}

	map.on('mousemove', layerId, (e) => {
		if (hideTimeout) {
			clearTimeout(hideTimeout);
			hideTimeout = null;
		}

		const content = e.features?.[0]?.properties?.[TOOLTIP_PROPERTY];
		if (content === undefined || content === null || content === '') {
			hide();
			return;
		}

		tooltip.innerHTML = String(content);
		tooltip.style.display = 'block';
		tooltip.style.left = `${e.originalEvent.pageX + 15}px`;
		tooltip.style.top = `${e.originalEvent.pageY + 15}px`;
		map.getCanvas().style.cursor = 'pointer';
	});

	map.on('mouseleave', layerId, () => {
		hideTimeout = setTimeout(() => {
			hide();
			hideTimeout = null;
		}, 100);
	});
}

// Export all utilities for advanced usage
export {
	COLOR_SCHEMES,
	COLOR_SCHEME_NAMES,
	COLOR_PROPERTY,
	TOOLTIP_PROPERTY,
	mergeStyles,
	getChoroplethStyle,
	getChoroplethLayerId,
	getExportedChoroplethStyle,
	getColorStops,
	createBackgroundStyle,
	interpolateTemplate
};

export type {
	ChoroplethParams,
	ColorSchemeName,
	BackgroundMap,
	ExportConfig,
	TileJSONSpecificationVector,
	StyleSpecification
};
