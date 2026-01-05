import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getCSVFieldNames } from './fields';
import { FileSystemError } from '$lib/server/errors/errors';

describe('getCSVFieldNames', () => {
	const TEST_DIR = join(process.cwd(), '.test-csv-files');

	beforeEach(() => {
		// Clean up test directory before each test
		if (existsSync(TEST_DIR)) {
			rmSync(TEST_DIR, { recursive: true, force: true });
		}
		mkdirSync(TEST_DIR, { recursive: true });
	});

	afterAll(() => {
		// Clean up after all tests
		if (existsSync(TEST_DIR)) {
			rmSync(TEST_DIR, { recursive: true, force: true });
		}
	});

	describe('CSV files (comma-delimited)', () => {
		it('should extract simple field names from CSV', () => {
			const filePath = join(TEST_DIR, 'simple.csv');
			writeFileSync(filePath, 'id,name,value\n1,Alice,100\n2,Bob,200');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual(['id', 'name', 'value']);
		});

		it('should handle quoted field names in CSV', () => {
			const filePath = join(TEST_DIR, 'quoted.csv');
			writeFileSync(filePath, '"Field One","Field Two","Field Three"\n1,2,3');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual(['Field One', 'Field Two', 'Field Three']);
		});

		it('should handle mixed quoted and unquoted fields', () => {
			const filePath = join(TEST_DIR, 'mixed.csv');
			writeFileSync(filePath, '"ID Field",name,"Value Field",count\n1,Alice,100,5');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual(['ID Field', 'name', 'Value Field', 'count']);
		});

		it('should handle escaped quotes in field names', () => {
			const filePath = join(TEST_DIR, 'escaped.csv');
			writeFileSync(filePath, '"Field with ""quotes""",normal,another\n1,2,3');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual(['Field with "quotes"', 'normal', 'another']);
		});

		it('should trim whitespace from field names', () => {
			const filePath = join(TEST_DIR, 'whitespace.csv');
			writeFileSync(filePath, '  id  ,  name  ,  value  \n1,Alice,100');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual(['id', 'name', 'value']);
		});

		it('should filter out empty fields', () => {
			const filePath = join(TEST_DIR, 'empty-fields.csv');
			writeFileSync(filePath, 'id,,name,,,value\n1,2,3,4,5,6');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual(['id', 'name', 'value']);
		});

		it('should handle CSV with BOM (Byte Order Mark)', () => {
			const filePath = join(TEST_DIR, 'bom.csv');
			const BOM = '\uFEFF';
			writeFileSync(filePath, BOM + 'id,name,value\n1,Alice,100');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual(['id', 'name', 'value']);
		});

		it('should handle field names with special characters', () => {
			const filePath = join(TEST_DIR, 'special.csv');
			writeFileSync(filePath, 'ID_Field,Name-123,Value(USD),Count%\n1,2,3,4');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual(['ID_Field', 'Name-123', 'Value(USD)', 'Count%']);
		});

		it('should handle unicode field names', () => {
			const filePath = join(TEST_DIR, 'unicode.csv');
			writeFileSync(filePath, 'id,名前,αξιά,значение\n1,2,3,4', 'utf-8');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual(['id', '名前', 'αξιά', 'значение']);
		});

		it('should only read the header line (efficient for large files)', () => {
			const filePath = join(TEST_DIR, 'large.csv');
			const header = 'id,name,value\n';
			const rows = Array(10000)
				.fill(null)
				.map((_, i) => `${i},Name${i},${i * 100}`)
				.join('\n');
			writeFileSync(filePath, header + rows);

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual(['id', 'name', 'value']);
		});
	});

	describe('TSV files (tab-delimited)', () => {
		it('should extract simple field names from TSV', () => {
			const filePath = join(TEST_DIR, 'simple.tsv');
			writeFileSync(filePath, 'id\tname\tvalue\n1\tAlice\t100\n2\tBob\t200');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual(['id', 'name', 'value']);
		});

		it('should handle quoted field names in TSV', () => {
			const filePath = join(TEST_DIR, 'quoted.tsv');
			writeFileSync(filePath, '"Field One"\t"Field Two"\t"Field Three"\n1\t2\t3');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual(['Field One', 'Field Two', 'Field Three']);
		});

		it('should handle mixed quoted and unquoted TSV fields', () => {
			const filePath = join(TEST_DIR, 'mixed.tsv');
			writeFileSync(filePath, '"ID Field"\tname\t"Value Field"\tcount\n1\tAlice\t100\t5');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual(['ID Field', 'name', 'Value Field', 'count']);
		});

		it('should handle TSV with BOM', () => {
			const filePath = join(TEST_DIR, 'bom.tsv');
			const BOM = '\uFEFF';
			writeFileSync(filePath, BOM + 'id\tname\tvalue\n1\tAlice\t100');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual(['id', 'name', 'value']);
		});
	});

	describe('Edge cases', () => {
		it('should return empty array for empty file', () => {
			const filePath = join(TEST_DIR, 'empty.csv');
			writeFileSync(filePath, '');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual([]);
		});

		it('should return empty array for file with only whitespace', () => {
			const filePath = join(TEST_DIR, 'whitespace-only.csv');
			writeFileSync(filePath, '   \n   \n   ');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual([]);
		});

		it('should handle file with only header line', () => {
			const filePath = join(TEST_DIR, 'header-only.csv');
			writeFileSync(filePath, 'id,name,value');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual(['id', 'name', 'value']);
		});

		it('should handle file with carriage return + line feed (Windows)', () => {
			const filePath = join(TEST_DIR, 'windows.csv');
			writeFileSync(filePath, 'id,name,value\r\n1,Alice,100\r\n2,Bob,200');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual(['id', 'name', 'value']);
		});

		it('should handle single field CSV', () => {
			const filePath = join(TEST_DIR, 'single.csv');
			writeFileSync(filePath, 'id\n1\n2\n3');

			const fields = getCSVFieldNames(filePath);

			expect(fields).toEqual(['id']);
		});
	});

	describe('Error handling', () => {
		it('should throw FileSystemError for non-existent file', () => {
			const filePath = join(TEST_DIR, 'non-existent.csv');

			expect(() => getCSVFieldNames(filePath)).toThrow(FileSystemError);
			expect(() => getCSVFieldNames(filePath)).toThrow('File not found');
		});

		it('should throw FileSystemError with correct path in error message', () => {
			const filePath = join(TEST_DIR, 'missing.csv');

			expect(() => getCSVFieldNames(filePath)).toThrow(filePath);
		});
	});
});
