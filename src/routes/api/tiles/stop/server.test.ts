import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import type { RequestEvent } from '@sveltejs/kit';

// Mock the serve module
vi.mock('$lib/server/tiles/serve', () => ({
	removeTileSource: vi.fn()
}));

import { removeTileSource } from '$lib/server/tiles/serve';

describe('POST /api/tiles/stop', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const createMockEvent = (
		body: unknown
	): RequestEvent<Record<string, never>, '/api/tiles/stop'> => {
		const request = new Request('http://localhost/api/tiles/stop', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});

		return {
			request,
			route: { id: '/api/tiles/stop' }
		} as RequestEvent<Record<string, never>, '/api/tiles/stop'>;
	};

	it('successfully removes tile source', async () => {
		vi.mocked(removeTileSource).mockResolvedValue(true);

		const mockEvent = createMockEvent({ id: '12345678-1234-1234-1234-123456789abc' });
		const response = await POST(mockEvent);

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toEqual({ success: true });
		expect(removeTileSource).toHaveBeenCalledWith('12345678-1234-1234-1234-123456789abc');
	});

	it('handles non-existent tile source', async () => {
		vi.mocked(removeTileSource).mockResolvedValue(false);

		const mockEvent = createMockEvent({ id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
		const response = await POST(mockEvent);

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toEqual({ success: false });
	});

	it('validates request body schema', async () => {
		const mockEvent = createMockEvent({ invalid: 'data' });
		const response = await POST(mockEvent);

		expect(response.status).toBe(400);
		expect(removeTileSource).not.toHaveBeenCalled();
	});

	it('requires id field', async () => {
		const mockEvent = createMockEvent({});
		const response = await POST(mockEvent);

		expect(response.status).toBe(400);
	});

	it('validates id is a string', async () => {
		const mockEvent = createMockEvent({ id: 123 });
		const response = await POST(mockEvent);

		expect(response.status).toBe(400);
	});

	it('handles empty id string', async () => {
		const mockEvent = createMockEvent({ id: '' });
		const response = await POST(mockEvent);

		// Empty string is not a valid UUID, should return 400
		expect(response.status).toBe(400);
	});

	it('handles removal errors', async () => {
		vi.mocked(removeTileSource).mockRejectedValue(new Error('Removal failed'));

		const mockEvent = createMockEvent({ id: 'fedcba98-7654-3210-fedc-ba9876543210' });
		const response = await POST(mockEvent);

		expect(response.status).toBe(500);
	});
});
