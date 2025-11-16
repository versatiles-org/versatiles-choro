type ProgressCb = (progress: number) => void;
type MessageCb = (message: string, isError: boolean) => void;
type CompleteCb = () => void;

export abstract class Progress {
	protected progress: number = 0;
	protected message: string = '';
	protected isError: boolean = false;
	protected onProgressCb: null | ProgressCb = null;
	protected onMessageCb: null | MessageCb = null;
	protected onCompleteCb: null | CompleteCb = null;

	constructor(message?: string, progress?: number) {
		this.setMessage(message ?? '');
		this.setProgress(progress ?? 0);
	}

	setProgress(progress: number) {
		progress = Math.round(progress);
		if (progress === this.progress) return;
		this.progress = progress;
		if (this.onProgressCb) this.onProgressCb(progress);
	}
	setMessage(message: string, isError: boolean = false) {
		if (message === this.message && isError === this.isError) return;
		this.message = message;
		this.isError = this.isError || isError;
		if (this.onMessageCb) this.onMessageCb(message, this.isError);
	}
	setComplete() {
		if (this.onCompleteCb) this.onCompleteCb();
	}

	onProgress(cb: ProgressCb): void {
		this.onProgressCb = cb;
		cb(this.progress);
	}

	onMessage(cb: MessageCb): void {
		this.onMessageCb = cb;
		cb(this.message, this.isError);
	}

	onComplete(cb: CompleteCb): void {
		this.onCompleteCb = cb;
	}

	abstract aborting(): void;
	abort(): void {
		this.aborting();
		this.setComplete();
	}

	done(): Promise<void> {
		return new Promise<void>((resolve) => {
			this.onComplete(() => resolve());
		});
	}
}
