import { ConcatenatedProgress, Progress, SimpleProgress } from '../progress';
import { runTippecanoe, runVersaTilesConvert } from '../spawn/spawn';
import { unlink } from 'fs/promises';
import { ValidationError } from '../errors/index.js';

export function convertPolygonsToVersatiles(input: string, output: string): Progress {
	if (!output.endsWith('.versatiles')) {
		throw new ValidationError('Output file must have a .versatiles extension');
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
		() => new SimpleProgress(() => unlink(mbtilesFile), 'Cleaning up temporary files')
	]);
}
