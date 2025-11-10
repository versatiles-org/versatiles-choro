
import { spawn } from 'child_process';

function optionsToArgs(options: Record<string, any>): string[] {
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

export async function runTippecanoe(inputFile: string, outputFile: string, options?: Record<string, any>): Promise<void> {
	const child = spawn('tippecanoe', [
		'-o', outputFile,
		...optionsToArgs(options || {}),
		inputFile
	], { stdio: 'inherit' });

	return new Promise((resolve, reject) => {
		child.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`tippecanoe exited with code ${code}`));
			}
		});
	});
}

export async function runVersaTilesConvert(inputFile: string, outputFile: string, options?: Record<string, any>): Promise<void> {
	const child = spawn('versatiles', [
		'convert',
		...optionsToArgs(options || {}),
		inputFile,
		outputFile,
	], { stdio: 'inherit' });

	return new Promise((resolve, reject) => {
		child.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`versatiles exited with code ${code}`));
			}
		});
	});
}