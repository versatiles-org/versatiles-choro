import { Progress } from './types.js';

export class SimpleProgress extends Progress {
	private callbacks: (() => void | Promise<void>)[];
	private total = 0;
	private position = 0;

	constructor(message: string, callbacks: (() => void | Promise<void>)[]) {
		super(message);
		this.callbacks = callbacks.slice();
		this.total = callbacks.length;
		this.runNext();
	}

	private runNext() {
		setTimeout(async () => {
			if (this.callbacks.length === 0) {
				return this.setComplete();
			}

			const nextCallback = this.callbacks.shift()!;
			await nextCallback();

			this.position++;
			this.setProgress(100 * this.position / this.total);

			this.runNext();
		}, 1);
	}

	aborting(): void {
		this.callbacks = [];
	}
}
