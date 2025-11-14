
import { colorful, guessStyle, type StyleBuilderOptions } from "@versatiles/style";
import type { StyleSpecification } from "maplibre-gl";

export type BackgroundMap = 'Colorful' | 'Gray' | 'GrayBright' | 'GrayDark' | 'None';

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

export async function getOverlayStyle(overlayFile: string): Promise<StyleSpecification> {
	const resolver = await getTileSourceUrlResolver(overlayFile);
	const tileJson = await (await fetch(`${resolver('meta.json')}`)).json();
	tileJson.tiles = [resolver('{z}/{x}/{y}')];
	const style = await guessStyle(tileJson);
	style.layers = style.layers?.filter(layer => layer.type !== 'background');
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


async function getTileSourceUrlResolver(file: string): Promise<(url: string) => string> {
	const res = await fetch(`/api/tiles/init?file=${encodeURIComponent(file)}`);
	if (!res.ok) {
		throw new Error(`Failed to initialize tile server: ${await res.text()}`);
	}
	const data = await res.json() as { id: number };
	const origin = window.location.origin;
	return path => `${origin}/api/tiles/load?id=${data.id}&path=${path}`;
}
