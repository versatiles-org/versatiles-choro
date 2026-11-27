/**
 * The format of an exported choropleth map, shared by the exporter and choro-lib.js.
 */

import type { TileJSONSpecificationVector } from '@versatiles/style';
import type { ColorSchemeName } from './color-schemes';
import type { BackgroundMap } from './style-background';

/**
 * Property holding each feature's fill color, as `#rrggbb`. Further color schemes will
 * follow as `color_1`, `color_2` and so on.
 */
export const COLOR_PROPERTY = 'color_0';

/** Property holding each feature's tooltip HTML. */
export const TOOLTIP_PROPERTY = 'tooltip_text';

/**
 * The properties an exported overlay keeps. Every other property is removed, so the
 * exported tiles carry no raw data.
 */
export const EXPORTED_PROPERTIES = [COLOR_PROPERTY, TOOLTIP_PROPERTY] as const;

/**
 * Contents of `config.json` in an export bundle.
 */
export interface ExportConfig {
	version: '2.0';
	overlay: {
		source: string;
		layer: string;
		tilejson: TileJSONSpecificationVector;
	};
	/** How `color_0` was computed. The map reads only `color_0`; this is for legends. */
	choropleth: {
		field: string;
		colorScheme: ColorSchemeName;
		min: number;
		max: number;
		colors: string[];
	};
	/** Whether the features carry `tooltip_text`. */
	tooltip: boolean;
	background: {
		style: BackgroundMap;
	};
	bounds?: [number, number, number, number];
}
