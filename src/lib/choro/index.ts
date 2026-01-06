/**
 * Choro library - shared choropleth map styling utilities
 *
 * This module provides functions for creating choropleth map styles
 * compatible with MapLibre GL JS and VersaTiles.
 */

// Re-export color scheme utilities
export {
	COLOR_SCHEMES,
	COLOR_SCHEME_NAMES,
	viridis,
	plasma,
	inferno,
	magma,
	type ColorSchemeName,
	type ChoroplethParams
} from './color-schemes';

// Re-export style utilities
export { mergeStyles, getInspectorStyle, getChoroplethStyle, getColorStops } from './style';

// Re-export background style utilities
export { createBackgroundStyle, type BackgroundMap } from './style-background';

// Export types for use in config
export type { TileJSONSpecificationVector, VectorLayer } from '@versatiles/style';
export type { StyleSpecification } from 'maplibre-gl';
