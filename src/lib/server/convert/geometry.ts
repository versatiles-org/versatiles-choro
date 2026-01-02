import { ConcatenatedProgress, Progress, SimpleProgress } from '../progress';
import { runTippecanoe, runVersaTilesConvert } from '../spawn/spawn';
import { validateOutputExtension, safeDelete } from './utils.js';

export function convertPolygonsToVersatiles(input: string, output: string): Progress {
	validateOutputExtension(output, '.versatiles');
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
		() => new SimpleProgress(() => safeDelete(mbtilesFile), 'Cleaning up temporary files')
	]);
}
