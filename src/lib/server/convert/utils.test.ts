import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	validateInputFile,
	validateOutputExtension,
	safeDelete,
	safeDeleteAll
} from './utils';
import { FileSystemError, ValidationError } from '../errors/errors.js';

// Mock fs module
vi.mock('fs', () => ({
	existsSync: vi.fn()
}));

// Mock fs/promises module
vi.mock('fs/promises', () => ({
	unlink: vi.fn()
}));

// Mock logger
vi.mock('../logger/index.js', () => ({
	loggers: {
		conversion: {
			warn: vi.fn()
		}
	}
}));

import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { loggers } from '../logger/index.js';

describe('Conversion Utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('validateInputFile', () => {
		it('validates existing file without throwing', () => {
			vi.mocked(existsSync).mockReturnValue(true);

			expect(() => validateInputFile('/path/to/file.csv')).not.toThrow();
			expect(existsSync).toHaveBeenCalledWith('/path/to/file.csv');
		});

		it('throws FileSystemError for missing file', () => {
			vi.mocked(existsSync).mockReturnValue(false);

			expect(() => validateInputFile('/missing/file.csv')).toThrow(FileSystemError);
			expect(() => validateInputFile('/missing/file.csv')).toThrow(
				'Input file not found: /missing/file.csv'
			);
		});

		it('provides helpful error message with file path', () => {
			vi.mocked(existsSync).mockReturnValue(false);

			try {
				validateInputFile('/custom/path/data.geojson');
				expect.fail('Should have thrown FileSystemError');
			} catch (error) {
				expect(error).toBeInstanceOf(FileSystemError);
				expect(error instanceof Error && error.message).toContain('/custom/path/data.geojson');
			}
		});

		it('handles various file paths', () => {
			vi.mocked(existsSync).mockReturnValue(true);

			expect(() => validateInputFile('relative/path/file.json')).not.toThrow();
			expect(() => validateInputFile('/absolute/path/file.geojson')).not.toThrow();
			expect(() => validateInputFile('./current/dir/file.csv')).not.toThrow();
		});
	});

	describe('validateOutputExtension', () => {
		it('validates correct extension', () => {
			expect(() => validateOutputExtension('output.versatiles', '.versatiles')).not.toThrow();
		});

		it('validates paths with directories', () => {
			expect(() =>
				validateOutputExtension('/path/to/output.versatiles', '.versatiles')
			).not.toThrow();
			expect(() => validateOutputExtension('relative/output.versatiles', '.versatiles')).not.toThrow();
		});

		it('is case-sensitive by default', () => {
			// JavaScript endsWith is case-sensitive
			expect(() => validateOutputExtension('output.VERSATILES', '.versatiles')).toThrow(
				ValidationError
			);
			expect(() => validateOutputExtension('output.VersaTiles', '.versatiles')).toThrow(
				ValidationError
			);
		});

		it('throws ValidationError for wrong extension', () => {
			expect(() => validateOutputExtension('output.txt', '.versatiles')).toThrow(ValidationError);
			expect(() => validateOutputExtension('output.txt', '.versatiles')).toThrow(
				'Output file must have a .versatiles extension'
			);
		});

		it('throws ValidationError for missing extension', () => {
			expect(() => validateOutputExtension('output', '.versatiles')).toThrow(ValidationError);
		});

		it('throws ValidationError for partial extension match', () => {
			expect(() => validateOutputExtension('output.versatile', '.versatiles')).toThrow(
				ValidationError
			);
		});

		it('includes extension in error message', () => {
			try {
				validateOutputExtension('file.wrong', '.correct');
				expect.fail('Should have thrown ValidationError');
			} catch (error) {
				expect(error).toBeInstanceOf(ValidationError);
				expect(error instanceof Error && error.message).toContain('.correct');
			}
		});

		it('validates custom extensions', () => {
			expect(() => validateOutputExtension('file.geojson', '.geojson')).not.toThrow();
			expect(() => validateOutputExtension('file.mbtiles', '.mbtiles')).not.toThrow();
		});
	});

	describe('safeDelete', () => {
		it('deletes existing file without error', async () => {
			vi.mocked(unlink).mockResolvedValue(undefined);

			await expect(safeDelete('/path/to/file.tmp')).resolves.toBeUndefined();
			expect(unlink).toHaveBeenCalledWith('/path/to/file.tmp');
			expect(loggers.conversion.warn).not.toHaveBeenCalled();
		});

		it('silently succeeds if file does not exist', async () => {
			const error = new Error('ENOENT: no such file or directory');
			vi.mocked(unlink).mockRejectedValue(error);

			await expect(safeDelete('/missing/file.tmp')).resolves.toBeUndefined();
			expect(unlink).toHaveBeenCalledWith('/missing/file.tmp');
			expect(loggers.conversion.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					path: '/missing/file.tmp',
					error
				}),
				'Failed to delete file'
			);
		});

		it('does not throw on permission errors', async () => {
			const error = new Error('EACCES: permission denied');
			vi.mocked(unlink).mockRejectedValue(error);

			await expect(safeDelete('/protected/file.tmp')).resolves.toBeUndefined();
			expect(loggers.conversion.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					path: '/protected/file.tmp',
					error
				}),
				'Failed to delete file'
			);
		});

		it('logs warning with path and error on failure', async () => {
			const testError = new Error('Test error');
			vi.mocked(unlink).mockRejectedValue(testError);

			await safeDelete('/test/file.tmp');

			expect(loggers.conversion.warn).toHaveBeenCalledWith(
				{
					path: '/test/file.tmp',
					error: testError
				},
				'Failed to delete file'
			);
		});

		it('handles multiple delete operations independently', async () => {
			vi.mocked(unlink).mockResolvedValue(undefined);

			await safeDelete('/file1.tmp');
			await safeDelete('/file2.tmp');

			expect(unlink).toHaveBeenCalledTimes(2);
			expect(unlink).toHaveBeenCalledWith('/file1.tmp');
			expect(unlink).toHaveBeenCalledWith('/file2.tmp');
		});
	});

	describe('safeDeleteAll', () => {
		it('deletes multiple files', async () => {
			vi.mocked(unlink).mockResolvedValue(undefined);

			const files = ['/file1.tmp', '/file2.tmp', '/file3.tmp'];
			await safeDeleteAll(files);

			expect(unlink).toHaveBeenCalledTimes(3);
			expect(unlink).toHaveBeenCalledWith('/file1.tmp');
			expect(unlink).toHaveBeenCalledWith('/file2.tmp');
			expect(unlink).toHaveBeenCalledWith('/file3.tmp');
		});

		it('continues deleting even if some fail', async () => {
			vi.mocked(unlink)
				.mockResolvedValueOnce(undefined) // file1 succeeds
				.mockRejectedValueOnce(new Error('ENOENT')) // file2 fails
				.mockResolvedValueOnce(undefined); // file3 succeeds

			const files = ['/file1.tmp', '/file2.tmp', '/file3.tmp'];
			await expect(safeDeleteAll(files)).resolves.toBeUndefined();

			expect(unlink).toHaveBeenCalledTimes(3);
			expect(loggers.conversion.warn).toHaveBeenCalledTimes(1);
		});

		it('logs errors but does not throw', async () => {
			const error1 = new Error('Error 1');
			const error2 = new Error('Error 2');
			vi.mocked(unlink)
				.mockRejectedValueOnce(error1)
				.mockRejectedValueOnce(error2)
				.mockRejectedValueOnce(new Error('Error 3'));

			const files = ['/file1.tmp', '/file2.tmp', '/file3.tmp'];
			await expect(safeDeleteAll(files)).resolves.toBeUndefined();

			expect(loggers.conversion.warn).toHaveBeenCalledTimes(3);
		});

		it('handles empty array', async () => {
			await expect(safeDeleteAll([])).resolves.toBeUndefined();
			expect(unlink).not.toHaveBeenCalled();
		});

		it('handles single file', async () => {
			vi.mocked(unlink).mockResolvedValue(undefined);

			await safeDeleteAll(['/single-file.tmp']);

			expect(unlink).toHaveBeenCalledTimes(1);
			expect(unlink).toHaveBeenCalledWith('/single-file.tmp');
		});

		it('processes all files in parallel', async () => {
			// Create a promise that we can control
			let resolveUnlink: ((value: void) => void) | null = null;
			const unlinkPromise = new Promise<void>((resolve) => {
				resolveUnlink = resolve;
			});

			vi.mocked(unlink).mockReturnValue(unlinkPromise);

			const files = ['/file1.tmp', '/file2.tmp', '/file3.tmp'];
			const deletePromise = safeDeleteAll(files);

			// All unlink calls should be initiated immediately (parallel)
			expect(unlink).toHaveBeenCalledTimes(3);

			// Resolve all at once
			resolveUnlink?.(undefined);
			await deletePromise;
		});
	});
});
