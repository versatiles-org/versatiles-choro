import { ConcatenatedProgress, Progress } from '../progress/index.js';
import { runTippecanoe, runVersaTilesConvert } from '../lib/spawn.js';
import { SimpleProgress } from '../progress/simple.js';
import { unlink } from 'fs/promises';

export function convertPolygonsToVersatiles(input: string, output: string): Progress {
	if (!output.endsWith('.versatiles')) {
		throw new Error('Output file must have a .versatiles extension');
	}
	const mbtilesFile = output.replace(/\.versatiles$/, '.mbtiles');
	return new ConcatenatedProgress([
		() =>
			runTippecanoe(input, mbtilesFile, {
				force: true,
				'maximum-zoom': 'g'
			}),
		() =>
			runVersaTilesConvert(mbtilesFile, output, {
				compress: 'brotli'
			}),
		() => new SimpleProgress('Cleaning up temporary files', [() => unlink(mbtilesFile)])
	]);
}
