import type { Progress } from '@versatiles-choro/engine';
export * as engine from '@versatiles-choro/engine';


export function progressToStream(progress: Progress, signal: AbortSignal): Response {
	const encoder = new TextEncoder();
	let finished = false;
	let lastProgress: number = -1;
	signal.addEventListener('abort', () => {
		finished = true;
	});
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			function send(obj: unknown) {
				if (finished) return;
				controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
			}
			progress.onProgress((data) => {
				let progress = Math.round(Number(data));
				if (progress !== lastProgress) {
					lastProgress = progress;
					send({ event: 'progress', data: progress });
				}
			});
			progress.onMessage((data) => send({ event: 'message', data }));
			progress.done()
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
};
