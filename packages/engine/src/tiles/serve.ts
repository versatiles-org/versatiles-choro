import { runVersaTilesServer } from "../lib/spawn.js";

const ports = new Set<number>();
const MIN_PORT = 51001;
const MAX_PORT = 52000;
let port = MIN_PORT;

export async function startTileServer(filename: string): Promise<{ port: number; }> {
	console.log(`Starting tile server for file ${filename}`);
	while (ports.has(port)) {
		port++;
		if (port > MAX_PORT) port = MIN_PORT;
	}
	ports.add(port);
	runVersaTilesServer(filename, port);

	// wait until the there is a response at `http://localhost:${port}/tiles/index.json`
	await new Promise<void>((resolve) => {
		const url = `http://localhost:${port}/tiles/index.json`;
		const interval = setInterval(async () => {
			await Promise.race([
				fetch(url).then(() => {
					clearInterval(interval);
					resolve();
				}),
				new Promise<void>((r) =>
					setTimeout(() => r(), 300)
				)
			]);
		}, 500)
	});


	return { port };
}