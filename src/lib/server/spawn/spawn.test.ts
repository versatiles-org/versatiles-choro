import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runTippecanoe, runVersaTilesConvert } from './spawn';
import { SpawnProgress } from '../progress/spawn';
import { CallbackProgress } from '../progress/callback';

// Mock child_process
vi.mock('child_process', () => ({
	spawn: vi.fn()
}));

// Mock versatiles-rs
vi.mock('@versatiles/versatiles-rs', () => ({
	convert: vi.fn()
}));

import { spawn } from 'child_process';
import { convert } from '@versatiles/versatiles-rs';
import { EventEmitter } from 'events';

class MockChildProcess extends EventEmitter {
	stdout = new EventEmitter();
	stderr = new EventEmitter();
	killed = false;

	kill(signal?: NodeJS.Signals | number): boolean {
		this.killed = true;
		this.emit('close', 0, signal);
		return true;
	}
}

describe('Spawn Utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('runTippecanoe', () => {
		it('spawns tippecanoe with correct arguments', async () => {
			const mockProcess = new MockChildProcess();
			vi.mocked(spawn).mockReturnValue(mockProcess as unknown as ReturnType<typeof spawn>);

			const progress = await runTippecanoe('input.geojson', 'output.mbtiles', {
				force: true,
				'maximum-zoom': 'g'
			});

			expect(spawn).toHaveBeenCalledWith('tippecanoe', [
				'-o',
				'output.mbtiles',
				'--force',
				'--maximum-zoom',
				'g',
				'input.geojson'
			]);

			expect(progress).toBeInstanceOf(SpawnProgress);
		});

		it('handles boolean options correctly', async () => {
			const mockProcess = new MockChildProcess();
			vi.mocked(spawn).mockReturnValue(mockProcess as unknown as ReturnType<typeof spawn>);

			await runTippecanoe('input.geojson', 'output.mbtiles', {
				force: true,
				'drop-densest-as-needed': false,
				'extend-zooms-if-still-dropping': true
			});

			const args = vi.mocked(spawn).mock.calls[0][1];
			expect(args).toContain('--force');
			expect(args).toContain('--extend-zooms-if-still-dropping');
			expect(args).not.toContain('--drop-densest-as-needed');
		});

		it('converts non-boolean options to strings', async () => {
			const mockProcess = new MockChildProcess();
			vi.mocked(spawn).mockReturnValue(mockProcess as unknown as ReturnType<typeof spawn>);

			await runTippecanoe('input.geojson', 'output.mbtiles', {
				'maximum-zoom': 14,
				'minimum-zoom': 0,
				layer: 'regions'
			});

			const args = vi.mocked(spawn).mock.calls[0][1];
			expect(args).toContain('--maximum-zoom');
			expect(args).toContain('14');
			expect(args).toContain('--minimum-zoom');
			expect(args).toContain('0');
			expect(args).toContain('--layer');
			expect(args).toContain('regions');
		});

		it('works without options', async () => {
			const mockProcess = new MockChildProcess();
			vi.mocked(spawn).mockReturnValue(mockProcess as unknown as ReturnType<typeof spawn>);

			await runTippecanoe('input.geojson', 'output.mbtiles');

			expect(spawn).toHaveBeenCalledWith('tippecanoe', ['-o', 'output.mbtiles', 'input.geojson']);
		});

		it('parses reordering geometry progress', async () => {
			const mockProcess = new MockChildProcess();
			vi.mocked(spawn).mockReturnValue(mockProcess as unknown as ReturnType<typeof spawn>);

			const progress = await runTippecanoe('input.geojson', 'output.mbtiles');

			const progressValues: number[] = [];
			const messages: string[] = [];
			progress.onProgress((p) => progressValues.push(p));
			progress.onMessage((msg) => messages.push(msg));

			mockProcess.stdout.emit('data', 'Reordering geometry: 50%\n');

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(progressValues).toContain(50);
			expect(messages).toContain('Reordering geometry');
		});

		it('parses building tiles progress', async () => {
			const mockProcess = new MockChildProcess();
			vi.mocked(spawn).mockReturnValue(mockProcess as unknown as ReturnType<typeof spawn>);

			const progress = await runTippecanoe('input.geojson', 'output.mbtiles');

			const progressValues: number[] = [];
			const messages: string[] = [];
			progress.onProgress((p) => progressValues.push(p));
			progress.onMessage((msg) => messages.push(msg));

			mockProcess.stdout.emit('data', '   75.5%  512/384/10\n');

			await new Promise((resolve) => setTimeout(resolve, 10));

			// Progress is rounded, so 75.5 becomes 76
			expect(progressValues).toContain(76);
			expect(messages).toContain('Building tiles');
		});

		it('ignores non-matching lines', async () => {
			const mockProcess = new MockChildProcess();
			vi.mocked(spawn).mockReturnValue(mockProcess as unknown as ReturnType<typeof spawn>);

			const progress = await runTippecanoe('input.geojson', 'output.mbtiles');

			const progressValues: number[] = [];
			const messages: string[] = [];
			progress.onProgress((p) => progressValues.push(p));
			progress.onMessage((msg) => messages.push(msg));

			mockProcess.stdout.emit('data', 'Some other output\n');
			mockProcess.stdout.emit('data', 'Random line\n');

			await new Promise((resolve) => setTimeout(resolve, 10));

			// Should only have initial progress value
			expect(progressValues).toEqual([0]);
			expect(messages).toEqual(['']);
		});
	});

	describe('runVersaTilesConvert', () => {
		it('calls convert with correct arguments', async () => {
			const mockPromise = Promise.resolve();
			vi.mocked(convert).mockReturnValue(mockPromise);

			const progress = await runVersaTilesConvert('input.mbtiles', 'output.versatiles', {
				compress: 'brotli'
			});

			expect(convert).toHaveBeenCalledWith(
				'input.mbtiles',
				'output.versatiles',
				{ compress: 'brotli' },
				expect.any(Function),
				expect.any(Function)
			);

			expect(progress).toBeInstanceOf(CallbackProgress);
		});

		it('maps minZoom and maxZoom options', async () => {
			const mockPromise = Promise.resolve();
			vi.mocked(convert).mockReturnValue(mockPromise);

			await runVersaTilesConvert('input.mbtiles', 'output.versatiles', {
				minZoom: 0,
				maxZoom: 14
			});

			expect(convert).toHaveBeenCalledWith(
				'input.mbtiles',
				'output.versatiles',
				{ minZoom: 0, maxZoom: 14 },
				expect.any(Function),
				expect.any(Function)
			);
		});

		it('maps bbox option', async () => {
			const mockPromise = Promise.resolve();
			vi.mocked(convert).mockReturnValue(mockPromise);

			const bbox = [-180, -90, 180, 90];
			await runVersaTilesConvert('input.mbtiles', 'output.versatiles', {
				bbox
			});

			expect(convert).toHaveBeenCalledWith(
				'input.mbtiles',
				'output.versatiles',
				{ bbox },
				expect.any(Function),
				expect.any(Function)
			);
		});

		it('maps compress option', async () => {
			const mockPromise = Promise.resolve();
			vi.mocked(convert).mockReturnValue(mockPromise);

			await runVersaTilesConvert('input.mbtiles', 'output.versatiles', {
				compress: 'gzip'
			});

			expect(convert).toHaveBeenCalledWith(
				'input.mbtiles',
				'output.versatiles',
				{ compress: 'gzip' },
				expect.any(Function),
				expect.any(Function)
			);
		});

		it('works without options', async () => {
			const mockPromise = Promise.resolve();
			vi.mocked(convert).mockReturnValue(mockPromise);

			await runVersaTilesConvert('input.mbtiles', 'output.versatiles');

			expect(convert).toHaveBeenCalledWith(
				'input.mbtiles',
				'output.versatiles',
				{},
				expect.any(Function),
				expect.any(Function)
			);
		});

		it('passes progress data to callback', async () => {
			let progressCallback: ((data: unknown) => void) | undefined;

			vi.mocked(convert).mockImplementation((input, output, options, onProgress) => {
				progressCallback = onProgress;
				return Promise.resolve();
			});

			const progress = await runVersaTilesConvert('input.mbtiles', 'output.versatiles');

			const progressValues: number[] = [];
			progress.onProgress((p) => progressValues.push(p));

			// Simulate progress updates
			progressCallback?.({ percentage: 25, position: 25, total: 100, speed: 1000, eta: 75 });
			progressCallback?.({ percentage: 50, position: 50, total: 100, speed: 1000, eta: 50 });
			progressCallback?.({ percentage: 75, position: 75, total: 100, speed: 1000, eta: 25 });

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(progressValues).toContain(25);
			expect(progressValues).toContain(50);
			expect(progressValues).toContain(75);
		});

		it('passes message data to callback', async () => {
			let messageCallback: ((data: unknown) => void) | undefined;

			vi.mocked(convert).mockImplementation((input, output, options, onProgress, onMessage) => {
				messageCallback = onMessage;
				return Promise.resolve();
			});

			const progress = await runVersaTilesConvert('input.mbtiles', 'output.versatiles');

			const messages: Array<{ message: string; isError: boolean }> = [];
			progress.onMessage((msg, isErr) => messages.push({ message: msg, isError: isErr }));

			// Simulate message updates
			messageCallback?.({ type: 'step', message: 'Processing tiles' });
			messageCallback?.({ type: 'warning', message: 'Low memory' });
			messageCallback?.({ type: 'error', message: 'Failed to read tile' });

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(messages).toContainEqual({ message: 'Processing tiles', isError: false });
			expect(messages).toContainEqual({ message: 'Low memory', isError: true });
			expect(messages).toContainEqual({ message: 'Failed to read tile', isError: true });
		});

		it('marks warnings as errors', async () => {
			let messageCallback: ((data: unknown) => void) | undefined;

			vi.mocked(convert).mockImplementation((input, output, options, onProgress, onMessage) => {
				messageCallback = onMessage;
				return Promise.resolve();
			});

			const progress = await runVersaTilesConvert('input.mbtiles', 'output.versatiles');

			const messages: Array<{ message: string; isError: boolean }> = [];
			progress.onMessage((msg, isErr) => messages.push({ message: msg, isError: isErr }));

			messageCallback?.({ type: 'warning', message: 'Warning message' });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const warningMessage = messages.find((m) => m.message === 'Warning message');
			expect(warningMessage?.isError).toBe(true);
		});
	});
});
