import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import type { RequestEvent } from '@sveltejs/kit';

// Mock the serve module
vi.mock('$lib/server/tiles/serve', () => ({
	addTileSource: vi.fn()
}));

// Mock console.log to avoid test output clutter
vi.spyOn(console, 'log').mockImplementation(() => {});

import { addTileSource } from '$lib/server/tiles/serve';

describe('POST /api/tiles/init', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const createMockEvent = (body: unknown): RequestEvent => {
		const request = new Request('http://localhost/api/tiles/init', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});

		return {
			request,
			route: { id: '/api/tiles/init' }
		} as RequestEvent;
	};

	it('initializes tile source with from_container VPL', async () => {
		vi.mocked(addTileSource).mockResolvedValue('source-123');

		const vplParams = {
			vpl: {
				from_container: { filename: 'test.versatiles' }
			}
		};

		const mockEvent = createMockEvent(vplParams);
		const response = await POST(mockEvent);

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toEqual({ id: 'source-123' });
		expect(addTileSource).toHaveBeenCalledWith(vplParams.vpl);
	});

	it('initializes tile source with update_properties VPL', async () => {
		vi.mocked(addTileSource).mockResolvedValue('source-456');

		const vplParams = {
			vpl: {
				from_container: { filename: 'input.versatiles' },
				update_properties: {
					data_source_path: 'data.csv',
					layer_name: 'regions',
					id_field_tiles: 'region_id',
					id_field_data: 'id'
				}
			}
		};

		const mockEvent = createMockEvent(vplParams);
		const response = await POST(mockEvent);

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toEqual({ id: 'source-456' });
		expect(addTileSource).toHaveBeenCalledWith(vplParams.vpl);
	});

	it('includes old_id when provided', async () => {
		vi.mocked(addTileSource).mockResolvedValue('12345678-1234-1234-1234-123456789abc');

		const vplParams = {
			old_id: 'fedcba98-7654-3210-fedc-ba9876543210',
			vpl: {
				from_container: { filename: 'test.versatiles' }
			}
		};

		const mockEvent = createMockEvent(vplParams);
		const response = await POST(mockEvent);

		expect(response.status).toBe(200);
		expect(addTileSource).toHaveBeenCalled();
	});

	it('validates request body schema', async () => {
		const mockEvent = createMockEvent({ invalid: 'data' });
		const response = await POST(mockEvent);

		expect(response.status).toBe(400);
		expect(addTileSource).not.toHaveBeenCalled();
	});

	it('requires vpl field', async () => {
		const mockEvent = createMockEvent({});
		const response = await POST(mockEvent);

		expect(response.status).toBe(400);
	});

	it('validates VPL structure', async () => {
		const mockEvent = createMockEvent({
			vpl: { invalid_field: true }
		});
		const response = await POST(mockEvent);

		expect(response.status).toBe(400);
	});

	it('handles addTileSource errors', async () => {
		vi.mocked(addTileSource).mockRejectedValue(new Error('Failed to add source'));

		const mockEvent = createMockEvent({
			vpl: {
				from_container: { filename: 'error.versatiles' }
			}
		});
		const response = await POST(mockEvent);

		expect(response.status).toBe(500);
	});

	it('logs initialization params', async () => {
		vi.mocked(addTileSource).mockResolvedValue('test-id');

		const vplParams = {
			vpl: {
				from_container: { filename: 'test.versatiles' }
			}
		};

		const mockEvent = createMockEvent(vplParams);
		await POST(mockEvent);

		expect(console.log).toHaveBeenCalledWith('Initializing tile source with params:', vplParams);
	});
});
