export type ProgressCb = (progress: number) => void;
export type MessageCb = (message: string, isError: boolean) => void;
export type CompleteCb = () => void;

export interface Progress {
	onProgress(cb: ProgressCb): void;
	onMessage(cb: MessageCb): void;
	onComplete(cb: CompleteCb): void;
	abort(): void;
}
