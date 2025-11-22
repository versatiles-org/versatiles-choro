import { Progress } from './types.js';

type Callback = () => void | Promise<void>;
interface Entry {
	message?: string;
	callback: Callback;
}

export class SimpleProgress extends Progress {
	private entries: Entry[];
	private total = 0;
	private position = 0;

	constructor(entries: (Entry | Callback)[] | Callback | Entry, message?: string) {
		super(message);
		this.entries = (Array.isArray(entries) ? entries.slice() : [entries]).map((entry) => {
			if (typeof entry === 'function') {
				return { callback: entry };
			} else {
				return entry;
			}
		});
		this.total = this.entries.length;
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
