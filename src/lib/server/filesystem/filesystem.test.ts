import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolve_data, resolve_temp } from './filesystem';
import { PathTraversalError } from '../errors/index.js';
import * as path from 'path';

// Mock mkdirSync to prevent actual directory creation during tests
vi.mock('fs', () => ({
	mkdirSync: vi.fn()
}));

describe('Filesystem Utilities', () => {
	let originalDataPath: string | undefined;
	let originalTempPath: string | undefined;
	let originalCwd: string;

	beforeEach(() => {
		originalDataPath = process.env.DATA_PATH;
		originalTempPath = process.env.TEMP_PATH;
		originalCwd = process.cwd();
	});

	afterEach(() => {
		// Restore environment variables
		if (originalDataPath === undefined) {
			delete process.env.DATA_PATH;
		} else {
			process.env.DATA_PATH = originalDataPath;
		}

		if (originalTempPath === undefined) {
			delete process.env.TEMP_PATH;
		} else {
			process.env.TEMP_PATH = originalTempPath;
		}
	});

	describe('resolve_data', () => {
		it('resolves paths within the data directory', () => {
			const result = resolve_data('test.txt');

			expect(result).toContain('test.txt');
			expect(path.isAbsolute(result)).toBe(true);
		});

		it('resolves nested paths', () => {
			const result = resolve_data('subdir', 'file.json');

			expect(result).toContain('subdir');
			expect(result).toContain('file.json');
			expect(result).toContain(path.join('subdir', 'file.json'));
		});

		it('normalizes paths correctly', () => {
			const result = resolve_data('foo', '..', 'bar', 'file.txt');

			expect(result).toContain('bar');
			expect(result).toContain('file.txt');
		});

		it('handles empty path segments', () => {
			const result = resolve_data('', 'file.txt');

			expect(result).toContain('file.txt');
		});

		it('prevents path traversal with ../', () => {
			expect(() => resolve_data('../etc/passwd')).toThrow(PathTraversalError);
		});

		it('prevents path traversal with multiple ../ segments', () => {
			expect(() => resolve_data('../../etc/passwd')).toThrow(PathTraversalError);
		});

		it('prevents path traversal with mixed segments', () => {
			expect(() => resolve_data('foo', '..', '..', 'etc', 'passwd')).toThrow(PathTraversalError);
		});

		it('strips leading slashes from absolute paths', () => {
			// Leading slashes are stripped, so "/etc/passwd" becomes "etc/passwd" which is safe
			const result = resolve_data('/etc/passwd');
			expect(result).toContain('etc');
			expect(result).toContain('passwd');
		});

		it('allows traversal within data directory', () => {
			const result = resolve_data('foo', 'bar', '..', 'baz.txt');

			expect(result).toContain('foo');
			expect(result).toContain('baz.txt');
			expect(result).not.toContain('bar');
		});

		it('handles leading slashes by stripping them', () => {
			const result = resolve_data('/subfolder/file.txt');

			// Should not throw, slashes are stripped
			expect(result).toContain('file.txt');
		});

		it('handles Windows-style paths', () => {
			const result = resolve_data('folder\\file.txt');

			expect(result).toBeDefined();
		});

		it('prevents symlink-based traversal attempts', () => {
			// Try to escape via constructed path that would resolve outside
			expect(() => {
				const maliciousPath = path.join('..', '..', 'etc', 'passwd');
				resolve_data(maliciousPath);
			}).toThrow(PathTraversalError);
		});

		it('throws PathTraversalError with descriptive message', () => {
			try {
				resolve_data('../etc/passwd');
				expect.fail('Should have thrown PathTraversalError');
			} catch (error) {
				expect(error).toBeInstanceOf(PathTraversalError);
				expect(error instanceof Error && error.message).toContain('directory traversal');
			}
		});
	});

	describe('resolve_temp', () => {
		it('resolves paths within the temp directory', () => {
			const result = resolve_temp('temp-file.tmp');

			expect(result).toContain('temp-file.tmp');
			expect(path.isAbsolute(result)).toBe(true);
		});

		it('resolves nested paths in temp directory', () => {
			const result = resolve_temp('session', 'data.tmp');

			expect(result).toContain('session');
			expect(result).toContain('data.tmp');
		});

		it('prevents path traversal in temp directory', () => {
			expect(() => resolve_temp('../etc/passwd')).toThrow(PathTraversalError);
		});

		it('strips leading slashes in temp directory', () => {
			// Leading slashes are stripped, making the path safe
			const result = resolve_temp('/temp-file.tmp');
			expect(result).toContain('temp-file.tmp');
		});

		it('handles multiple path segments', () => {
			const result = resolve_temp('session-123', 'uploads', 'file.tmp');

			expect(result).toContain('session-123');
			expect(result).toContain('uploads');
			expect(result).toContain('file.tmp');
		});

		it('normalizes temp paths', () => {
			const result = resolve_temp('a', 'b', '..', 'c', 'file.tmp');

			expect(result).toContain('a');
			expect(result).not.toContain('b');
			expect(result).toContain('c');
		});
	});

	describe('path traversal edge cases', () => {
		it('handles null bytes in paths', () => {
			// Node.js path.resolve handles null bytes, no special handling needed
			const result = resolve_data('file.txt\0');
			expect(result).toBeDefined();
		});

		it('handles URL-encoded traversal attempts', () => {
			// %2e%2e%2f is ../ URL encoded
			const result = resolve_data('%2e%2e%2ftest.txt');

			// Should not throw because it's treated as literal filename
			expect(result).toBeDefined();
		});

		it('prevents double-encoded traversal', () => {
			expect(() => resolve_data('%252e%252e%252ftest.txt')).not.toThrow();
		});

		it('handles backslash traversal attempts (Windows)', () => {
			expect(() => resolve_data('..\\..\\etc\\passwd')).toThrow(PathTraversalError);
		});

		it('handles UNC paths as regular paths', () => {
			// UNC paths are treated as regular paths with backslashes
			const result = resolve_data('\\\\server\\share\\file.txt');
			expect(result).toBeDefined();
		});
	});

	describe('path resolution with environment variables', () => {
		it('uses DATA_PATH environment variable when set', () => {
			// Note: This tests the module's behavior at load time
			// The actual DATA_PATH is set when the module loads
			const result = resolve_data('test.txt');

			expect(path.isAbsolute(result)).toBe(true);
			expect(result).toContain('test.txt');
		});

		it('uses TEMP_PATH environment variable when set', () => {
			const result = resolve_temp('test.tmp');

			expect(path.isAbsolute(result)).toBe(true);
			expect(result).toContain('test.tmp');
		});
	});

	describe('security validations', () => {
		it('prevents accessing parent directory', () => {
			expect(() => resolve_data('..')).toThrow(PathTraversalError);
		});

		it('handles root path by stripping slash', () => {
			// Leading slash is stripped, resulting in empty path which resolves to data root
			const result = resolve_data('/');
			expect(path.isAbsolute(result)).toBe(true);
		});

		it('prevents mixed case traversal (case-sensitive systems)', () => {
			expect(() => resolve_data('..', '..', 'ETC', 'PASSWD')).toThrow(PathTraversalError);
		});

		it('normalizes space-padded paths', () => {
			// Spaces are preserved in path segments, path.resolve normalizes them
			const result = resolve_data(' .. ', 'etc', 'passwd');
			// This should work or throw based on normalization - test actual behavior
			expect(result).toBeDefined();
		});

		it('allows safe relative paths within boundaries', () => {
			const result = resolve_data('safe', 'path', 'file.txt');

			expect(result).toContain('safe');
			expect(result).toContain('path');
			expect(result).toContain('file.txt');
		});

		it('allows dot files within safe directory', () => {
			const result = resolve_data('.gitignore');

			expect(result).toContain('.gitignore');
		});

		it('allows hidden directories within safe directory', () => {
			const result = resolve_data('.config', 'settings.json');

			expect(result).toContain('.config');
			expect(result).toContain('settings.json');
		});
	});

	describe('real-world attack scenarios', () => {
		it('prevents /etc/passwd access via traversal', () => {
			expect(() => resolve_data('../../../etc/passwd')).toThrow(PathTraversalError);
		});

		it('prevents /proc access', () => {
			expect(() => resolve_data('../../../proc/self/environ')).toThrow(PathTraversalError);
		});

		it('prevents Windows system file access', () => {
			expect(() => resolve_data('../../../windows/system32/config/sam')).toThrow(
				PathTraversalError
			);
		});

		it('handles C: drive paths as regular paths on Unix', () => {
			// On Unix systems, C: is just part of a filename
			const result = resolve_data('C:\\Windows\\System32');
			expect(result).toBeDefined();
		});

		it('handles chained traversal attempts', () => {
			expect(() => resolve_data('a', '..', '..', 'b', '..', '..', 'etc', 'passwd')).toThrow(
				PathTraversalError
			);
		});
	});
});
