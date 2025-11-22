import type { Progress } from './types.js';

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
		if (!m || m == message) return;
		if (message) process.stdout.write('\n');
		message = m;
		log();
	});

	function log() {
		const color = hasErrors ? '\x1b[31m' : '\x1b[32m';
		let line = position.toFixed(0) + '%';
		line = ' '.repeat(4 - line.length) + line;
		if (message) line += ` - ${message}`;
		process.stdout.write(`\x1b[2K\r${color}${line}\x1b[0m\x1b[?25l`);
	}

	return new Promise<void>((resolve) => {
		progress.onComplete(() => {
			process.stdout.write('\n');
			resolve();
		});
	});
}
