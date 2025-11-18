import { Progress } from './types.js';

export async function logProgress(progress: Progress) {
	let message = '';
	let hasErrors = false;
	let position = 0;

	progress.onProgress((p) => {
		position = p;
		log();
	});
	
	progress.onMessage((m, isError) => {
		if (isError) hasErrors = true;
		message = m;
		log();
	});

	function log() {
		const color = hasErrors ? '\x1b[31m' : '\x1b[32m';
		let line = `${color}${message}`;
		if (position > 0) line += `: ${position} %`;
		process.stdout.write(`\x1b[2K\r${line}\x1b[0m\x1b[?25l`);
	}

	return new Promise<void>((resolve) => {
		progress.onComplete(() => resolve());
	});
}
