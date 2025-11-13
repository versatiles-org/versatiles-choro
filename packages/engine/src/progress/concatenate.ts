import { Progress } from './types.js';

export class ConcatenatedProgress extends Progress {
	private todos: (() => Progress | Promise<Progress>)[];
	private currentProgress: null | Progress = null;

	constructor(progresses: (() => Progress | Promise<Progress>)[]) {
		super();
		this.todos = progresses;
		this.runNext();
	}

	private async runNext() {
		if (this.todos.length === 0) {
			this.setComplete();
			return;
		}
		const nextTodo = this.todos.shift()!;
		this.currentProgress = await nextTodo();
		this.currentProgress.onProgress((progress) => {
			this.setProgress(progress);
		});
		this.currentProgress.onMessage((message, isError) => {
			this.setMessage(message, isError);
		});
		this.currentProgress.onComplete(() => {
			this.runNext();
		});
	}

	aborting(): void {
		this.currentProgress?.abort();
		this.todos = [];
	}
}
