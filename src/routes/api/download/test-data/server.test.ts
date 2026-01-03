import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import type { RequestEvent } from '@sveltejs/kit';
import { SimpleProgress } from '$lib/server/progress/simple';

// Mock filesystem module
vi.mock('fs/promises', () => ({
	mkdir: vi.fn()
}));

// Mock filesystem utilities
vi.mock('$lib/server/filesystem/filesystem', () => ({
	resolve_data: vi.fn((path: string) => `/resolved${path}`)
}));

// Mock download module
vi.mock('$lib/server/download/test-data', () => ({
	downloadTestData: vi.fn()
}));

// Mock progress to stream
vi.mock('$lib/server/progress', () => ({
	progressToStream: vi.fn()
}));

import { mkdir } from 'fs/promises';
import { resolve_data } from '$lib/server/filesystem/filesystem';
import { downloadTestData } from '$lib/server/download/test-data';
import { progressToStream } from '$lib/server/progress';

describe('POST /api/download/test-data', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const createMockEvent = (): RequestEvent<Record<string, never>, '/api/download/test-data'> => {
		const request = new Request('http://localhost/api/download/test-data', {
			method: 'POST',
			headers: { 'content-type': 'application/json' }
		});

		return {
			request,
			route: { id: '/api/download/test-data' }
		} as RequestEvent<Record<string, never>, '/api/download/test-data'>;
	};

	it('creates test-data directory', async () => {
		vi.mocked(mkdir).mockResolvedValue(undefined);
		const mockProgress = new SimpleProgress(async () => {});
		vi.mocked(downloadTestData).mockReturnValue(mockProgress);
		vi.mocked(progressToStream).mockReturnValue(new Response('stream'));

		const mockEvent = createMockEvent();
		await POST(mockEvent);

		expect(resolve_data).toHaveBeenCalledWith('/test-data');
		expect(mkdir).toHaveBeenCalledWith('/resolved/test-data', { recursive: true });
	});

	it('calls downloadTestData with resolved folder', async () => {
		vi.mocked(mkdir).mockResolvedValue(undefined);
		const mockProgress = new SimpleProgress(async () => {});
		vi.mocked(downloadTestData).mockReturnValue(mockProgress);
		vi.mocked(progressToStream).mockReturnValue(new Response('stream'));

		const mockEvent = createMockEvent();
		await POST(mockEvent);

		expect(downloadTestData).toHaveBeenCalledWith('/resolved/test-data');
	});

	it('returns progress stream', async () => {
		vi.mocked(mkdir).mockResolvedValue(undefined);
		const mockProgress = new SimpleProgress(async () => {});
		vi.mocked(downloadTestData).mockReturnValue(mockProgress);

		const mockStreamResponse = new Response('mock stream');
		vi.mocked(progressToStream).mockReturnValue(mockStreamResponse);

		const mockEvent = createMockEvent();
		const response = await POST(mockEvent);

		expect(response).toBe(mockStreamResponse);
		expect(progressToStream).toHaveBeenCalledWith(mockProgress, mockEvent.request.signal);
	});

	it('passes abort signal to progressToStream', async () => {
		vi.mocked(mkdir).mockResolvedValue(undefined);
		const mockProgress = new SimpleProgress(async () => {});
		vi.mocked(downloadTestData).mockReturnValue(mockProgress);
		vi.mocked(progressToStream).mockReturnValue(new Response('stream'));

		const mockEvent = createMockEvent();
		await POST(mockEvent);

		expect(progressToStream).toHaveBeenCalledWith(expect.anything(), mockEvent.request.signal);
	});

	it('handles mkdir errors', async () => {
		vi.mocked(mkdir).mockRejectedValue(new Error('Permission denied'));

		const mockEvent = createMockEvent();
		const response = await POST(mockEvent);

		expect(response.status).toBe(500);
		expect(downloadTestData).not.toHaveBeenCalled();
	});

	it('handles downloadTestData errors', async () => {
		vi.mocked(mkdir).mockResolvedValue(undefined);
		vi.mocked(downloadTestData).mockImplementation(() => {
			throw new Error('Download failed');
		});

		const mockEvent = createMockEvent();
		const response = await POST(mockEvent);

		expect(response.status).toBe(500);
	});

	it('creates directory recursively', async () => {
		vi.mocked(mkdir).mockResolvedValue(undefined);
		const mockProgress = new SimpleProgress(async () => {});
		vi.mocked(downloadTestData).mockReturnValue(mockProgress);
		vi.mocked(progressToStream).mockReturnValue(new Response('stream'));

		const mockEvent = createMockEvent();
		await POST(mockEvent);

		// Verify recursive: true option
		expect(mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
	});
});
