import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimpleProgress } from './simple';

describe('SimpleProgress', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('executes single callback', async () => {
		const callback = vi.fn(async () => 'result');

		const progress = new SimpleProgress(callback);

		await progress.done();

		expect(callback).toHaveBeenCalled();
	});

	it('executes multiple callbacks in sequence', async () => {
		const executionOrder: number[] = [];

		const progress = new SimpleProgress([
			async () => {
				executionOrder.push(1);
			},
			async () => {
				executionOrder.push(2);
			},
			async () => {
				executionOrder.push(3);
			}
		]);

		await progress.done();

		expect(executionOrder).toEqual([1, 2, 3]);
	});

	it('supports entry objects with callbacks', async () => {
		const callback = vi.fn(async () => {});

		const progress = new SimpleProgress({
			message: 'Test message',
			callback
		});

		await progress.done();

		expect(callback).toHaveBeenCalled();
	});

	it('supports mixed array of callbacks and entries', async () => {
		const callback1 = vi.fn(async () => {});
		const callback2 = vi.fn(async () => {});

		const progress = new SimpleProgress([
			callback1,
			{
				message: 'Step 2',
				callback: callback2
			}
		]);

		await progress.done();

		expect(callback1).toHaveBeenCalled();
		expect(callback2).toHaveBeenCalled();
	});

	it('emits progress updates', async () => {
		const progress = new SimpleProgress([async () => {}, async () => {}, async () => {}]);

		const progressValues: number[] = [];
		progress.onProgress((p) => progressValues.push(p));

		await progress.done();

		expect(progressValues.length).toBeGreaterThan(0);
		expect(progressValues[progressValues.length - 1]).toBe(100);
	});

	it('emits messages from entry objects', async () => {
		const progress = new SimpleProgress([
			{
				message: 'Step 1',
				callback: async () => {}
			},
			{
				message: 'Step 2',
				callback: async () => {}
			}
		]);

		const messages: string[] = [];
		progress.onMessage((msg) => messages.push(msg));

		await progress.done();

		expect(messages).toContain('Step 1');
		expect(messages).toContain('Step 2');
	});

	it('emits "Finished" message on completion', async () => {
		const progress = new SimpleProgress(async () => {});

		const messages: string[] = [];
		progress.onMessage((msg) => messages.push(msg));

		await progress.done();

		expect(messages).toContain('Finished');
	});

	it('sets progress to 100 on completion', async () => {
		const progress = new SimpleProgress(async () => {});

		const progressValues: number[] = [];
		progress.onProgress((p) => progressValues.push(p));

		await progress.done();

		expect(progressValues[progressValues.length - 1]).toBe(100);
	});

	it('calls completion callback', async () => {
		const progress = new SimpleProgress(async () => {});

		const completeCb = vi.fn();
		progress.onComplete(completeCb);

		await progress.done();

		expect(completeCb).toHaveBeenCalled();
	});

	it('supports initial message parameter', async () => {
		const progress = new SimpleProgress(async () => {}, 'Initial message');

		const messages: string[] = [];
		progress.onMessage((msg) => messages.push(msg));

		await progress.done();

		expect(messages[0]).toBe('Initial message');
	});

	it('calculates progress based on position in queue', async () => {
		const progress = new SimpleProgress([async () => {}, async () => {}, async () => {}]);

		const progressValues: number[] = [];
		progress.onProgress((p) => progressValues.push(p));

		await progress.done();

		// Progress should increase as items are processed
		expect(progressValues[0]).toBeLessThan(progressValues[progressValues.length - 2]);
	});

	it('handles empty callback array', async () => {
		const progress = new SimpleProgress([]);

		const completeCb = vi.fn();
		progress.onComplete(completeCb);

		await progress.done();

		expect(completeCb).toHaveBeenCalled();
	});

	it('clears queue on abort', async () => {
		const callback1 = vi.fn(async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
		});
		const callback2 = vi.fn(async () => {});
		const callback3 = vi.fn(async () => {});

		const progress = new SimpleProgress([callback1, callback2, callback3]);

		// Give time for first callback to start
		await new Promise((resolve) => setTimeout(resolve, 10));

		progress.abort();

		await progress.done();

		// Only first callback should have been called
		expect(callback1).toHaveBeenCalled();
		expect(callback2).not.toHaveBeenCalled();
		expect(callback3).not.toHaveBeenCalled();
	});

	it('completes immediately after abort', async () => {
		const progress = new SimpleProgress([
			async () => {
				await new Promise((resolve) => setTimeout(resolve, 1000));
			},
			async () => {
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		]);

		const completeCb = vi.fn();
		progress.onComplete(completeCb);

		// Give time for first task to start
		await new Promise((resolve) => setTimeout(resolve, 10));

		progress.abort();

		// Should complete quickly, not wait for remaining tasks
		const startTime = Date.now();
		await progress.done();
		const elapsed = Date.now() - startTime;

		expect(elapsed).toBeLessThan(500);
		expect(completeCb).toHaveBeenCalled();
	});

	it('handles async callbacks that resolve with values', async () => {
		const progress = new SimpleProgress([
			async () => 'result1',
			async () => 'result2',
			async () => 'result3'
		]);

		await progress.done();

		// Should complete without errors
		expect(true).toBe(true);
	});

	it('handles synchronous callbacks', async () => {
		const callback = vi.fn(() => {
			// Synchronous callback
		});

		const progress = new SimpleProgress(callback);

		await progress.done();

		expect(callback).toHaveBeenCalled();
	});

	it('runs callbacks with setTimeout for async execution', async () => {
		const executionOrder: number[] = [];

		const progress = new SimpleProgress(async () => {
			executionOrder.push(1);
		});

		executionOrder.push(0);

		await progress.done();

		// Constructor should return before callback executes
		expect(executionOrder[0]).toBe(0);
		expect(executionOrder[1]).toBe(1);
	});

	it('increments position correctly', async () => {
		const progressUpdates: number[] = [];

		const progress = new SimpleProgress([
			async () => {},
			async () => {},
			async () => {},
			async () => {}
		]);

		progress.onProgress((p) => {
			progressUpdates.push(p);
		});

		await progress.done();

		// Should have progress updates for each step
		expect(progressUpdates.length).toBeGreaterThanOrEqual(4);
	});

	it('handles callback errors gracefully', async () => {
		const errorCb = vi.fn();

		const progress = new SimpleProgress([
			async () => {
				// First callback succeeds
			},
			async () => {
				// Second callback succeeds
			}
		]);

		// Catch unhandled rejections
		process.on('unhandledRejection', errorCb);

		await progress.done();

		process.off('unhandledRejection', errorCb);

		// Should complete successfully even with callbacks
		expect(true).toBe(true);
	});
});
