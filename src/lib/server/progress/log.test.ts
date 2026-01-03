import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logProgress } from './log';
import { SimpleProgress } from './simple';

describe('logProgress', () => {
	let stdoutWriteSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.clearAllMocks();
		stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
	});

	afterEach(() => {
		stdoutWriteSpy.mockRestore();
	});

	it('logs progress percentage', async () => {
		class TestProgress extends SimpleProgress {
			constructor() {
				super(async () => {});
			}

			triggerProgress(value: number) {
				this.setProgress(value);
			}
		}

		const testProgress = new TestProgress();
		const logPromise = logProgress(testProgress);

		testProgress.triggerProgress(25);
		testProgress.triggerProgress(50);
		testProgress.triggerProgress(75);

		setTimeout(() => testProgress.setComplete(), 50);

		await logPromise;

		const calls = stdoutWriteSpy.mock.calls.map((call: unknown[]) => call[0] as string);

		// Should contain progress percentages
		expect(calls.some((call: string) => call.includes('25%'))).toBe(true);
		expect(calls.some((call: string) => call.includes('50%'))).toBe(true);
		expect(calls.some((call: string) => call.includes('75%'))).toBe(true);
	});

	it('logs messages', async () => {
		class TestProgress extends SimpleProgress {
			constructor() {
				super(async () => {});
			}

			triggerMessage(msg: string) {
				this.setMessage(msg);
			}
		}

		const testProgress = new TestProgress();
		const logPromise = logProgress(testProgress);

		testProgress.triggerMessage('Processing data');
		testProgress.triggerMessage('Almost done');

		setTimeout(() => testProgress.setComplete(), 50);

		await logPromise;

		const calls = stdoutWriteSpy.mock.calls.map((call: unknown[]) => call[0] as string);

		expect(calls.some((call: string) => call.includes('Processing data'))).toBe(true);
		expect(calls.some((call: string) => call.includes('Almost done'))).toBe(true);
	});

	it('uses green color for normal progress', async () => {
		class TestProgress extends SimpleProgress {
			constructor() {
				super(async () => {});
			}

			triggerProgress(value: number) {
				this.setProgress(value);
			}
		}

		const testProgress = new TestProgress();
		const logPromise = logProgress(testProgress);

		testProgress.triggerProgress(50);

		setTimeout(() => testProgress.setComplete(), 50);

		await logPromise;

		const calls = stdoutWriteSpy.mock.calls.map((call: unknown[]) => call[0] as string);

		// Green color code: \x1b[32m
		expect(calls.some((call: string) => call.includes('\x1b[32m'))).toBe(true);
	});

	it('uses red color when error occurs', async () => {
		class TestProgress extends SimpleProgress {
			constructor() {
				super(async () => {});
			}

			triggerError(msg: string) {
				this.setMessage(msg, true);
			}
		}

		const testProgress = new TestProgress();
		const logPromise = logProgress(testProgress);

		testProgress.triggerError('An error occurred');

		setTimeout(() => testProgress.setComplete(), 50);

		await logPromise;

		const calls = stdoutWriteSpy.mock.calls.map((call: unknown[]) => call[0] as string);

		// Red color code: \x1b[31m
		expect(calls.some((call: string) => call.includes('\x1b[31m'))).toBe(true);
	});

	it('writes newline before new message', async () => {
		class TestProgress extends SimpleProgress {
			constructor() {
				super(async () => {});
			}

			triggerMessage(msg: string) {
				this.setMessage(msg);
			}
		}

		const testProgress = new TestProgress();
		const logPromise = logProgress(testProgress);

		testProgress.triggerMessage('First message');
		await new Promise((resolve) => setTimeout(resolve, 10));
		testProgress.triggerMessage('Second message');

		setTimeout(() => testProgress.setComplete(), 50);

		await logPromise;

		const calls = stdoutWriteSpy.mock.calls.map((call: unknown[]) => call[0] as string);

		// Should have newlines between messages
		expect(calls.some((call: string) => call === '\n')).toBe(true);
	});

	it('writes final newline on completion', async () => {
		const progress = new SimpleProgress(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		await logProgress(progress);

		const calls = stdoutWriteSpy.mock.calls.map((call: unknown[]) => call[0] as string);

		// Last call should be a newline
		expect(calls[calls.length - 1]).toBe('\n');
	});

	it('pads progress percentage to 4 characters', async () => {
		class TestProgress extends SimpleProgress {
			constructor() {
				super(async () => {});
			}

			triggerProgress(value: number) {
				this.setProgress(value);
			}
		}

		const testProgress = new TestProgress();
		const logPromise = logProgress(testProgress);

		testProgress.triggerProgress(5);
		testProgress.triggerProgress(50);
		testProgress.triggerProgress(100);

		setTimeout(() => testProgress.setComplete(), 50);

		await logPromise;

		const calls = stdoutWriteSpy.mock.calls.map((call: unknown[]) => call[0] as string);

		// Check for padded values
		expect(calls.some((call: string) => call.includes('  5%') || call.includes('   5%'))).toBe(
			true
		);
		expect(calls.some((call: string) => call.includes(' 50%'))).toBe(true);
		expect(calls.some((call: string) => call.includes('100%'))).toBe(true);
	});

	it('skips duplicate messages', async () => {
		class TestProgress extends SimpleProgress {
			constructor() {
				super(async () => {});
			}

			triggerMessage(msg: string) {
				this.setMessage(msg);
			}
		}

		const testProgress = new TestProgress();
		const logPromise = logProgress(testProgress);

		testProgress.triggerMessage('Same message');
		testProgress.triggerMessage('Same message');
		testProgress.triggerMessage('Same message');

		setTimeout(() => testProgress.setComplete(), 50);

		await logPromise;

		const calls = stdoutWriteSpy.mock.calls.map((call: unknown[]) => call[0] as string);
		const messagesWithText = calls.filter((call: string) => call.includes('Same message'));

		// Should only log the message once, not multiple times
		expect(messagesWithText.length).toBe(1);
	});

	it('combines progress and message in output', async () => {
		class TestProgress extends SimpleProgress {
			constructor() {
				super(async () => {});
			}

			trigger(progress: number, message: string) {
				this.setProgress(progress);
				this.setMessage(message);
			}
		}

		const testProgress = new TestProgress();
		const logPromise = logProgress(testProgress);

		testProgress.trigger(50, 'Halfway done');

		setTimeout(() => testProgress.setComplete(), 50);

		await logPromise;

		const calls = stdoutWriteSpy.mock.calls.map((call: unknown[]) => call[0] as string);

		// Should have output with both progress and message
		expect(
			calls.some((call: string) => call.includes('50%') && call.includes('Halfway done'))
		).toBe(true);
	});

	it('clears line and returns carriage on each update', async () => {
		class TestProgress extends SimpleProgress {
			constructor() {
				super(async () => {});
			}

			triggerProgress(value: number) {
				this.setProgress(value);
			}
		}

		const testProgress = new TestProgress();
		const logPromise = logProgress(testProgress);

		testProgress.triggerProgress(25);

		setTimeout(() => testProgress.setComplete(), 50);

		await logPromise;

		const calls = stdoutWriteSpy.mock.calls.map((call: unknown[]) => call[0] as string);

		// Should contain clear line (\x1b[2K) and carriage return (\r)
		expect(calls.some((call: string) => call.includes('\x1b[2K\r'))).toBe(true);
	});

	it('hides cursor during progress', async () => {
		const progress = new SimpleProgress(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		await logProgress(progress);

		const calls = stdoutWriteSpy.mock.calls.map((call: unknown[]) => call[0] as string);

		// Should hide cursor: \x1b[?25l
		expect(calls.some((call: string) => call.includes('\x1b[?25l'))).toBe(true);
	});

	it('resolves when progress completes', async () => {
		const progress = new SimpleProgress(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		const startTime = Date.now();
		await logProgress(progress);
		const endTime = Date.now();

		expect(endTime - startTime).toBeGreaterThanOrEqual(10);
	});
});
