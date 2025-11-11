import { CompleteCb, MessageCb, Progress, ProgressCb } from './types.js';

export class ConcatenatedProgress implements Progress {
	private todos: (() => Promise<Progress>)[];
	private currentProgress: null | Progress = null;
	private onProgressCb: null | ProgressCb = null;
	private onMessageCb: null | MessageCb = null;
	private onCompleteCb: null | CompleteCb = null;

	constructor(progresses: (() => Promise<Progress>)[]) {
		this.todos = progresses;
		this.runNext();
	}

	private async runNext() {
		if (this.todos.length === 0) {
			if (this.onCompleteCb) this.onCompleteCb();
			return;
		}
		const nextTodo = this.todos.shift()!;
		this.currentProgress = await nextTodo();
		this.currentProgress.onProgress((progress) => {
			if (this.onProgressCb) this.onProgressCb(progress);
		});
		this.currentProgress.onMessage((message, isError) => {
			if (this.onMessageCb) this.onMessageCb(message, isError);
		});
		this.currentProgress.onComplete(() => {
			this.runNext();
		});
	}

	onProgress(cb: ProgressCb): void {
		this.onProgressCb = cb;
	}

	onMessage(cb: MessageCb): void {
		this.onMessageCb = cb;
	}

	onComplete(cb: CompleteCb): void {
		this.onCompleteCb = cb;
	}

	abort(): void {
		this.currentProgress?.abort();
		this.todos = [];
		if (this.onCompleteCb) this.onCompleteCb();
	}
}
