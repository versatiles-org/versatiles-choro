
import { colorful, guessStyle, type StyleBuilderOptions, type TileJSONSpecification } from "@versatiles/style";
import type { StyleSpecification } from "maplibre-gl";

export type BackgroundMap = 'Colorful' | 'Gray' | 'GrayBright' | 'GrayDark' | 'None';

class TileSource {
	prefix: string;
	tileJson: TileJSONSpecification | null = null;
	constructor(prefix: string) {
		this.prefix = prefix;
	}
	async init(): Promise<void> {
		let tileJson = await (await fetch(`${this.resolve('meta.json')}`)).json() as TileJSONSpecification;
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
		style.layers = style.layers?.filter(layer => layer.type !== 'background');
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

	switch (backgroundMap) {
		case 'Colorful':
			return colorful(base);
		case 'Gray':
			return colorful({ ...base, recolor: { saturate: -1 } });
		case 'GrayBright':
			return colorful({
				...base,
				recolor: { saturate: -1, blendColor: '#ffffff', blend: 0.5 }
			});
		case 'GrayDark':
			return colorful({
				...base,
				recolor: { saturate: -1, invertBrightness: true, blendColor: '#000000', blend: 0.5 }
			});
		case undefined:
		case 'None':
			return { version: 8, sources: {}, layers: [] };
		default:
			throw new Error(`Unknown background map: ${backgroundMap}`);
	}
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
	const data = await res.json() as { id: number };
	const origin = window.location.origin;
	let source = new TileSource(`${origin}/api/tiles/load?id=${data.id}&path=`);
	await source.init();
	return source;
}
