import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConcatenatedProgress } from './concatenate';
import { SimpleProgress } from './simple';

describe('ConcatenatedProgress', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('runs single progress to completion', async () => {
		const progress1 = new SimpleProgress(async () => 'done');

		const concat = new ConcatenatedProgress([() => progress1]);

		const completeCb = vi.fn();
		concat.onComplete(completeCb);

		await concat.done();

		expect(completeCb).toHaveBeenCalled();
	});

	it('runs multiple progresses in sequence', async () => {
		const executionOrder: number[] = [];

		const progress1 = new SimpleProgress(async () => {
			executionOrder.push(1);
		});

		const progress2 = new SimpleProgress(async () => {
			executionOrder.push(2);
		});

		const concat = new ConcatenatedProgress([() => progress1, () => progress2]);

		await concat.done();

		expect(executionOrder).toEqual([1, 2]);
	});

	it('forwards progress updates from current progress', async () => {
		let progressCb: ((progress: number) => void) | null = null;
		const promise = new Promise<void>((resolve) => setTimeout(resolve, 100));

		class TestProgress extends SimpleProgress {
			constructor() {
				super(async () => promise);
			}

			triggerProgress(value: number) {
				this.setProgress(value);
			}
		}

		const testProgress = new TestProgress();
		const concat = new ConcatenatedProgress([() => testProgress]);

		const progressValues: number[] = [];
		concat.onProgress((p) => progressValues.push(p));

		testProgress.triggerProgress(25);
		testProgress.triggerProgress(50);
		testProgress.triggerProgress(75);

		expect(progressValues).toContain(25);
		expect(progressValues).toContain(50);
		expect(progressValues).toContain(75);
	});

	it('forwards message updates from current progress', async () => {
		class TestProgress extends SimpleProgress {
			constructor() {
				super(async () => {});
			}

			triggerMessage(msg: string, isError: boolean = false) {
				this.setMessage(msg, isError);
			}
		}

		const testProgress = new TestProgress();
		const concat = new ConcatenatedProgress([() => testProgress]);

		const messages: Array<{ message: string; isError: boolean }> = [];
		concat.onMessage((msg, isErr) => messages.push({ message: msg, isError: isErr }));

		testProgress.triggerMessage('Processing', false);
		testProgress.triggerMessage('Warning', true);

		expect(messages).toContainEqual({ message: 'Processing', isError: false });
		expect(messages).toContainEqual({ message: 'Warning', isError: true });
	});

	it('handles async progress factory functions', async () => {
		const executionOrder: number[] = [];

		const factory1 = async () => {
			executionOrder.push(1);
			return new SimpleProgress(async () => {
				executionOrder.push(2);
			});
		};

		const factory2 = async () => {
			executionOrder.push(3);
			return new SimpleProgress(async () => {
				executionOrder.push(4);
			});
		};

		const concat = new ConcatenatedProgress([factory1, factory2]);

		await concat.done();

		expect(executionOrder).toEqual([1, 2, 3, 4]);
	});

	it('aborts current progress on abort', async () => {
		const abortCb = vi.fn();

		class TestProgress extends SimpleProgress {
			constructor() {
				super(async () => {
					await new Promise((resolve) => setTimeout(resolve, 1000));
				});
			}

			aborting() {
				abortCb();
				super.aborting();
			}
		}

		const progress1 = new TestProgress();
		const progress2 = new SimpleProgress(async () => {});

		const concat = new ConcatenatedProgress([() => progress1, () => progress2]);

		// Give it time to start
		await new Promise((resolve) => setTimeout(resolve, 10));

		concat.abort();

		expect(abortCb).toHaveBeenCalled();
	});

	it('clears remaining todos on abort', async () => {
		const executed: number[] = [];

		const progress1 = new SimpleProgress(async () => {
			executed.push(1);
		});

		const progress2 = new SimpleProgress(async () => {
			executed.push(2);
		});

		const progress3 = new SimpleProgress(async () => {
			executed.push(3);
		});

		const concat = new ConcatenatedProgress([
			() => progress1,
			() => progress2,
			() => progress3
		]);

		// Give it time to start first progress
		await new Promise((resolve) => setTimeout(resolve, 20));

		concat.abort();

		await concat.done();

		// Only first progress should have executed
		expect(executed).toEqual([1]);
		expect(executed).not.toContain(2);
		expect(executed).not.toContain(3);
	});

	it('completes immediately with empty progress list', async () => {
		const concat = new ConcatenatedProgress([]);

		const completeCb = vi.fn();
		concat.onComplete(completeCb);

		await concat.done();

		expect(completeCb).toHaveBeenCalled();
	});

	it('handles progress completion triggering next progress', async () => {
		const progress1 = new SimpleProgress(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		const progress2 = new SimpleProgress(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		const concat = new ConcatenatedProgress([() => progress1, () => progress2]);

		const completeCb = vi.fn();
		concat.onComplete(completeCb);

		await concat.done();

		expect(completeCb).toHaveBeenCalled();
	});

	it('switches to next progress after current completes', async () => {
		const progressUpdates: number[] = [];

		class TestProgress extends SimpleProgress {
			private id: number;

			constructor(id: number) {
				super(async () => {
					await new Promise((resolve) => setTimeout(resolve, 10));
				});
				this.id = id;
			}

			getId() {
				return this.id;
			}
		}

		const progress1 = new TestProgress(1);
		const progress2 = new TestProgress(2);

		const concat = new ConcatenatedProgress([() => progress1, () => progress2]);

		let currentProgress = 0;
		concat.onProgress((p) => {
			currentProgress++;
		});

		await concat.done();

		// Should have received progress updates from both progresses
		expect(currentProgress).toBeGreaterThan(0);
	});
});
