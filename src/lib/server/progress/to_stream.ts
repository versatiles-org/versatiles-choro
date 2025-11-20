import type { ProgressStatus } from '$lib/api/types';
import type { Progress } from './index';
import type { InferInput } from 'valibot';

export function progressToStream(progress: Progress, signal: AbortSignal): Response {
	const encoder = new TextEncoder();
	let finished = false;
	signal.addEventListener('abort', () => {
		finished = true;
	});
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			function send(obj: InferInput<typeof ProgressStatus>) {
				if (finished) return;
				controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
			}
			progress.onProgress((progress) => send({ event: 'progress', progress }));
			progress.onMessage((message) => send({ event: 'message', message }));
			progress
				.done()
				.then(() => {
					send({ event: 'done' });
					finished = true;
					controller.close();
				})
				.catch((err) => {
					send({ event: 'error', error: String(err) });
					finished = true;
					controller.close();
				});
		}
	});
	return new Response(stream, {
		headers: {
			'Content-Type': 'application/x-ndjson',
			'Cache-Control': 'no-cache'
		}
	});
}
