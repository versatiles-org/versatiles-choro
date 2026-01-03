import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpawnProgress } from './spawn';
import { EventEmitter } from 'events';
import type { ChildProcess } from 'child_process';

// Mock the errors module
vi.mock('../errors/index.js', () => ({
	ProcessError: class ProcessError extends Error {
		constructor(
			public name: string,
			public exitCode: number | null,
			public signal: NodeJS.Signals | null,
			public stderr: string
		) {
			super(`${name} failed`);
		}
	},
	logError: vi.fn()
}));

import { logError } from '../errors/index.js';

class MockChildProcess extends EventEmitter {
	stdout = new EventEmitter();
	stderr = new EventEmitter();
	killed = false;

	kill(signal?: NodeJS.Signals | number): boolean {
		this.killed = true;
		this.emit('close', null, signal);
		return true;
	}
}

describe('SpawnProgress', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const createMockProcess = (): ChildProcess => {
		return new MockChildProcess() as unknown as ChildProcess;
	};

	it('completes when process exits with code 0', async () => {
		const mockProcess = createMockProcess();
		const messageFilter = vi.fn(() => ({}));

		const progress = new SpawnProgress(mockProcess, 'test-process', messageFilter);

		const completeCb = vi.fn();
		progress.onComplete(completeCb);

		mockProcess.emit('close', 0, null);

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(completeCb).toHaveBeenCalled();
	});

	it('reports error when process exits with non-zero code', async () => {
		const mockProcess = createMockProcess();
		const messageFilter = vi.fn(() => ({}));

		const progress = new SpawnProgress(mockProcess, 'test-process', messageFilter);

		const messages: Array<{ message: string; isError: boolean }> = [];
		progress.onMessage((msg, isErr) => messages.push({ message: msg, isError: isErr }));

		mockProcess.emit('close', 1, null);

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(logError).toHaveBeenCalled();
		expect(messages.some((m) => m.isError)).toBe(true);
	});

	it('parses stdout lines with message filter', async () => {
		const mockProcess = createMockProcess();
		const messageFilter = vi.fn((line) => {
			if (line.includes('50%')) return { progress: 50 };
			if (line.includes('Processing')) return { message: 'Processing file' };
			return {};
		});

		const progress = new SpawnProgress(mockProcess, 'test-process', messageFilter);

		const progressValues: number[] = [];
		const messages: string[] = [];
		progress.onProgress((p) => progressValues.push(p));
		progress.onMessage((msg) => messages.push(msg));

		(mockProcess as MockChildProcess).stdout.emit('data', 'Progress: 50%\n');
		(mockProcess as MockChildProcess).stdout.emit('data', 'Processing files\n');

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(messageFilter).toHaveBeenCalledWith('Progress: 50%');
		expect(messageFilter).toHaveBeenCalledWith('Processing files');
		expect(progressValues).toContain(50);
		expect(messages).toContain('Processing file');
	});

	it('parses stderr lines with message filter', async () => {
		const mockProcess = createMockProcess();
		const messageFilter = vi.fn((line) => {
			if (line.includes('Warning')) return { message: 'Warning message', isError: true };
			return {};
		});

		const progress = new SpawnProgress(mockProcess, 'test-process', messageFilter);

		const messages: Array<{ message: string; isError: boolean }> = [];
		progress.onMessage((msg, isErr) => messages.push({ message: msg, isError: isErr }));

		(mockProcess as MockChildProcess).stderr.emit('data', 'Warning: something happened\n');

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(messages).toContainEqual({ message: 'Warning message', isError: true });
	});

	it('marks stderr messages as errors by default', async () => {
		const mockProcess = createMockProcess();
		const messageFilter = vi.fn((line) => {
			if (line.includes('Error')) return { message: 'Error occurred' };
			return {};
		});

		const progress = new SpawnProgress(mockProcess, 'test-process', messageFilter);

		const messages: Array<{ message: string; isError: boolean }> = [];
		progress.onMessage((msg, isErr) => messages.push({ message: msg, isError: isErr }));

		(mockProcess as MockChildProcess).stderr.emit('data', 'Error: failed\n');

		await new Promise((resolve) => setTimeout(resolve, 10));

		// stderr messages should default to isError=true if not explicitly set
		expect(messages).toContainEqual({ message: 'Error occurred', isError: true });
	});

	it('buffers stderr for error reporting', async () => {
		const mockProcess = createMockProcess();
		const messageFilter = vi.fn(() => ({}));

		const progress = new SpawnProgress(mockProcess, 'test-process', messageFilter);

		(mockProcess as MockChildProcess).stderr.emit('data', 'Error line 1\n');
		(mockProcess as MockChildProcess).stderr.emit('data', 'Error line 2\n');
		(mockProcess as MockChildProcess).stderr.emit('data', 'Error line 3\n');

		mockProcess.emit('close', 1, null);

		await new Promise((resolve) => setTimeout(resolve, 10));

		// ProcessError should be created with stderr buffer
		expect(logError).toHaveBeenCalledWith(
			expect.objectContaining({
				stderr: expect.stringContaining('Error line 1')
			}),
			'SpawnProgress'
		);
	});

	it('limits buffer size to maxBufferLines', async () => {
		const mockProcess = createMockProcess();
		const messageFilter = vi.fn(() => ({}));

		const progress = new SpawnProgress(mockProcess, 'test-process', messageFilter);

		// Emit more than 100 lines
		for (let i = 0; i < 150; i++) {
			(mockProcess as MockChildProcess).stderr.emit('data', `Line ${i}\n`);
		}

		mockProcess.emit('close', 1, null);

		await new Promise((resolve) => setTimeout(resolve, 10));

		// Should only keep last 100 lines
		const errorCall = vi.mocked(logError).mock.calls[0];
		const processError = errorCall[0] as any;
		const lines = processError.stderr.split('\n').filter((l: string) => l.trim());

		expect(lines.length).toBeLessThanOrEqual(100);
		expect(processError.stderr).toContain('Line 149');
		expect(processError.stderr).not.toContain('Line 0');
	});

	it('handles process error event', async () => {
		const mockProcess = createMockProcess();
		const messageFilter = vi.fn(() => ({}));

		const progress = new SpawnProgress(mockProcess, 'test-process', messageFilter);

		const messages: Array<{ message: string; isError: boolean }> = [];
		progress.onMessage((msg, isErr) => messages.push({ message: msg, isError: isErr }));

		const testError = new Error('ENOENT: command not found');
		mockProcess.emit('error', testError);

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(logError).toHaveBeenCalledWith(testError, 'SpawnProgress:test-process');
		expect(messages.some((m) => m.message.includes('ENOENT'))).toBe(true);
	});

	it('sends SIGTERM on abort', async () => {
		const mockProcess = createMockProcess();
		const messageFilter = vi.fn(() => ({}));

		const killSpy = vi.spyOn(mockProcess, 'kill');

		const progress = new SpawnProgress(mockProcess, 'test-process', messageFilter);

		progress.abort();

		expect(killSpy).toHaveBeenCalledWith('SIGTERM');
	});

	it('sends SIGKILL after timeout if process does not terminate', async () => {
		vi.useFakeTimers();

		const mockProcess = createMockProcess();
		const messageFilter = vi.fn(() => ({}));

		// Override kill to not actually kill the process
		const killSpy = vi.spyOn(mockProcess, 'kill').mockImplementation((signal) => {
			if (signal === 'SIGKILL') {
				(mockProcess as MockChildProcess).killed = true;
			}
			return true;
		});

		const progress = new SpawnProgress(mockProcess, 'test-process', messageFilter);

		progress.abort();

		expect(killSpy).toHaveBeenCalledWith('SIGTERM');

		// Advance time past the 5 second timeout
		vi.advanceTimersByTime(5000);

		expect(killSpy).toHaveBeenCalledWith('SIGKILL');

		vi.useRealTimers();
	});

	it('ignores empty lines from stdout/stderr', async () => {
		const mockProcess = createMockProcess();
		const messageFilter = vi.fn(() => ({}));

		const progress = new SpawnProgress(mockProcess, 'test-process', messageFilter);

		(mockProcess as MockChildProcess).stdout.emit('data', '\n  \n\t\n');
		(mockProcess as MockChildProcess).stderr.emit('data', '\n\n\n');

		await new Promise((resolve) => setTimeout(resolve, 10));

		// Empty lines should not be passed to message filter
		expect(messageFilter).not.toHaveBeenCalled();
	});

	it('splits multi-line data chunks', async () => {
		const mockProcess = createMockProcess();
		const messageFilter = vi.fn(() => ({}));

		const progress = new SpawnProgress(mockProcess, 'test-process', messageFilter);

		(mockProcess as MockChildProcess).stdout.emit('data', 'Line 1\nLine 2\nLine 3\n');

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(messageFilter).toHaveBeenCalledWith('Line 1');
		expect(messageFilter).toHaveBeenCalledWith('Line 2');
		expect(messageFilter).toHaveBeenCalledWith('Line 3');
	});

	it('handles mixed progress and message updates', async () => {
		const mockProcess = createMockProcess();
		const messageFilter = vi.fn((line) => {
			if (line.includes('Progress: 25%')) return { progress: 25, message: 'Quarter done' };
			if (line.includes('Progress: 50%')) return { progress: 50, message: 'Half done' };
			return {};
		});

		const progress = new SpawnProgress(mockProcess, 'test-process', messageFilter);

		const progressValues: number[] = [];
		const messages: string[] = [];
		progress.onProgress((p) => progressValues.push(p));
		progress.onMessage((msg) => messages.push(msg));

		(mockProcess as MockChildProcess).stdout.emit('data', 'Progress: 25%\n');
		(mockProcess as MockChildProcess).stdout.emit('data', 'Progress: 50%\n');

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(progressValues).toContain(25);
		expect(progressValues).toContain(50);
		expect(messages).toContain('Quarter done');
		expect(messages).toContain('Half done');
	});

	it('includes process exit signal in error', async () => {
		const mockProcess = createMockProcess();
		const messageFilter = vi.fn(() => ({}));

		const progress = new SpawnProgress(mockProcess, 'test-process', messageFilter);

		mockProcess.emit('close', null, 'SIGTERM');

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(logError).toHaveBeenCalledWith(
			expect.objectContaining({
				signal: 'SIGTERM'
			}),
			'SpawnProgress'
		);
	});
});
