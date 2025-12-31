import { type ChildProcess } from 'child_process';
import { Progress } from './types.js';
import { ProcessError, logError } from '../errors/index.js';

export class SpawnProgress extends Progress {
	private childProcess: ChildProcess;
	private name: string;
	private messageFilter: (line: string) => {
		progress?: number;
		message?: string;
		isError?: boolean;
	};
	private stderrBuffer: string[] = [];
	private stdoutBuffer: string[] = [];
	private maxBufferLines: number = 100;

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
		this.childProcess.on('close', (code, signal) => {
			if (code === 0) {
				this.setComplete();
			} else {
				const stderr = this.stderrBuffer.join('\n').trim();
				const error = new ProcessError(this.name, code, signal, stderr);
				logError(error, 'SpawnProgress');
				this.setMessage(error.message, true);
			}
		});

		this.childProcess.on('error', (err) => {
			logError(err, `SpawnProgress:${this.name}`);
			this.setMessage(`${this.name} process error: ${err.message}`, true);
		});

		this.childProcess.stderr?.on('data', (data) => {
			const lines = data.toString().split('\n');
			lines.forEach((line: string) => {
				if (line.trim()) {
					// Keep only the last N lines in buffer
					this.stderrBuffer.push(line);
					if (this.stderrBuffer.length > this.maxBufferLines) {
						this.stderrBuffer.shift();
					}
					this.handleLine(line, true);
				}
			});
		});

		this.childProcess.stdout?.on('data', (data) => {
			const lines = data.toString().split('\n');
			lines.forEach((line: string) => {
				if (line.trim()) {
					// Keep only the last N lines in buffer
					this.stdoutBuffer.push(line);
					if (this.stdoutBuffer.length > this.maxBufferLines) {
						this.stdoutBuffer.shift();
					}
					this.handleLine(line, false);
				}
			});
		});
	}

	private handleLine(line: string, isStderr: boolean) {
		const res = this.messageFilter(line);
		if (res.message !== undefined) {
			this.setMessage(res.message, res.isError ?? isStderr);
		}
		if (res.progress !== undefined) {
			this.setProgress(res.progress);
		}
	}

	aborting(): void {
		// Try graceful shutdown first, then force kill after timeout
		this.childProcess.kill('SIGTERM');
		setTimeout(() => {
			if (!this.childProcess.killed) {
				this.childProcess.kill('SIGKILL');
			}
		}, 5000);
	}
}
