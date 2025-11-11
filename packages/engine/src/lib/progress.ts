import { ChildProcess } from 'child_process';

export type ProgressCb = (progress: number) => void;
export type MessageCb = (message: string, isError: boolean) => void;
export type CompleteCb = () => void;

export interface Progress {
	onProgress(cb: ProgressCb): void;
	onMessage(cb: MessageCb): void;
	onComplete(cb: CompleteCb): void;
	abort(): void;
}

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

export function logProgress(progress: Progress) {
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
}

export class SpawnProgress implements Progress {
	private childProcess: ChildProcess;
	private name: string;
	private lastMessage: string = '';
	private lastProgress: number = -1;
	private messageFilter: (line: string) => {
		progress?: number;
		message?: string;
		isError?: boolean;
	};
	private onProgressCb: null | ProgressCb = null;
	private onMessageCb: null | MessageCb = null;
	private onCompleteCb: null | CompleteCb = null;

	constructor(
		childProcess: ChildProcess,
		name: string,
		messageFilter: (line: string) => { progress?: number; message?: string; isError?: boolean }
	) {
		this.childProcess = childProcess;
		this.name = name;
		this.messageFilter = messageFilter;
		this.setupListeners();
	}

	private setupListeners() {
		this.childProcess.on('close', (code) => {
			if (code === 0) {
				if (this.onCompleteCb) this.onCompleteCb();
			} else {
				if (this.onMessageCb) this.onMessageCb(`${this.name} exited with code ${code}`, true);
			}
		});
		this.childProcess.stderr?.on('data', (data) => {
			this.handleLine(data.toString());
		});
		this.childProcess.stdout?.on('data', (data) => {
			this.handleLine(data.toString());
		});
	}

	private handleLine(line: string) {
		const filteredMessage = this.messageFilter(line);
		if (filteredMessage.message !== undefined && this.onMessageCb) {
			if (filteredMessage.message !== this.lastMessage) {
				this.lastMessage = filteredMessage.message;
				this.onMessageCb(filteredMessage.message, filteredMessage.isError ?? false);
			}
		}
		if (filteredMessage.progress !== undefined && this.onProgressCb) {
			if (filteredMessage.progress !== this.lastProgress) {
				this.lastProgress = filteredMessage.progress;
				this.onProgressCb(filteredMessage.progress);
			}
		}
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
		this.childProcess.kill();
	}
}
