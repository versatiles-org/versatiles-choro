import { runVersaTilesServer } from "../lib/spawn.js";

const ports = new Set<number>();
const MIN_PORT = 51001;
const MAX_PORT = 52000;
let port = MIN_PORT;

export function startTileServer(filename: string): { port: number } {
	console.log(`Starting tile server for file ${filename}`);
	while (ports.has(port)) {
		port++;
		if (port > MAX_PORT) port = MIN_PORT;
	}
	ports.add(port);
	const child = runVersaTilesServer(filename, port);
	return { port };
}