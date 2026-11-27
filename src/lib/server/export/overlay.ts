/**
 * Builds the data of an exported overlay: each feature keeps only its computed `color_0`
 * and `tooltip_text`, so the exported tiles carry no raw data.
 *
 * The values are computed from the rows of the joined data file, written to a second data
 * file, and joined onto the geometry in place of the original one.
 */

import { join, posix } from 'path';
import { writeFile } from 'fs/promises';
import type { InferOutput } from 'valibot';
import type { VPLParam, VPLParamUpdateProperties } from '#lib/api/schemas/index.js';
import { getColorForValue, type ChoroplethParams } from '#lib/choro/color-schemes.js';
import { COLOR_PROPERTY, EXPORTED_PROPERTIES, TOOLTIP_PROPERTY } from '#lib/choro/export-config.js';
import { getTemplateFields, interpolateTemplate } from '#lib/choro/tooltip.js';
import {
	formatCSV,
	getFieldSeparator,
	parseCellValue,
	readCSVTable,
	type CSVTable
} from '#lib/server/csv/index.js';
import { ValidationError } from '#lib/server/errors/errors.js';
import { resolveDataPath } from '#lib/server/filesystem/filesystem.js';

type UpdateProperties = InferOutput<typeof VPLParamUpdateProperties>;

/** File name of the computed data file, written into the export directory while exporting. */
export const OVERLAY_DATA_FILENAME = '.overlay-data.csv';

/**
 * Computes the exported properties for every row of the data file.
 *
 * @returns The rows of the computed data file: the id column, `color_0` and, with a tooltip
 * template, `tooltip_text`
 * @throws ValidationError if the color field or a tooltip placeholder is not a column of the
 * data file, since only those can be computed
 */
export function computeOverlayData(
	table: CSVTable,
	update: Pick<UpdateProperties, 'id_field_data' | 'decimal_separator'>,
	choropleth: ChoroplethParams
): string[][] {
	const { header, rows } = table;
	const template = choropleth.tooltipTemplate;

	const missing = [choropleth.field, ...(template ? getTemplateFields(template) : [])].filter(
		(field) => !header.includes(field)
	);
	if (missing.length > 0) {
		throw new ValidationError(
			`An export can only use columns of the data file, but these are not: ${[...new Set(missing)].join(', ')}. ` +
				'Choose a value field and tooltip placeholders from the data file.'
		);
	}

	const idIndex = header.indexOf(update.id_field_data);
	if (idIndex < 0) {
		throw new ValidationError(`The data file has no column "${update.id_field_data}"`);
	}

	const outputHeader = [update.id_field_data, COLOR_PROPERTY];
	if (template) outputHeader.push(TOOLTIP_PROPERTY);

	return [
		outputHeader,
		...rows.map((row) => {
			const properties = Object.fromEntries(
				header.map((name, index) => [name, parseCellValue(row[index], update.decimal_separator)])
			);
			const output = [
				row[idIndex],
				getColorForValue(choropleth, properties[choropleth.field]) ?? ''
			];
			if (template) output.push(interpolateTemplate(template, properties));
			return output;
		})
	];
}

/**
 * Reads the joined data file and writes the computed data file into the export directory.
 */
export async function writeOverlayData(
	update: UpdateProperties,
	choropleth: ChoroplethParams,
	outputDir: string
): Promise<void> {
	const inputPath = resolveDataPath(update.data_source_path);
	const table = await readCSVTable(inputPath, getFieldSeparator(inputPath, update.field_separator));
	const rows = computeOverlayData(table, update, choropleth);
	await writeFile(join(outputDir, OVERLAY_DATA_FILENAME), formatCSV(rows));
}

/**
 * Escapes a string for literal use in a regular expression.
 */
function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Returns the pipeline that writes the exported overlay: the original one, with the computed
 * data file joined in place of the original and every other property removed.
 *
 * @param outputPath - The export directory, relative to the data directory
 */
export function buildExportVPL(
	vpl: InferOutput<typeof VPLParam>,
	outputPath: string
): InferOutput<typeof VPLParam> {
	const update = vpl.update_properties;
	if (!update) throw new ValidationError('An export needs a data file joined to the geometry');

	return {
		...vpl,
		update_properties: {
			data_source_path: posix.join(outputPath, OVERLAY_DATA_FILENAME),
			layer_name: update.layer_name,
			id_field_tiles: update.id_field_tiles,
			id_field_data: update.id_field_data,
			remove_non_matching: update.remove_non_matching
		},
		filter_properties: {
			regex: `^${escapeRegex(update.layer_name)}/(${EXPORTED_PROPERTIES.join('|')})$`,
			invert: true
		}
	};
}
