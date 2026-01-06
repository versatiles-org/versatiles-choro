import { Color, type TileJSONSpecificationVector, type VectorLayer } from '@versatiles/style';
import type {
	CircleLayerSpecification,
	DataDrivenPropertyValueSpecification,
	FillLayerSpecification,
	LineLayerSpecification,
	StyleSpecification,
	VectorSourceSpecification
} from 'maplibre-gl';
import { COLOR_SCHEMES, type ChoroplethParams } from './color-schemes';

export function mergeStyles(
	style1: StyleSpecification,
	style2: StyleSpecification
): StyleSpecification {
	return {
		sources: {
			...style1.sources,
			...style2.sources
		},
		layers: [...(style1.layers ?? []), ...(style2.layers ?? [])],
		version: 8
	};
}

export function getInspectorStyle(spec: TileJSONSpecificationVector): StyleSpecification {
	const sourceName = 'vectorSource';

	const layers: {
		point: CircleLayerSpecification[];
		line: LineLayerSpecification[];
		fill: FillLayerSpecification[];
	} = { point: [], line: [], fill: [] };

	spec.vector_layers.forEach((vector_layer: VectorLayer) => {
		let luminosity = 'bright',
			saturation,
			hue;

		if (/water|ocean|lake|sea|river/.test(vector_layer.id)) hue = 'blue';
		if (/state|country|place/.test(vector_layer.id)) hue = 'pink';
		if (/road|highway|transport|streets/.test(vector_layer.id)) hue = 'orange';
		if (/contour|building/.test(vector_layer.id)) hue = 'monochrome';
		if (vector_layer.id.includes('building')) luminosity = 'dark';
		if (/contour|landuse/.test(vector_layer.id)) hue = 'yellow';
		if (/wood|forest|park|landcover|land/.test(vector_layer.id)) hue = 'green';

		if (vector_layer.id.includes('point')) {
			saturation = 'strong';
			luminosity = 'light';
		}

		const color = Color.HSV.randomColor({
			hue,
			luminosity,
			saturation,
			seed: vector_layer.id,
			opacity: 0.6
		}).asString();

		layers.point.push({
			id: `${sourceName}-${vector_layer.id}-point`,
			'source-layer': vector_layer.id,
			source: sourceName,
			type: 'circle',
			filter: ['==', '$type', 'Point'],
			paint: { 'circle-color': color, 'circle-radius': 2 }
		});

		layers.line.push({
			id: `${sourceName}-${vector_layer.id}-line`,
			'source-layer': vector_layer.id,
			source: sourceName,
			type: 'line',
			filter: ['==', '$type', 'LineString'],
			layout: { 'line-join': 'round', 'line-cap': 'round' },
			paint: { 'line-color': color }
		});

		layers.fill.push({
			id: `${sourceName}-${vector_layer.id}-polygon`,
			'source-layer': vector_layer.id,
			source: sourceName,
			type: 'fill',
			filter: ['==', '$type', 'Polygon'],
			paint: {
				'fill-color': color,
				'fill-opacity': 0.3,
				'fill-antialias': true,
				'fill-outline-color': color
			}
		});
	});

	const source: VectorSourceSpecification = { tiles: spec.tiles, type: 'vector' };
	if (spec.minzoom != null) source.minzoom = spec.minzoom;
	if (spec.maxzoom != null) source.maxzoom = spec.maxzoom;
	if (spec.attribution != null) source.attribution = spec.attribution;
	if (spec.scheme != null) source.scheme = spec.scheme;

	return {
		version: 8,
		sources: {
			[sourceName]: source
		},
		layers: [...layers.fill, ...layers.line, ...layers.point]
	};
}

/**
 * Creates a choropleth style for a specific layer with data-driven fill colors.
 */
export function getChoroplethStyle(
	spec: TileJSONSpecificationVector,
	layerName: string,
	choropleth: ChoroplethParams
): StyleSpecification {
	const sourceName = 'vectorSource';
	const colors = COLOR_SCHEMES[choropleth.colorScheme];

	// Build interpolation stops from color scheme
	const colorStops: (number | string)[] = [];
	const range = choropleth.max - choropleth.min;

	colors.forEach((color, index) => {
		const value = choropleth.min + (range * index) / (colors.length - 1);
		colorStops.push(value, color);
	});

	// Create fill-color expression with interpolation
	const fillColor: DataDrivenPropertyValueSpecification<string> = [
		'interpolate',
		['linear'],
		['get', choropleth.field],
		...colorStops
	];

	const layers: (FillLayerSpecification | LineLayerSpecification)[] = [];

	// Add choropleth fill layer for the target layer
	layers.push({
		id: `${sourceName}-${layerName}-choropleth`,
		'source-layer': layerName,
		source: sourceName,
		type: 'fill',
		filter: ['==', '$type', 'Polygon'],
		paint: {
			'fill-color': fillColor,
			'fill-opacity': 0.7,
			'fill-antialias': true
		}
	});

	// Add outline layer for clarity
	layers.push({
		id: `${sourceName}-${layerName}-outline`,
		'source-layer': layerName,
		source: sourceName,
		type: 'line',
		filter: ['==', '$type', 'Polygon'],
		paint: {
			'line-color': '#333333',
			'line-width': 0.5,
			'line-opacity': 0.5
		}
	});

	const source: VectorSourceSpecification = { tiles: spec.tiles, type: 'vector' };
	if (spec.minzoom != null) source.minzoom = spec.minzoom;
	if (spec.maxzoom != null) source.maxzoom = spec.maxzoom;
	if (spec.attribution != null) source.attribution = spec.attribution;
	if (spec.scheme != null) source.scheme = spec.scheme;

	return {
		version: 8,
		sources: {
			[sourceName]: source
		},
		layers
	};
}

/**
 * Resolves the color array for a choropleth based on the color scheme and min/max values.
 * Returns an array of { value, color } stops that can be used for interpolation.
 */
export function getColorStops(choropleth: ChoroplethParams): { value: number; color: string }[] {
	const colors = COLOR_SCHEMES[choropleth.colorScheme];
	const range = choropleth.max - choropleth.min;

	return colors.map((color, index) => ({
		value: choropleth.min + (range * index) / (colors.length - 1),
		color
	}));
}
