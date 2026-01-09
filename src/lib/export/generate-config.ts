/**
 * Generates the export configuration for a choropleth map.
 */

import type { TileJSONSpecificationVector } from '@versatiles/style';
import {
	COLOR_SCHEMES,
	type ChoroplethParams,
	type ColorSchemeName
} from '$lib/choro/color-schemes';
import type { BackgroundMap } from '$lib/choro/style-background';

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
		tooltipTemplate?: string;
	};
	background: {
		style: BackgroundMap;
	};
	bounds?: [number, number, number, number];
}

/**
 * Parameters for generating export configuration.
 */
export interface GenerateConfigParams {
	/** Name of the overlay source file (e.g., 'overlay.versatiles') */
	overlaySourceFile: string;
	/** Name of the vector tile layer to style */
	layerName: string;
	/** TileJSON metadata for the overlay tiles */
	tilejson: TileJSONSpecificationVector;
	/** Choropleth styling parameters */
	choropleth: ChoroplethParams;
	/** Background map style */
	backgroundStyle: BackgroundMap;
}

/**
 * Generates the export configuration JSON for a choropleth map.
 */
export function generateConfig(params: GenerateConfigParams): ExportConfig {
	const { overlaySourceFile, layerName, tilejson, choropleth, backgroundStyle } = params;

	// Get the colors array from the color scheme
	const colors = COLOR_SCHEMES[choropleth.colorScheme];

	// Clean up tilejson for export - remove the tiles URL since it will be set at runtime
	const exportTilejson: TileJSONSpecificationVector = {
		...tilejson,
		tiles: [] // Will be set by the viewer based on the VersaTiles server URL
	};

	const config: ExportConfig = {
		version: '1.0',
		overlay: {
			source: overlaySourceFile,
			layer: layerName,
			tilejson: exportTilejson
		},
		choropleth: {
			field: choropleth.field,
			colorScheme: choropleth.colorScheme,
			min: choropleth.min,
			max: choropleth.max,
			colors: [...colors],
			tooltipTemplate: choropleth.tooltipTemplate
		},
		background: {
			style: backgroundStyle
		}
	};

	// Add bounds if available
	if (tilejson.bounds) {
		config.bounds = tilejson.bounds as [number, number, number, number];
	}

	return config;
}
