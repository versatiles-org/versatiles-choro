import {
	colorful,
	guessStyle,
	type StyleBuilderOptions,
	type TileJSONSpecification
} from '@versatiles/style';
import type { StyleSpecification } from 'maplibre-gl';

export type BackgroundMap = 'Colorful' | 'Gray' | 'GrayBright' | 'GrayDark' | 'None';

class TileSource {
	prefix: string;
	tileJson: TileJSONSpecification | null = null;
	constructor(prefix: string) {
		this.prefix = prefix;
	}
	async init(): Promise<void> {
		const tileJson = (await (
			await fetch(`${this.resolve('meta.json')}`)
		).json()) as TileJSONSpecification;
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
		const style = guessStyle(this.getTileJson());
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

export function overlayStyles(style: StyleSpecification, overlayStyle: StyleSpecification): void {
	if (!overlayStyle.layers) return;
	console.log(overlayStyle.layers);
	for (const layer of overlayStyle.layers) {
		style.layers?.push(layer);
	}
	style.sources = {
		...style.sources,
		...overlayStyle.sources
	};
}

export async function getTileSource(file: string): Promise<TileSource> {
	const res = await fetch(`/api/tiles/init?file=${encodeURIComponent(file)}`);
	if (!res.ok) {
		throw new Error(`Failed to initialize tile server: ${await res.text()}`);
	}
	const data = (await res.json()) as { id: number };
	const origin = window.location.origin;
	const source = new TileSource(`${origin}/api/tiles/load?id=${data.id}&path=`);
	await source.init();
	return source;
}
