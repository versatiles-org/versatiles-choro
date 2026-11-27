/**
 * Reads and writes whole CSV/TSV tables the way `vector_update_properties` in versatiles-rs
 * reads them, so that values computed here match what the tile pipeline joins.
 */

import { readFile } from 'fs/promises';
import { ValidationError } from '#lib/server/errors/errors.js';

export interface CSVTable {
	header: string[];
	rows: string[][];
}

/**
 * Returns the field separator versatiles-rs uses for a data file: the configured one, or a
 * tab for `.tsv` and a comma for everything else.
 *
 * @param fieldSeparator - The `field_separator` VPL value, where `\t` stands for a tab
 */
export function getFieldSeparator(filePath: string, fieldSeparator?: string): string {
	if (fieldSeparator === '\\t') return '\t';
	if (fieldSeparator) return fieldSeparator;
	return filePath.toLowerCase().endsWith('.tsv') ? '\t' : ',';
}

/**
 * Reads a CSV/TSV file into its header and rows.
 */
export async function readCSVTable(filePath: string, separator: string): Promise<CSVTable> {
	return parseCSV(await readFile(filePath, 'utf-8'), separator);
}

/**
 * Parses CSV/TSV text into its header and rows.
 *
 * A field starting with `"` is quoted: it may contain separators and line breaks, and `""`
 * stands for one `"`. Blank lines are skipped, and every row must have as many fields as
 * the header.
 *
 * @throws ValidationError for malformed quoting or a row with the wrong number of fields
 */
export function parseCSV(content: string, separator: string): CSVTable {
	if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);

	const records: { fields: string[]; line: number }[] = [];
	let fields: string[] = [];
	let line = 1;
	let recordLine = 1;
	let i = 0;

	const endRecord = () => {
		if (!(fields.length === 1 && fields[0] === '')) records.push({ fields, line: recordLine });
		fields = [];
	};

	while (i < content.length) {
		let value = '';
		if (content[i] === '"') {
			i++;
			for (;;) {
				if (i >= content.length) {
					throw new ValidationError(`Unterminated quoted field in line ${recordLine}`);
				}
				const char = content[i++];
				if (char === '"') {
					if (content[i] === '"') {
						value += '"';
						i++;
					} else {
						break;
					}
				} else {
					if (char === '\n') line++;
					value += char;
				}
			}
			const next = content[i];
			if (next !== undefined && next !== separator && next !== '\n' && next !== '\r') {
				throw new ValidationError(
					`Expected ${JSON.stringify(separator)} or end of line after a quoted field in line ${line}`
				);
			}
		} else {
			while (
				i < content.length &&
				content[i] !== separator &&
				content[i] !== '\n' &&
				content[i] !== '\r'
			) {
				value += content[i++];
			}
		}
		fields.push(value);

		// Skip carriage returns, then end the field or the record
		while (content[i] === '\r') i++;
		if (i >= content.length) break;
		if (content[i] === separator) {
			i++;
			if (i >= content.length) fields.push('');
			continue;
		}
		if (content[i] !== '\n') {
			throw new ValidationError(`Unexpected carriage return in line ${line} of the data file`);
		}
		i++;
		endRecord();
		line++;
		recordLine = line;
	}
	if (fields.length > 0) endRecord();

	if (records.length === 0) throw new ValidationError('The data file has no header row');

	const [headerRecord, ...rowRecords] = records;
	const header = headerRecord.fields;
	for (const record of rowRecords) {
		if (record.fields.length !== header.length) {
			throw new ValidationError(
				`Line ${record.line} of the data file has ${record.fields.length} fields, but the header has ${header.length}`
			);
		}
	}

	return { header, rows: rowRecords.map((record) => record.fields) };
}

/**
 * Formats rows as CSV, quoting the fields that need it.
 */
export function formatCSV(rows: string[][], separator: string = ','): string {
	const quote = (value: string) =>
		value === '' ||
		(!value.startsWith('"') &&
			!value.includes(separator) &&
			!value.includes('\n') &&
			!value.includes('\r'))
			? value
			: `"${value.replaceAll('"', '""')}"`;
	return rows.map((row) => row.map(quote).join(separator)).join('\n') + '\n';
}

/**
 * Converts a cell to the value versatiles-rs gives it: a number if it looks like one, a
 * boolean for `true` and `false`, and otherwise the text.
 *
 * @param decimalSeparator - The `decimal_separator` VPL value, used for numbers
 */
export function parseCellValue(
	value: string,
	decimalSeparator?: string
): string | number | boolean {
	if (value === 'true') return true;
	if (value === 'false') return false;

	const number =
		decimalSeparator && decimalSeparator !== '.' ? value.replaceAll(decimalSeparator, '.') : value;
	if (
		/^-?(?:0|[1-9]\d*)(?:(?:\.\d+)(?:[eE][+-]?\d+)?|[eE][+-]?\d+)$/.test(number) ||
		/^-?(?:0|[1-9]\d*)$/.test(number)
	) {
		return Number(number);
	}
	return value;
}
