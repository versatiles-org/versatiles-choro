import { Progress } from './types.js';

interface Entry {
	message?: string,
	callback: () => void | Promise<void>
};

export class SimpleProgress extends Progress {
	private entries: Entry[];
	private total = 0;
	private position = 0;

	constructor(entries: Entry[], message?: string) {
		super(message);
		this.entries = entries.slice();
		this.total = entries.length;
		this.runNext();
	}

	private runNext() {
		setTimeout(async () => {
			if (this.entries.length === 0) {
				this.setMessage('Finished');
				this.setProgress(100);
				return this.setComplete();
			}

			const entry = this.entries.shift()!;

			if (entry.message) this.setMessage(entry.message);
			this.setProgress((100 * this.position) / this.total);
			this.position++;

			await entry.callback();

			this.runNext();
		}, 1);
	}

	aborting(): void {
		this.entries = [];
	}
}
