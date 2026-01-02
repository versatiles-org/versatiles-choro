import { spawn } from 'child_process';
import { convert, type ProgressData, type MessageData } from '@versatiles/versatiles-rs';
import { CallbackProgress, Progress, SpawnProgress } from '../progress/index.js';

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
	// Map old options to new API
	const convertOptions: {
		minZoom?: number;
		maxZoom?: number;
		bbox?: [number, number, number, number];
		compress?: 'gzip' | 'brotli' | 'uncompressed';
	} = {};

	if (options?.minZoom !== undefined) convertOptions.minZoom = Number(options.minZoom);
	if (options?.maxZoom !== undefined) convertOptions.maxZoom = Number(options.maxZoom);
	if (options?.bbox) convertOptions.bbox = options.bbox as [number, number, number, number];
	if (options?.compress)
		convertOptions.compress = String(options.compress) as 'gzip' | 'brotli' | 'uncompressed';

	// Create callbacks for progress tracking
	let progressCallback: ((progress: number) => void) | undefined;
	let messageCallback: ((message: string, isError: boolean) => void) | undefined;

	const promise = convert(
		inputFile,
		outputFile,
		convertOptions,
		(data: ProgressData) => {
			// ProgressData has: position, total, percentage, speed, eta, message
			progressCallback?.(data.percentage);
		},
		(data: MessageData) => {
			// MessageData has: type ('step' | 'warning' | 'error'), message
			const isError = data.type === 'error' || data.type === 'warning';
			messageCallback?.(data.message, isError);
		}
	);

	return new CallbackProgress(
		promise,
		(cb) => {
			progressCallback = cb;
		},
		(cb) => {
			messageCallback = cb;
		}
	);
}
