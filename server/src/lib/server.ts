import express from 'express';

export function startServer() {
	const app = express();
	app.use(express.json());
	app.get('/health', (_, res) => res.send({ status: 'ok' }));
	app.listen(8080, () => console.log('VersaTiles Choro server running on http://localhost:8080'));
}