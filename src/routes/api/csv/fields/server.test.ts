import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './+server';
import type { RequestEvent } from '@sveltejs/kit';

// Mock the CSV fields module
vi.mock('$lib/server/csv/fields', () => ({
	getCSVFieldNames: vi.fn()
}));

// Mock the filesystem module
vi.mock('$lib/server/filesystem/filesystem', () => ({
	resolve_data: vi.fn()
}));

import { getCSVFieldNames } from '$lib/server/csv/fields';
import { resolveDataPath } from '$lib/server/filesystem/filesystem';
import { FileSystemError } from '$lib/server/errors/errors';

describe('POST /api/csv/fields', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const createMockEvent = (
		body: unknown
	): RequestEvent<Record<string, never>, '/api/csv/fields'> => {
		const request = new Request('http://localhost/api/csv/fields', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});

		return {
			request,
			route: { id: '/api/csv/fields' }
		} as RequestEvent<Record<string, never>, '/api/csv/fields'>;
	};

	describe('Successful requests', () => {
		it('should return field names for valid CSV file', async () => {
			vi.mocked(resolveDataPath).mockReturnValue('/absolute/path/to/file.csv');
			vi.mocked(getCSVFieldNames).mockReturnValue(['id', 'name', 'value']);

			const mockEvent = createMockEvent({ filePath: '/data/file.csv' });
			const response = await POST(mockEvent);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data).toEqual({ fields: ['id', 'name', 'value'] });
			expect(resolveDataPath).toHaveBeenCalledWith('/data/file.csv');
			expect(getCSVFieldNames).toHaveBeenCalledWith('/absolute/path/to/file.csv');
		});

		it('should return field names for valid TSV file', async () => {
			vi.mocked(resolveDataPath).mockReturnValue('/absolute/path/to/file.tsv');
			vi.mocked(getCSVFieldNames).mockReturnValue(['col1', 'col2', 'col3']);

			const mockEvent = createMockEvent({ filePath: '/data/file.tsv' });
			const response = await POST(mockEvent);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data).toEqual({ fields: ['col1', 'col2', 'col3'] });
		});

		it('should return empty array for file with no fields', async () => {
			vi.mocked(resolveDataPath).mockReturnValue('/absolute/path/to/empty.csv');
			vi.mocked(getCSVFieldNames).mockReturnValue([]);

			const mockEvent = createMockEvent({ filePath: '/data/empty.csv' });
			const response = await POST(mockEvent);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data).toEqual({ fields: [] });
		});

		it('should handle field names with special characters', async () => {
			vi.mocked(resolveDataPath).mockReturnValue('/absolute/path/to/special.csv');
			vi.mocked(getCSVFieldNames).mockReturnValue(['ID_Field', 'Name-123', 'Value(USD)']);

			const mockEvent = createMockEvent({ filePath: '/data/special.csv' });
			const response = await POST(mockEvent);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data).toEqual({ fields: ['ID_Field', 'Name-123', 'Value(USD)'] });
		});
	});

	describe('Validation errors', () => {
		it('should validate request body schema', async () => {
			const mockEvent = createMockEvent({ invalid: 'data' });
			const response = await POST(mockEvent);

			expect(response.status).toBe(400);
			expect(resolveDataPath).not.toHaveBeenCalled();
			expect(getCSVFieldNames).not.toHaveBeenCalled();
		});

		it('should require filePath field', async () => {
			const mockEvent = createMockEvent({});
			const response = await POST(mockEvent);

			expect(response.status).toBe(400);
		});

		it('should validate filePath is a string', async () => {
			const mockEvent = createMockEvent({ filePath: 123 });
			const response = await POST(mockEvent);

			expect(response.status).toBe(400);
		});

		it('should reject empty filePath', async () => {
			const mockEvent = createMockEvent({ filePath: '' });
			const response = await POST(mockEvent);

			expect(response.status).toBe(400);
		});

		it('should reject filePath with spaces only', async () => {
			const mockEvent = createMockEvent({ filePath: '   ' });
			const response = await POST(mockEvent);

			expect(response.status).toBe(400);
		});
	});

	describe('File system errors', () => {
		it('should handle file not found error', async () => {
			vi.mocked(resolveDataPath).mockReturnValue('/absolute/path/to/missing.csv');
			vi.mocked(getCSVFieldNames).mockImplementation(() => {
				throw new FileSystemError('File not found: /absolute/path/to/missing.csv');
			});

			const mockEvent = createMockEvent({ filePath: '/data/missing.csv' });
			const response = await POST(mockEvent);

			expect(response.status).toBe(500);
		});

		it('should handle generic errors', async () => {
			vi.mocked(resolveDataPath).mockReturnValue('/absolute/path/to/file.csv');
			vi.mocked(getCSVFieldNames).mockImplementation(() => {
				throw new Error('Unexpected error');
			});

			const mockEvent = createMockEvent({ filePath: '/data/file.csv' });
			const response = await POST(mockEvent);

			expect(response.status).toBe(500);
		});
	});

	describe('Path resolution', () => {
		it('should pass filePath to resolve_data', async () => {
			vi.mocked(resolveDataPath).mockReturnValue('/absolute/path');
			vi.mocked(getCSVFieldNames).mockReturnValue(['field1']);

			const mockEvent = createMockEvent({ filePath: '/relative/path.csv' });
			await POST(mockEvent);

			expect(resolveDataPath).toHaveBeenCalledWith('/relative/path.csv');
		});

		it('should use resolved path for getCSVFieldNames', async () => {
			const absolutePath = '/absolute/data/path/file.csv';
			vi.mocked(resolveDataPath).mockReturnValue(absolutePath);
			vi.mocked(getCSVFieldNames).mockReturnValue(['id', 'value']);

			const mockEvent = createMockEvent({ filePath: '/data/file.csv' });
			await POST(mockEvent);

			expect(getCSVFieldNames).toHaveBeenCalledWith(absolutePath);
		});
	});
});
