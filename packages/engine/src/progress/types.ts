export type ProgressCb = (progress: number) => void;
export type MessageCb = (message: string, isError: boolean) => void;
export type CompleteCb = () => void;

export abstract class Progress {
	abstract onProgress(cb: ProgressCb): void;
	abstract onMessage(cb: MessageCb): void;
	abstract onComplete(cb: CompleteCb): void;
	abstract abort(): void;
	done(): Promise<void> {
		return new Promise<void>((resolve) => {
			this.onComplete(() => resolve());
		});
	}
}
