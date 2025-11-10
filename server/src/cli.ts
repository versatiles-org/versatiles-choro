import { Command } from 'commander';
import { runTippecanoe, runVersaTilesConvert } from './lib/spawn.js';

const program = new Command();

program
	.name('versatiles-choro')
	.description('CLI for VersaTiles Choro <https://github.com/versatiles-org/versatiles-choro/>')
	.showHelpAfterError()
	.version('1.0.0');

program.command('polygons2tiles')
	.description('Convert polygon geometries into tiles')
	.argument('<input>', 'Input file path')
	.argument('<output>', 'Output file path')
	.action(async (input, output) => {
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
	});

program.parse();