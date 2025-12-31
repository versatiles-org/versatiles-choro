import type { VPLParam } from '$lib/api/vpl';
import { ConcatenatedProgress, SimpleProgress, type Progress } from '../progress';
import { type InferOutput } from 'valibot';
import { runVersaTilesConvert } from '../spawn/spawn';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildVPL } from '../tiles/vpl';
import { mkdtemp, writeFile, unlink } from 'fs/promises';
import { ValidationError } from '../errors/index.js';

export function convertTiles(vpl: InferOutput<typeof VPLParam>, output: string): Progress {
	if (!output.endsWith('.versatiles')) {
		throw new ValidationError('Output file must have a .versatiles extension');
	}

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
		() => new SimpleProgress(() => unlink(vplFile), 'Cleaning up temporary file')
	]);
}
