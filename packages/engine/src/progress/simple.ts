import { CompleteCb, MessageCb, Progress, ProgressCb } from './types.js';

export class SimpleProgress extends Progress {
	private message: string = '';
	private progress: number = 0;
	private callbacks: (() => void | Promise<void>)[];
	private onProgressCb: null | ProgressCb = null;
	private onMessageCb: null | MessageCb = null;
	private onCompleteCb: null | CompleteCb = null;

	constructor(
		message: string,
		callbacks: (() => void | Promise<void>)[],
	) {
		super();
		this.message = message;
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

	onProgress(cb: ProgressCb): void {
		this.onProgressCb = cb;
		cb(this.progress);
	}

	onMessage(cb: MessageCb): void {
		this.onMessageCb = cb;
		cb(this.message, false);
	}

	onComplete(cb: CompleteCb): void {
		this.onCompleteCb = cb;
	}

	abort(): void {
		this.callbacks = [];
	}
}
