import { existsSync, readFileSync } from 'fs';
import { FileSystemError } from '$lib/server/errors/errors';

/**
 * Extract field names from the header row of a CSV or TSV file.
 * Only reads the first line for efficiency with large files.
 *
 * @param filePath - Absolute path to the CSV/TSV file
 * @returns Array of field names (trimmed, non-empty)
 * @throws FileSystemError if file doesn't exist
 */
export function getCSVFieldNames(filePath: string): string[] {
	// Validate file exists
	if (!existsSync(filePath)) {
		throw new FileSystemError(`File not found: ${filePath}`);
	}

	// Read first line only (efficient for large files)
	const content = readFileSync(filePath, 'utf-8');
	const lines = content.split('\n');

	if (lines.length === 0 || lines[0].trim() === '') {
		return [];
	}

	let headerLine = lines[0];

	// Remove BOM (Byte Order Mark) if present
	if (headerLine.charCodeAt(0) === 0xfeff) {
		headerLine = headerLine.slice(1);
	}

	// Detect delimiter based on file extension
	const delimiter = filePath.endsWith('.tsv') ? '\t' : ',';

	// Parse CSV/TSV header row
	// Handle quoted fields: "Field Name",Another,Field
	const fields = parseCSVLine(headerLine, delimiter);

	// Trim whitespace and filter empty fields
	return fields.map((f) => f.trim()).filter((f) => f.length > 0);
}

/**
 * Parse a single CSV/TSV line, handling quoted fields properly.
 * Supports:
 * - Quoted fields: "Field Name"
 * - Escaped quotes: "Field with ""quotes"""
 * - Mixed quoted and unquoted: "Field One",FieldTwo,"Field Three"
 *
 * @param line - The CSV/TSV line to parse
 * @param delimiter - The delimiter character (',' or '\t')
 * @returns Array of field values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
	const fields: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		const nextChar = line[i + 1];

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				// Escaped quote (two consecutive quotes)
				current += '"';
				i++; // Skip next quote
			} else {
				// Toggle quote state
				inQuotes = !inQuotes;
			}
		} else if (char === delimiter && !inQuotes) {
			// End of field (delimiter outside quotes)
			fields.push(current);
			current = '';
		} else {
			current += char;
		}
	}

	// Add last field
	fields.push(current);

	return fields;
}
