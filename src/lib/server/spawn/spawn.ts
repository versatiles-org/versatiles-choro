import { type ChildProcess, spawn } from 'child_process';
import { Progress, SpawnProgress } from '../progress/index.js';

function optionsToArgs(options: Record<string, unknown>): string[] {
	const args: string[] = [];
	for (const [key, value] of Object.entries(options)) {
		if (typeof value === 'boolean') {
			if (value) {
				args.push(`--${key}`);
			}
		} else {
			args.push(`--${key}`, String(value));
		}
	}
	return args;
}

export async function runTippecanoe(
	inputFile: string,
	outputFile: string,
	options?: Record<string, unknown>
): Promise<Progress> {
	const child = spawn('tippecanoe', ['-o', outputFile, ...optionsToArgs(options || {}), inputFile]);

	return new SpawnProgress(child, 'tippecanoe', (line) => {
		let matches;

		matches = /^Reordering geometry: (\d+)%/.exec(line);
		if (matches) return { progress: Number(matches[1]), message: 'Reordering geometry' };

		matches = /^\s+(\d+\.\d+)%\s+\d+\/\d+\/\d+/.exec(line);
		if (matches) return { progress: Number(matches[1]), message: 'Building tiles' };

		return {};
	});
}

export async function runVersaTilesConvert(
	inputFile: string,
	outputFile: string,
	options?: Record<string, unknown>
): Promise<Progress> {
	const child = spawn(
		'versatiles',
		['convert', ...optionsToArgs(options || {}), inputFile, outputFile],
		{ stdio: 'pipe' }
	);

	return new SpawnProgress(child, 'versatiles convert', (line) => {
		const matches = /\(\s*(\d+)%\)/.exec(line);
		if (matches) return { progress: Number(matches[1]), message: 'Converting tiles' };

		return {};
	});
}

export function runVersaTilesServer(inputFile: string, port: number): ChildProcess {
	return spawn('versatiles', ['server', '--port', String(port), `[${port}]${inputFile}`], {
		stdio: 'inherit'
	});
}
