import type { Progress } from './progress/index';

export function progressToStream(progress: Progress, signal: AbortSignal): Response {
	const encoder = new TextEncoder();
	let finished = false;
	signal.addEventListener('abort', () => {
		finished = true;
	});
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			function send(obj: unknown) {
				if (finished) return;
				controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
			}
			progress.onProgress((data) => send({ event: 'progress', data }));
			progress.onMessage((data) => send({ event: 'message', data }));
			progress
				.done()
				.then(() => {
					send({ event: 'done' });
					finished = true;
					controller.close();
				})
				.catch((err) => {
					send({ event: 'error', data: String(err) });
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
