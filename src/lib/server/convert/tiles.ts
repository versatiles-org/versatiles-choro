import type { VPLParam } from '$lib/api/vpl';
import { ConcatenatedProgress, SimpleProgress, type Progress } from '../progress';
import { type InferOutput } from 'valibot';
import { runVersaTilesConvert } from '../spawn/spawn';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildVPL } from '../tiles/vpl';
import { mkdtemp, writeFile } from 'fs/promises';
import { validateOutputExtension, safeDelete } from './utils.js';

export function convertTiles(vpl: InferOutput<typeof VPLParam>, output: string): Progress {
	validateOutputExtension(output, '.versatiles');

	let vplFile = '';

	return new ConcatenatedProgress([
		() =>
			new SimpleProgress(async () => {
				// Create secure temporary directory
				const tempDir = await mkdtemp(join(tmpdir(), 'versatiles-'));
				vplFile = join(tempDir, 'tiles.vpl');
				// Write VPL file asynchronously
				await writeFile(vplFile, buildVPL(vpl));
			}, 'Creating temporary VPL file'),
		() => runVersaTilesConvert(vplFile, output),
		() => new SimpleProgress(() => safeDelete(vplFile), 'Cleaning up temporary file')
	]);
}
