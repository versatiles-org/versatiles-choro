import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import type { RequestEvent } from '@sveltejs/kit';

// Mock the serve module
vi.mock('$lib/server/tiles/serve', () => ({
	getTileServerPort: vi.fn()
}));

import { getTileServerPort } from '$lib/server/tiles/serve';

// Store original fetch
const originalFetch = global.fetch;

describe('GET /api/tiles/load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getTileServerPort).mockReturnValue(3333);
		// Reset fetch mock
		global.fetch = vi.fn();
	});

	afterEach(() => {
		global.fetch = originalFetch;
	});

	const createMockEvent = (id: string, path: string): RequestEvent => {
		const url = `http://localhost/api/tiles/load?id=${encodeURIComponent(id)}&path=${encodeURIComponent(path)}`;
		const request = new Request(url, {
			method: 'GET'
		});

		return {
			request,
			route: { id: '/api/tiles/load' }
		} as RequestEvent;
	};

	const createMockTileResponse = (
		status: number,
		buffer: Uint8Array,
		contentType: string = 'application/x-protobuf'
	) => {
		return new Response(buffer, {
			status,
			headers: {
				'content-type': contentType
			}
		});
	};

	it('fetches and returns tile successfully', async () => {
		const tileData = new Uint8Array([1, 2, 3, 4]);
		const mockTileResponse = createMockTileResponse(200, tileData);
		vi.mocked(fetch).mockResolvedValue(mockTileResponse);

		const uuid = '12345678-1234-1234-1234-123456789abc';
		const mockEvent = createMockEvent(uuid, '10/512/384');
		const response = await GET(mockEvent);

		expect(response.status).toBe(200);
		expect(fetch).toHaveBeenCalledWith(`http://localhost:3333/tiles/${uuid}/10/512/384`, {
			method: 'GET'
		});

		const buffer = await response.arrayBuffer();
		expect(new Uint8Array(buffer)).toEqual(tileData);
	});

	it('includes correct headers in response', async () => {
		const tileData = new Uint8Array([1, 2, 3, 4]);
		const mockTileResponse = createMockTileResponse(200, tileData, 'application/x-protobuf');
		vi.mocked(fetch).mockResolvedValue(mockTileResponse);

		const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
		const mockEvent = createMockEvent(uuid, '5/16/12');
		const response = await GET(mockEvent);

		expect(response.headers.get('content-type')).toBe('application/x-protobuf');
		expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
		expect(response.headers.get('content-length')).toBe('4');
	});

	it('uses default content-type when not provided', async () => {
		const tileData = new Uint8Array([1, 2, 3]);
		const mockResponse = new Response(tileData, {
			status: 200,
			headers: {} // No content-type header
		});
		vi.mocked(fetch).mockResolvedValue(mockResponse);

		const uuid = 'fedcba98-7654-3210-fedc-ba9876543210';
		const mockEvent = createMockEvent(uuid, '0/0/0');
		const response = await GET(mockEvent);

		expect(response.headers.get('content-type')).toBe('application/octet-stream');
	});

	it('returns 404 when tile is not found', async () => {
		const mockTileResponse = new Response('Not found', { status: 404 });
		vi.mocked(fetch).mockResolvedValue(mockTileResponse);

		const uuid = '11111111-2222-3333-4444-555555555555';
		const mockEvent = createMockEvent(uuid, '10/512/384');
		const response = await GET(mockEvent);

		expect(response.status).toBe(404);
		const text = await response.text();
		expect(text).toBe('Tile not found');
	});

	it('returns 404 on internal server error', async () => {
		const mockTileResponse = new Response('Server error', { status: 500 });
		vi.mocked(fetch).mockResolvedValue(mockTileResponse);

		const uuid = '99999999-8888-7777-6666-555544443333';
		const mockEvent = createMockEvent(uuid, '10/512/384');
		const response = await GET(mockEvent);

		expect(response.status).toBe(404);
	});

	it('constructs correct tile server URL', async () => {
		vi.mocked(getTileServerPort).mockReturnValue(4444);
		const tileData = new Uint8Array([1]);
		const mockTileResponse = createMockTileResponse(200, tileData);
		vi.mocked(fetch).mockResolvedValue(mockTileResponse);

		const uuid = 'abcdef01-2345-6789-abcd-ef0123456789';
		const mockEvent = createMockEvent(uuid, '12/2048/1536');
		await GET(mockEvent);

		expect(fetch).toHaveBeenCalledWith(`http://localhost:4444/tiles/${uuid}/12/2048/1536`, {
			method: 'GET'
		});
	});

	it('validates query parameters', async () => {
		const url = 'http://localhost/api/tiles/load?invalid=param';
		const request = new Request(url, { method: 'GET' });
		const mockEvent = {
			request,
			route: { id: '/api/tiles/load' }
		} as RequestEvent;

		const response = await GET(mockEvent);

		expect(response.status).toBe(400);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('requires id parameter', async () => {
		const url = 'http://localhost/api/tiles/load?path=10/512/384';
		const request = new Request(url, { method: 'GET' });
		const mockEvent = {
			request,
			route: { id: '/api/tiles/load' }
		} as RequestEvent;

		const response = await GET(mockEvent);

		expect(response.status).toBe(400);
	});

	it('requires path parameter', async () => {
		const url = 'http://localhost/api/tiles/load?id=test-source';
		const request = new Request(url, { method: 'GET' });
		const mockEvent = {
			request,
			route: { id: '/api/tiles/load' }
		} as RequestEvent;

		const response = await GET(mockEvent);

		expect(response.status).toBe(400);
	});

	it('handles URL-encoded parameters', async () => {
		const tileData = new Uint8Array([1, 2, 3]);
		const mockTileResponse = createMockTileResponse(200, tileData);
		vi.mocked(fetch).mockResolvedValue(mockTileResponse);

		const uuid = 'aabbccdd-eeff-0011-2233-445566778899';
		const mockEvent = createMockEvent(uuid, '10/512/384');
		await GET(mockEvent);

		expect(fetch).toHaveBeenCalledWith(`http://localhost:3333/tiles/${uuid}/10/512/384`, {
			method: 'GET'
		});
	});

	it('handles fetch errors', async () => {
		vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

		const uuid = 'ffffffff-eeee-dddd-cccc-bbbbbbbbbbbb';
		const mockEvent = createMockEvent(uuid, '10/512/384');
		const response = await GET(mockEvent);

		expect(response.status).toBe(500);
	});

	it('handles various tile paths', async () => {
		const tileData = new Uint8Array([1]);
		const mockTileResponse = createMockTileResponse(200, tileData);
		vi.mocked(fetch).mockResolvedValue(mockTileResponse);

		// Test different zoom levels and coordinates
		const testCases: Array<[string, string]> = [
			['12345678-1111-2222-3333-444444444444', '0/0/0'],
			['87654321-aaaa-bbbb-cccc-dddddddddddd', '14/8192/6144'],
			['aaaabbbb-cccc-dddd-eeee-ffffffffffff', '18/131072/98304']
		];

		for (const [id, path] of testCases) {
			const mockEvent = createMockEvent(id, path);
			await GET(mockEvent);

			expect(fetch).toHaveBeenCalledWith(`http://localhost:3333/tiles/${id}/${path}`, {
				method: 'GET'
			});
		}
	});

	it('sets correct content-length', async () => {
		const tileData = new Uint8Array(12345);
		const mockTileResponse = createMockTileResponse(200, tileData);
		vi.mocked(fetch).mockResolvedValue(mockTileResponse);

		const uuid = '00000000-1111-2222-3333-444444444444';
		const mockEvent = createMockEvent(uuid, '10/512/384');
		const response = await GET(mockEvent);

		expect(response.headers.get('content-length')).toBe('12345');
	});
});
