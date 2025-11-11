import { Command } from 'commander';
import { convertPolygonsToVersatiles } from './lib/1_geometry.js';
import { startServer } from './lib/server.js';

const program = new Command();

program
	.name('versatiles-choro')
	.description('CLI for VersaTiles Choro <https://github.com/versatiles-org/versatiles-choro/>')
	.showHelpAfterError()
	.version('1.0.0');

program.command('server')
	.description('Start the VersaTiles Choro server')
	.action(startServer);

program.command('polygons2tiles')
	.description('Convert polygon geometries into tiles')
	.argument('<input>', 'Input file path')
	.argument('<output>', 'Output file path')
	.action(convertPolygonsToVersatiles);

program.parse();