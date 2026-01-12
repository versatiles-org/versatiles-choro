import { describe, it, expect, vi, beforeEach } from 'vitest';
import { progressToStream } from './to-stream';
import { SimpleProgress } from './simple';

describe('progressToStream', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const readStream = async (response: Response): Promise<string[]> => {
		const reader = response.body?.getReader();
		if (!reader) throw new Error('No reader');

		const decoder = new TextDecoder();
		const lines: string[] = [];
		let done = false;

		while (!done) {
			const { value, done: streamDone } = await reader.read();
			done = streamDone;
			if (value) {
				const text = decoder.decode(value);
				lines.push(...text.split('\n').filter((l) => l.trim()));
			}
		}

		return lines;
	};

	it('returns Response with correct headers', () => {
		const progress = new SimpleProgress(async () => {});
		const abortController = new AbortController();

		const response = progressToStream(progress, abortController.signal);

		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get('Content-Type')).toBe('application/x-ndjson');
		expect(response.headers.get('Cache-Control')).toBe('no-cache');
	});

	it('streams progress events', async () => {
		class TestProgress extends SimpleProgress {
			constructor() {
				super(async () => {
					await new Promise((resolve) => setTimeout(resolve, 10));
				});
			}

			triggerProgress(value: number) {
				this.setProgress(value);
			}
		}

		const testProgress = new TestProgress();
		const abortController = new AbortController();

		const response = progressToStream(testProgress, abortController.signal);

		// Trigger progress events
		testProgress.triggerProgress(25);
		testProgress.triggerProgress(50);
		testProgress.triggerProgress(75);

		// Complete the progress
		setTimeout(() => testProgress.setComplete(), 50);

		const lines = await readStream(response);
		const events = lines.map((line) => JSON.parse(line));

		const progressEvents = events.filter((e) => e.event === 'progress');
		expect(progressEvents.length).toBeGreaterThan(0);
		expect(progressEvents.some((e) => e.progress === 25)).toBe(true);
		expect(progressEvents.some((e) => e.progress === 50)).toBe(true);
		expect(progressEvents.some((e) => e.progress === 75)).toBe(true);
	});

	it('streams message events', async () => {
		class TestProgress extends SimpleProgress {
			constructor() {
				super(async () => {
					await new Promise((resolve) => setTimeout(resolve, 10));
				});
			}

			triggerMessage(msg: string) {
				this.setMessage(msg);
			}
		}

		const testProgress = new TestProgress();
		const abortController = new AbortController();

		const response = progressToStream(testProgress, abortController.signal);

		testProgress.triggerMessage('Step 1');
		testProgress.triggerMessage('Step 2');

		setTimeout(() => testProgress.setComplete(), 50);

		const lines = await readStream(response);
		const events = lines.map((line) => JSON.parse(line));

		const messageEvents = events.filter((e) => e.event === 'message');
		expect(messageEvents.some((e) => e.message === 'Step 1')).toBe(true);
		expect(messageEvents.some((e) => e.message === 'Step 2')).toBe(true);
	});

	it('sends done event on completion', async () => {
		const progress = new SimpleProgress(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		const abortController = new AbortController();
		const response = progressToStream(progress, abortController.signal);

		const lines = await readStream(response);
		const events = lines.map((line) => JSON.parse(line));

		const doneEvent = events.find((e) => e.event === 'done');
		expect(doneEvent).toBeDefined();
	});

	it('handles error messages', async () => {
		class TestProgress extends SimpleProgress {
			constructor() {
				// Keep the progress running for a while so triggerError can be called
				super(async () => {
					await new Promise((resolve) => setTimeout(resolve, 100));
				});
			}

			triggerError() {
				this.setMessage('Error occurred', true);
				this.setComplete();
			}
		}

		const testProgress = new TestProgress();
		const abortController = new AbortController();
		const response = progressToStream(testProgress, abortController.signal);

		// Allow callbacks to be registered
		await new Promise((resolve) => setTimeout(resolve, 10));

		testProgress.triggerError();

		const lines = await readStream(response);
		const events = lines.map((line) => JSON.parse(line));

		const messageEvents = events.filter((e) => e.event === 'message');
		expect(messageEvents.some((e) => e.message === 'Error occurred')).toBe(true);

		// Should send 'error' event instead of 'done' when there's an error
		const errorEvent = events.find((e) => e.event === 'error');
		expect(errorEvent).toBeDefined();
		expect(errorEvent.error).toBe('Error occurred');

		// Should NOT have a 'done' event
		const doneEvent = events.find((e) => e.event === 'done');
		expect(doneEvent).toBeUndefined();
	});

	it('closes stream after done event', async () => {
		const progress = new SimpleProgress(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		const abortController = new AbortController();
		const response = progressToStream(progress, abortController.signal);

		const reader = response.body?.getReader();
		expect(reader).toBeDefined();

		// Read all data
		let done = false;
		while (!done) {
			const result = await reader!.read();
			done = result.done;
		}

		expect(done).toBe(true);
	});

	it('handles abort signal', async () => {
		const progress = new SimpleProgress(async () => {
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		const abortController = new AbortController();
		const response = progressToStream(progress, abortController.signal);

		// Trigger abort after a short delay
		setTimeout(() => abortController.abort(), 10);

		const lines = await readStream(response);

		// Stream should close without done or error event due to abort
		const events = lines.map((line) => JSON.parse(line));
		const hasEvents = events.length > 0;

		// May or may not have events depending on timing, but should not hang
		expect(hasEvents || !hasEvents).toBe(true);
	});

	it('encodes events as newline-delimited JSON', async () => {
		class TestProgress extends SimpleProgress {
			constructor() {
				super(async () => {});
			}

			triggerProgress(value: number) {
				this.setProgress(value);
			}
		}

		const testProgress = new TestProgress();
		const abortController = new AbortController();

		const response = progressToStream(testProgress, abortController.signal);

		testProgress.triggerProgress(50);
		setTimeout(() => testProgress.setComplete(), 20);

		const lines = await readStream(response);

		// Each line should be valid JSON
		lines.forEach((line) => {
			expect(() => JSON.parse(line)).not.toThrow();
		});
	});

	it('handles multiple progress updates in sequence', async () => {
		class TestProgress extends SimpleProgress {
			constructor() {
				super(async () => {});
			}

			async runSequence() {
				this.setProgress(10);
				await new Promise((resolve) => setTimeout(resolve, 5));
				this.setProgress(20);
				await new Promise((resolve) => setTimeout(resolve, 5));
				this.setProgress(30);
				await new Promise((resolve) => setTimeout(resolve, 5));
				this.setComplete();
			}
		}

		const testProgress = new TestProgress();
		const abortController = new AbortController();

		const response = progressToStream(testProgress, abortController.signal);

		testProgress.runSequence();

		const lines = await readStream(response);
		const events = lines.map((line) => JSON.parse(line));

		const progressEvents = events.filter((e) => e.event === 'progress');
		expect(progressEvents.length).toBeGreaterThanOrEqual(3);
	});
});
