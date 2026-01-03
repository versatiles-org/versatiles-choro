import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CallbackProgress } from './callback';

describe('CallbackProgress', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('completes when promise resolves', async () => {
		const promise = Promise.resolve();
		const progress = new CallbackProgress(promise);

		const completeCb = vi.fn();
		progress.onComplete(completeCb);

		await promise;
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(completeCb).toHaveBeenCalled();
	});

	it('handles progress callback updates', async () => {
		let progressCb: ((progress: number) => void) | null = null;
		const promise = new Promise<void>((resolve) => setTimeout(resolve, 100));

		const progress = new CallbackProgress(promise, (cb) => {
			progressCb = cb;
		});

		const progressValues: number[] = [];
		progress.onProgress((p) => progressValues.push(p));

		// Trigger progress updates
		progressCb!(25);
		progressCb!(50);
		progressCb!(75);

		expect(progressValues).toContain(25);
		expect(progressValues).toContain(50);
		expect(progressValues).toContain(75);
	});

	it('handles message callback updates', async () => {
		let messageCb: ((message: string, isError: boolean) => void) | null = null;
		const promise = new Promise<void>((resolve) => setTimeout(resolve, 100));

		const progress = new CallbackProgress(promise, undefined, (cb) => {
			messageCb = cb;
		});

		const messages: Array<{ message: string; isError: boolean }> = [];
		progress.onMessage((msg, isErr) => messages.push({ message: msg, isError: isErr }));

		// Trigger message updates
		messageCb!('Processing', false);
		messageCb!('Warning', false);

		expect(messages).toContainEqual({ message: 'Processing', isError: false });
		expect(messages).toContainEqual({ message: 'Warning', isError: false });
	});

	it('handles error messages', async () => {
		let messageCb: ((message: string, isError: boolean) => void) | null = null;
		const promise = new Promise<void>((resolve) => setTimeout(resolve, 100));

		const progress = new CallbackProgress(promise, undefined, (cb) => {
			messageCb = cb;
		});

		const messages: Array<{ message: string; isError: boolean }> = [];
		progress.onMessage((msg, isErr) => messages.push({ message: msg, isError: isErr }));

		messageCb!('Error occurred', true);

		expect(messages).toContainEqual({ message: 'Error occurred', isError: true });
	});

	it('handles promise rejection', async () => {
		const testError = new Error('Test error');
		const promise = Promise.reject(testError);

		const progress = new CallbackProgress(promise);

		const messages: string[] = [];
		progress.onMessage((msg) => messages.push(msg));

		await promise.catch(() => {});
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(messages).toContain('Error: Test error');
	});

	it('stops emitting updates after abort', async () => {
		let progressCb: ((progress: number) => void) | null = null;
		let messageCb: ((message: string, isError: boolean) => void) | null = null;
		const promise = new Promise<void>((resolve) => setTimeout(resolve, 1000));

		const progress = new CallbackProgress(
			promise,
			(cb) => {
				progressCb = cb;
			},
			(cb) => {
				messageCb = cb;
			}
		);

		const progressValues: number[] = [];
		const messages: string[] = [];
		progress.onProgress((p) => progressValues.push(p));
		progress.onMessage((msg) => messages.push(msg));

		progressCb!(25);
		messageCb!('Before abort', false);

		progress.abort();

		// These should be ignored after abort
		progressCb!(50);
		messageCb!('After abort', false);

		expect(progressValues).toContain(25);
		expect(progressValues).not.toContain(50);
		expect(messages).toContain('Before abort');
		expect(messages).not.toContain('After abort');
	});

	it('ignores completion after abort', async () => {
		const promise = Promise.resolve();
		const progress = new CallbackProgress(promise);

		progress.abort();

		const completeCb = vi.fn();
		progress.onComplete(completeCb);

		await promise;
		await new Promise((resolve) => setTimeout(resolve, 10));

		// Should complete once from abort, but not from promise resolution
		expect(completeCb).toHaveBeenCalledTimes(1);
	});

	it('works without progress callback', async () => {
		const promise = Promise.resolve();
		const progress = new CallbackProgress(promise);

		const completeCb = vi.fn();
		progress.onComplete(completeCb);

		await promise;
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(completeCb).toHaveBeenCalled();
	});

	it('works without message callback', async () => {
		const promise = Promise.resolve();
		const progress = new CallbackProgress(promise);

		const completeCb = vi.fn();
		progress.onComplete(completeCb);

		await promise;
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(completeCb).toHaveBeenCalled();
	});

	it('handles both progress and message callbacks', async () => {
		let progressCb: ((progress: number) => void) | null = null;
		let messageCb: ((message: string, isError: boolean) => void) | null = null;
		const promise = new Promise<void>((resolve) => setTimeout(resolve, 100));

		const progress = new CallbackProgress(
			promise,
			(cb) => {
				progressCb = cb;
			},
			(cb) => {
				messageCb = cb;
			}
		);

		const progressValues: number[] = [];
		const messages: string[] = [];
		progress.onProgress((p) => progressValues.push(p));
		progress.onMessage((msg) => messages.push(msg));

		progressCb!(30);
		messageCb!('Step 1', false);
		progressCb!(60);
		messageCb!('Step 2', false);

		expect(progressValues).toEqual([0, 30, 60]);
		expect(messages).toContain('Step 1');
		expect(messages).toContain('Step 2');
	});
});
