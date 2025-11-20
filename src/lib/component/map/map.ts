import { TilesInitRequest, TilesInitResponse } from '$lib/api/types';
import {
	colorful,
	guessStyle,
	type StyleBuilderOptions,
	type TileJSONSpecification,
	type TileJSONSpecificationVector,
	type VectorLayer,
	Color
} from '@versatiles/style';
import type {
	BackgroundLayerSpecification,
	CircleLayerSpecification,
	FillLayerSpecification,
	LineLayerSpecification,
	StyleSpecification,
	VectorSourceSpecification
} from 'maplibre-gl';
import * as v from 'valibot';

export type BackgroundMap = 'Colorful' | 'Gray' | 'GrayBright' | 'GrayDark' | 'None';

class TileSource {
	prefix: string;
	tileJson: TileJSONSpecificationVector | null = null;
	constructor(prefix: string) {
		this.prefix = prefix;
	}
	async init(): Promise<void> {
		const tileJson = (await (
			await fetch(`${this.resolve('meta.json')}`)
		).json()) as TileJSONSpecificationVector;
		tileJson.tiles = [this.resolve('{z}/{x}/{y}')];
		this.tileJson = tileJson;
	}
	resolve(path: string): string {
		return `${this.prefix}${path}`;
	}
	getTileJson(): TileJSONSpecification {
		if (!this.tileJson) {
			throw new Error('TileSource not initialized');
		}
		return this.tileJson!;
	}
	getStyle(): StyleSpecification {
		if (!this.tileJson) {
			throw new Error('TileSource not initialized');
		}
		const style = getInspectorStyle(this.tileJson);
		style.layers = style.layers?.filter((layer) => layer.type !== 'background');
		return style;
	}
	getBounds(): [number, number, number, number] | undefined {
		return this.tileJson?.bounds;
	}
}

export function createStyle(backgroundMap: BackgroundMap | undefined): StyleSpecification {
	const base: StyleBuilderOptions = {
		baseUrl: 'https://tiles.versatiles.org',
		language: 'de'
	};

	let style: StyleSpecification;
	switch (backgroundMap) {
		case 'Colorful':
			style = colorful(base);
			break;
		case 'Gray':
			style = colorful({ ...base, recolor: { saturate: -1 } });
			break;
		case 'GrayBright':
			style = colorful({
				...base,
				recolor: { saturate: -1, blendColor: '#ffffff', blend: 0.5 }
			});
			break;
		case 'GrayDark':
			style = colorful({
				...base,
				recolor: { saturate: -1, invertBrightness: true, blendColor: '#000000', blend: 0.5 }
			});
			break;
		case undefined:
		case 'None':
			style = { version: 8, sources: {}, layers: [] };
			break;
		default:
			throw new Error(`Unknown background map: ${backgroundMap}`);
	}

	style.layers = style.layers?.filter((layer) => {
		switch (layer.id.split(/[-:]/)[0]) {
			case 'street':
			case 'transport':
			case 'symbol':
			case 'poi':
			case 'bridge':
			case 'way':
			case 'tunnel':
			case 'marking':
				return false;
			case 'background':
			case 'boundary':
			case 'building':
			case 'label':
			case 'airport':
			case 'site':
			case 'land':
			case 'water':
				return true;
		}
		console.log(layer.id);
		return true;
	});

	return style;
}

export function overlayStyles(
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

export async function getTileSource(input: string): Promise<TileSource> {
	const req = v.parse(TilesInitRequest, { input });
	const res = await fetch('/api/tiles/init', { body: JSON.stringify(req), method: 'POST' });
	if (!res.ok) {
		throw new Error(`Failed to initialize tile server: ${await res.text()}`);
	}
	const data = v.parse(TilesInitResponse, await res.json());
	const origin = window.location.origin;
	const source = new TileSource(`${origin}/api/tiles/load?id=${data.id}&path=`);
	await source.init();
	return source;
}

function getInspectorStyle(spec: TileJSONSpecificationVector): StyleSpecification {
	const sourceName = 'vectorSource';

	const layers: {
		background: BackgroundLayerSpecification[];
		point: CircleLayerSpecification[];
		line: LineLayerSpecification[];
		fill: FillLayerSpecification[];
	} = { background: [], point: [], line: [], fill: [] };

	layers.background.push({
		id: 'background',
		type: 'background',
		paint: { 'background-color': '#fff' }
	});

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
		layers: [...layers.background, ...layers.fill, ...layers.line, ...layers.point]
	};
}
