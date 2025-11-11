import { ConcatenatedProgress, Progress } from '../lib.js';
import { runTippecanoe, runVersaTilesConvert } from './spawn.js';

export async function convertPolygonsToVersatiles(
	input: string,
	output: string
): Promise<Progress> {
	if (!output.endsWith('.versatiles')) {
		throw new Error('Output file must have a .versatiles extension');
	}
	const mbtilesFile = output.replace(/\.versatiles$/, '.mbtiles');
	console.log(`Converting polygons from ${input} to tiles at ${mbtilesFile}`);
	return new ConcatenatedProgress([
		() =>
			runTippecanoe(input, mbtilesFile, {
				force: true,
				'maximum-zoom': 14
			}),
		() =>
			runVersaTilesConvert(mbtilesFile, output, {
				compress: 'brotli'
			})
	]);
}
