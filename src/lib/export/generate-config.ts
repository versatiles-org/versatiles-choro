/**
 * Generates the export configuration for a choropleth map.
 */

import type { TileJSONSpecificationVector } from '@versatiles/style';
import { COLOR_SCHEMES, type ChoroplethParams } from '#lib/choro/color-schemes.js';
import { COLOR_PROPERTY, TOOLTIP_PROPERTY, type ExportConfig } from '#lib/choro/export-config.js';
import type { BackgroundMap } from '#lib/choro/style-background.js';

export type { ExportConfig } from '#lib/choro/export-config.js';

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
	const tooltip = Boolean(choropleth.tooltipTemplate);

	// The exported overlay keeps only the computed properties, so list only those.
	const fields: Record<string, 'String'> = { [COLOR_PROPERTY]: 'String' };
	if (tooltip) fields[TOOLTIP_PROPERTY] = 'String';

	const exportTilejson: TileJSONSpecificationVector = {
		...tilejson,
		tiles: [], // Will be set by the viewer based on the VersaTiles server URL
		vector_layers: tilejson.vector_layers.map((layer) => ({
			...layer,
			fields: layer.id === layerName ? { ...fields } : {}
		}))
	};

	const config: ExportConfig = {
		version: '2.0',
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
			colors: [...COLOR_SCHEMES[choropleth.colorScheme]]
		},
		tooltip,
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
