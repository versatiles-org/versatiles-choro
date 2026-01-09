import * as v from 'valibot';
import { VPLParam } from './vpl';
import { Path } from './basics';

export const ChoroplethParamsSchema = v.object({
	field: v.string(),
	colorScheme: v.picklist(['viridis', 'plasma', 'inferno', 'magma']),
	min: v.number(),
	max: v.number(),
	tooltipTemplate: v.optional(v.string())
});

export const BackgroundMapSchema = v.picklist([
	'Colorful',
	'Gray',
	'GrayBright',
	'GrayDark',
	'None'
]);

export const ExportRequest = v.object({
	vpl: VPLParam,
	choropleth: ChoroplethParamsSchema,
	layerName: v.string(),
	backgroundStyle: BackgroundMapSchema,
	outputPath: Path,
	tilejson: v.any() // TileJSONSpecificationVector - complex type, validated at runtime
});
