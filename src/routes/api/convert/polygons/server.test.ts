import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import type { RequestEvent } from '@sveltejs/kit';
import { SimpleProgress } from '$lib/server/progress/simple';

// Mock filesystem utilities
vi.mock('$lib/server/filesystem/filesystem', () => ({
	resolveDataPath: vi.fn((path: string) => `/resolved/${path}`)
}));

// Mock conversion module
vi.mock('$lib/server/convert/geometry', () => ({
	convertPolygonsToVersatiles: vi.fn()
}));

// Mock progress to stream
vi.mock('$lib/server/progress', () => ({
	progressToStream: vi.fn()
}));

import { resolveDataPath } from '$lib/server/filesystem/filesystem';
import { convertPolygonsToVersatiles } from '$lib/server/convert/geometry';
import { progressToStream } from '$lib/server/progress';

describe('POST /api/convert/polygons', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const createMockEvent = (
		body: unknown
	): RequestEvent<Record<string, never>, '/api/convert/polygons'> => {
		const request = new Request('http://localhost/api/convert/polygons', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});

		return {
			request,
			route: { id: '/api/convert/polygons' }
		} as RequestEvent<Record<string, never>, '/api/convert/polygons'>;
	};

	it('converts polygons with valid request', async () => {
		const mockProgress = new SimpleProgress(async () => {});
		vi.mocked(convertPolygonsToVersatiles).mockReturnValue(mockProgress);
		vi.mocked(progressToStream).mockReturnValue(new Response('stream'));

		const requestBody = {
			input: 'input.geojson',
			output: 'output.versatiles'
		};

		const mockEvent = createMockEvent(requestBody);
		await POST(mockEvent);

		expect(resolveDataPath).toHaveBeenCalledWith('input.geojson');
		expect(resolveDataPath).toHaveBeenCalledWith('output.versatiles');
		expect(convertPolygonsToVersatiles).toHaveBeenCalledWith(
			'/resolved/input.geojson',
			'/resolved/output.versatiles'
		);
	});

	it('returns progress stream', async () => {
		const mockProgress = new SimpleProgress(async () => {});
		vi.mocked(convertPolygonsToVersatiles).mockReturnValue(mockProgress);

		const mockStreamResponse = new Response('mock stream');
		vi.mocked(progressToStream).mockReturnValue(mockStreamResponse);

		const requestBody = {
			input: 'data.geojson',
			output: 'tiles.versatiles'
		};

		const mockEvent = createMockEvent(requestBody);
		const response = await POST(mockEvent);

		expect(response).toBe(mockStreamResponse);
		expect(progressToStream).toHaveBeenCalledWith(mockProgress, mockEvent.request.signal);
	});

	it('validates request body schema', async () => {
		const mockEvent = createMockEvent({ invalid: 'data' });
		const response = await POST(mockEvent);

		expect(response.status).toBe(400);
		expect(convertPolygonsToVersatiles).not.toHaveBeenCalled();
	});

	it('requires input field', async () => {
		const mockEvent = createMockEvent({ output: 'file.versatiles' });
		const response = await POST(mockEvent);

		expect(response.status).toBe(400);
	});

	it('requires output field', async () => {
		const mockEvent = createMockEvent({ input: 'file.geojson' });
		const response = await POST(mockEvent);

		expect(response.status).toBe(400);
	});

	it('validates both fields are strings', async () => {
		const mockEvent = createMockEvent({
			input: 123,
			output: 'file.versatiles'
		});
		const response = await POST(mockEvent);

		expect(response.status).toBe(400);
	});

	it('passes abort signal to progressToStream', async () => {
		const mockProgress = new SimpleProgress(async () => {});
		vi.mocked(convertPolygonsToVersatiles).mockReturnValue(mockProgress);
		vi.mocked(progressToStream).mockReturnValue(new Response('stream'));

		const requestBody = {
			input: 'input.geojson',
			output: 'output.versatiles'
		};

		const mockEvent = createMockEvent(requestBody);
		await POST(mockEvent);

		expect(progressToStream).toHaveBeenCalledWith(expect.anything(), mockEvent.request.signal);
	});

	it('handles conversion errors', async () => {
		vi.mocked(convertPolygonsToVersatiles).mockImplementation(() => {
			throw new Error('Conversion failed');
		});

		const requestBody = {
			input: 'input.geojson',
			output: 'output.versatiles'
		};

		const mockEvent = createMockEvent(requestBody);
		const response = await POST(mockEvent);

		expect(response.status).toBe(500);
	});

	it('handles path resolution errors', async () => {
		vi.mocked(resolveDataPath).mockImplementation(() => {
			throw new Error('Path traversal detected');
		});

		const requestBody = {
			input: '../etc/passwd',
			output: 'output.versatiles'
		};

		const mockEvent = createMockEvent(requestBody);
		const response = await POST(mockEvent);

		expect(response.status).toBe(500);
	});
});
