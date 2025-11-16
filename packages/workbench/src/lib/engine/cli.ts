import { Command } from 'commander';
import { convertPolygonsToVersatiles } from './geometry/convert.js';
import { logProgress } from './progress/log.js';
import { resolve } from 'node:path';

const program = new Command();
const cwd = process.env.INIT_CWD ?? process.cwd();

program
	.name('versatiles-choro')
	.description('CLI for VersaTiles Choro <https://github.com/versatiles-org/versatiles-choro/>')
	.showHelpAfterError()
	.version('1.0.0');

program
	.command('polygons2tiles')
	.description('Convert polygon geometries into tiles')
	.argument('<input>', 'Input file path')
	.argument('<output>', 'Output file path')
	.action((input, output) => {
		logProgress(
			convertPolygonsToVersatiles(resolve(cwd, String(input)), resolve(cwd, String(output)))
		);
	});

program.parse();
