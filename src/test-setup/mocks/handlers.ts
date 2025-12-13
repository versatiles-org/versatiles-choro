/**
 * MSW request handlers for API mocking
 */

import { http, HttpResponse } from 'msw';

export const handlers = [
	// Mock /api/convert/polygons endpoint with streaming response
	http.post('/api/convert/polygons', () => {
		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			start(controller) {
				// Send progress updates
				controller.enqueue(encoder.encode('{"type":"progress","value":0}\n'));
				controller.enqueue(encoder.encode('{"type":"progress","value":50}\n'));
				controller.enqueue(encoder.encode('{"type":"progress","value":100}\n'));
				controller.enqueue(encoder.encode('{"type":"complete"}\n'));
				controller.close();
			}
		});

		return new HttpResponse(stream, {
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}),

	// Mock /api/tiles/init endpoint
	http.get('/api/tiles/init', () => {
		return HttpResponse.json({
			success: true,
			data: {
				bounds: [-180, -85, 180, 85],
				center: [0, 0, 2]
			}
		});
	}),

	// Mock /api/tiles/load endpoint
	http.get('/api/tiles/load', () => {
		return HttpResponse.json({
			success: true,
			tiles: []
		});
	}),

	// Mock /api/download/test-data endpoint
	http.get('/api/download/test-data', () => {
		return new HttpResponse('test data', {
			headers: {
				'Content-Type': 'application/octet-stream'
			}
		});
	})
];
