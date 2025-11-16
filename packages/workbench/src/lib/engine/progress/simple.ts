import { Progress } from './types.js';

export class SimpleProgress extends Progress {
	private callbacks: (() => void | Promise<void>)[];

	constructor(message: string, callbacks: (() => void | Promise<void>)[]) {
		super(message);
		this.callbacks = callbacks.slice();
		this.runNext();
	}

	private runNext() {
		setTimeout(async () => {
			if (this.callbacks.length === 0) {
				if (this.onCompleteCb) this.onCompleteCb();
				return;
			}
			const nextCallback = this.callbacks.shift()!;
			await nextCallback();
			this.progress++;
			if (this.onProgressCb) this.onProgressCb(this.progress);
			this.runNext();
		}, 1);
	}

	aborting(): void {
		this.callbacks = [];
	}
}
