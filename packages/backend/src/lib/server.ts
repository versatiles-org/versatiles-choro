import { spawn } from 'child_process';
import express from 'express';

export async function startServer(dev: boolean = false) {
	const app = express();
	app.use(express.json());
	app.get('/health', (_, res) => res.send({ status: 'ok' }));

	if (dev) {
		// Vite should already be running in dev mode; we just proxy to it
		const { default: proxy } = await import('express-http-proxy');
		app.use('/', proxy('http://localhost:5173'));
		console.log('Running in development mode with Vite proxy');
	}

	app.listen(8080, () => console.log('VersaTiles Choro server running on http://localhost:8080'));
}
