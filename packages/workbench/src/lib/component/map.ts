import { colorful, type StyleBuilderOptions } from "@versatiles/style";
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