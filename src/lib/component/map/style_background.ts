import { colorful, type StyleBuilderOptions } from '@versatiles/style';
import type { StyleSpecification } from 'maplibre-gl';

export type BackgroundMap = 'Colorful' | 'Gray' | 'GrayBright' | 'GrayDark' | 'None';

export function createBackgroundStyle(
	backgroundMap: BackgroundMap | undefined
): StyleSpecification {
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
