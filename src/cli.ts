import { Command } from 'commander';
import { convertPolygonsToVersatiles } from './lib/server/geometry/convert';
import { logProgress } from './lib/server/progress/log';
import { resolve } from 'path';
import { downloadTestData } from '$lib/server/download/test-data';

const program = new Command();
const cwd = process.env.INIT_CWD ?? process.cwd();

program
	.name('versatiles-choro')
	.description('CLI for VersaTiles Choro <https://github.com/versatiles-org/versatiles-choro/>')
	.showHelpAfterError()
	.version('1.0.0');

program
	.command('download-test-data')
	.description('Download test data files')
	.argument('<outputDir>', 'Output directory')
	.action((outputDir) => {
		logProgress(
			downloadTestData(resolve(cwd, String(outputDir)))
		);
	});

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
