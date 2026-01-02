import { Progress } from './types.js';

export class CallbackProgress extends Progress {
	private promise: Promise<void>;
	private aborted: boolean = false;

	constructor(
		promise: Promise<void>,
		onProgress?: (callback: (progress: number) => void) => void,
		onMessage?: (callback: (message: string, isError: boolean) => void) => void
	) {
		super();
		this.promise = promise;

		// Register callbacks
		if (onProgress) {
			onProgress((progress) => {
				if (!this.aborted) this.setProgress(progress);
			});
		}

		if (onMessage) {
			onMessage((message, isError) => {
				if (!this.aborted) this.setMessage(message, isError);
			});
		}

		// Handle completion
		promise
			.then(() => {
				if (!this.aborted) this.setComplete();
			})
			.catch((err) => {
				if (!this.aborted) this.setMessage(String(err), true);
			});
	}

	aborting(): void {
		this.aborted = true;
		// Note: Cannot abort convert() - Promise doesn't support cancellation
		// Best we can do is ignore further updates
	}
}
