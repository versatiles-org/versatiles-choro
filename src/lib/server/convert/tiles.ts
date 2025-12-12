import type { VPLParam } from '$lib/api/vpl';
import { ConcatenatedProgress, SimpleProgress, type Progress } from '../progress';
import { type InferOutput } from 'valibot';
import { runVersaTilesConvert } from '../spawn/spawn';
import { tmpdir } from 'os';
import { resolve } from 'path';
import { buildVPL } from '../tiles/vpl';
import { unlinkSync, writeFileSync } from 'fs';

export function convertTiles(vpl: InferOutput<typeof VPLParam>, output: string): Progress {
	if (!output.endsWith('.versatiles')) {
		throw new Error('Output file must have a .versatiles extension');
	}
	const vplFile = resolve(tmpdir(), Math.random().toString(36).substring(2) + '.vpl');
	writeFileSync(vplFile, buildVPL(vpl));
	return new ConcatenatedProgress([
		() => runVersaTilesConvert(vplFile, output),
		() => new SimpleProgress(() => unlinkSync(vplFile), 'Cleaning up temporary file')
	]);
}
