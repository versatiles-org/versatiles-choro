import { Command } from 'commander';
import { convertPolygonsToVersatiles } from '$lib/server/convert/geometry';
import { resolve } from 'path';
import { downloadTestData } from '$lib/server/download/test-data';
import { convertTiles } from '$lib/server/convert/tiles';
import type { VPLParam } from '$lib/api/vpl';
import type { InferOutput } from 'valibot';

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
	.action((outputDir) => downloadTestData(resolve(cwd, String(outputDir))).log());

program
	.command('polygons2tiles')
	.description('Convert polygon geometries into tiles')
	.argument('<input>', 'Input file path')
	.argument('<output>', 'Output file path')
	.action((input, output) =>
		convertPolygonsToVersatiles(resolve(cwd, String(input)), resolve(cwd, String(output))).log()
	);

program
	.command('add-data')
	.description('Add data to existing VersaTiles container')
	.argument('<input>', 'Input VersaTiles container file path')
	.argument('<layer_name>', 'Layer name to add data to')
	.argument('<id_field_tiles>', 'ID field in tiles')
	.argument('<data>', 'Data file path to add')
	.argument('<id_field_data>', 'ID field in data file')
	.argument('<output>', 'Output VersaTiles container file path')
	.action((input, layer_name, id_field_tiles, data, id_field_data, output) => {
		const vpl: InferOutput<typeof VPLParam> = {
			from_container: { filename: resolve(cwd, String(input)) },
			update_properties: {
				data_source_path: resolve(cwd, String(data)),
				layer_name: String(layer_name),
				id_field_tiles: String(id_field_tiles),
				id_field_data: String(id_field_data),
				replace_properties: true,
				remove_non_matching: true,
				include_id: true
			}
		};
		convertTiles(vpl, resolve(cwd, String(output))).log();
	});

program.parse();
