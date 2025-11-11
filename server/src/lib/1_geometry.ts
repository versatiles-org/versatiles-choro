import { runTippecanoe, runVersaTilesConvert } from "./spawn.js";

export async function convertPolygonsToVersatiles(input: string, output: string) {
	if (!output.endsWith('.versatiles')) {
		throw new Error('Output file must have a .versatiles extension');
	}
	const mbtilesFile = output.replace(/\.versatiles$/, '.mbtiles');
	console.log(`Converting polygons from ${input} to tiles at ${mbtilesFile}`);
	await runTippecanoe(input, mbtilesFile, {
		'force': true,
		'maximum-zoom': 14,
	});
	await runVersaTilesConvert(mbtilesFile, output, {
		'compress': 'brotli',
	});
}