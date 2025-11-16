import { type ChildProcess } from 'child_process';
import { Progress } from './types.js';

export class SpawnProgress extends Progress {
	private childProcess: ChildProcess;
	private name: string;
	private messageFilter: (line: string) => {
		progress?: number;
		message?: string;
		isError?: boolean;
	};

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
			if (code === 0) {
				this.setComplete();
			} else {
				this.setMessage(`${this.name} exited with code ${code}`, true);
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
		const res = this.messageFilter(line);
		if (res.message !== undefined) {
			this.setMessage(res.message, res.isError ?? false);
		}
		if (res.progress !== undefined) {
			this.setProgress(res.progress);
		}
	}

	aborting(): void {
		this.childProcess.kill();
	}
}
