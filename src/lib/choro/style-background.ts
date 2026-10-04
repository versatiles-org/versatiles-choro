import { osm, type OsmOptions } from '@versatiles/style';
import type { StyleSpecification } from 'maplibre-gl';

export type BackgroundMap = 'Colorful' | 'Gray' | 'GrayBright' | 'GrayDark' | 'None';

// Mirrors the attribution of https://tiles.versatiles.org/tiles/osm/tiles.json
const ATTRIBUTION =
	'<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a> · <a href="http://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> <a href="https://esa-worldcover.org/en/data-access">ESA WorldCover 2021</a>';

export function createBackgroundStyle(
	backgroundMap: BackgroundMap | undefined,
	baseUrl: string = 'https://tiles.versatiles.org'
): StyleSpecification {
	const base: OsmOptions = {
		theme: 'colorful',
		text: { language: 'de' },
		urls: {
			base: baseUrl,
			// Inline the source, so the style stays synchronous and the tile URLs absolute
			osm: {
				tilejson: '3.0.0',
				tiles: [`${baseUrl}/tiles/osm/{z}/{x}/{y}`],
				vector_layers: [],
				minzoom: 0,
				maxzoom: 14,
				attribution: ATTRIBUTION
			}
		},
		projection: 'mercator',
		sky: false
	};

	let style: StyleSpecification;
	switch (backgroundMap) {
		case 'Colorful':
			style = osm(base);
			break;
		case 'Gray':
			style = osm({ ...base, recolor: { saturate: -1 } });
			break;
		case 'GrayBright':
			style = osm({
				...base,
				recolor: { saturate: -1, blend: { color: '#ffffff', amount: 0.5 } }
			});
			break;
		case 'GrayDark':
			style = osm({
				...base,
				recolor: {
					saturate: -1,
					invertBrightness: true,
					blend: { color: '#000000', amount: 0.5 }
				}
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
			case 'aerialway':
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
		// Unknown layer type - include it by default
		return true;
	});

	return style;
}
