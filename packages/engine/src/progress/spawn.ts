import { ChildProcess } from 'child_process';
import { CompleteCb, MessageCb, Progress, ProgressCb } from './types.js';

export class SpawnProgress extends Progress {
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
		super();
		this.childProcess = childProcess;
		this.name = name;
		this.messageFilter = messageFilter;
		this.setupListeners();
	}

	private setupListeners() {
		this.childProcess.on('close', (code) => {
			console.log(`${this.name} process closed with code ${code}`);
			if (code === 0) {
				if (this.onCompleteCb) this.onCompleteCb();
			} else {
				if (this.onMessageCb) this.onMessageCb(`${this.name} exited with code ${code}`, true);
			}
		});
		this.childProcess.stderr?.on('data', (data) => {
			console.log(`${this.name} process stderr: ${data.toString()}`);
			this.handleLine(data.toString());
		});
		this.childProcess.stdout?.on('data', (data) => {
			console.log(`${this.name} process stdout: ${data.toString()}`);
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
