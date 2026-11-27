import { describe, it, expect } from 'vitest';
import { formatCSV, getFieldSeparator, parseCellValue, parseCSV } from './table';

describe('getFieldSeparator', () => {
	it('uses a tab for .tsv and a comma otherwise', () => {
		expect(getFieldSeparator('/data/a.tsv')).toBe('\t');
		expect(getFieldSeparator('/data/a.TSV')).toBe('\t');
		expect(getFieldSeparator('/data/a.csv')).toBe(',');
	});

	it('prefers the configured separator', () => {
		expect(getFieldSeparator('/data/a.csv', ';')).toBe(';');
		expect(getFieldSeparator('/data/a.csv', '\\t')).toBe('\t');
	});
});

describe('parseCSV', () => {
	it('parses header and rows', () => {
		expect(parseCSV('id,name\n1,Berlin\n2,Hamburg\n', ',')).toEqual({
			header: ['id', 'name'],
			rows: [
				['1', 'Berlin'],
				['2', 'Hamburg']
			]
		});
	});

	it('handles quoted fields with separators, quotes and line breaks', () => {
		const { rows } = parseCSV('id,text\n1,"a, ""b""\nc"\n', ',');
		expect(rows).toEqual([['1', 'a, "b"\nc']]);
	});

	it('handles CRLF, blank lines, a BOM and a missing final line break', () => {
		const { header, rows } = parseCSV('\ufeffid;v\r\n\r\n1;2\r\n3;', ';');
		expect(header).toEqual(['id', 'v']);
		expect(rows).toEqual([
			['1', '2'],
			['3', '']
		]);
	});

	it('keeps empty fields', () => {
		expect(parseCSV('a,b,c\n,,\n', ',').rows).toEqual([['', '', '']]);
	});

	it('rejects rows with the wrong number of fields', () => {
		expect(() => parseCSV('a,b\n1,2\n3\n', ',')).toThrow(
			/Line 3 .* 1 fields, but the header has 2/
		);
	});

	it('rejects malformed quoting', () => {
		expect(() => parseCSV('a\n"x"y\n', ',')).toThrow(/after a quoted field/);
		expect(() => parseCSV('a\n"x\n', ',')).toThrow(/Unterminated/);
	});

	it('rejects an empty file', () => {
		expect(() => parseCSV('', ',')).toThrow(/no header row/);
	});
});

describe('formatCSV', () => {
	it('quotes only the fields that need it', () => {
		expect(
			formatCSV([
				['id', 'text'],
				['1', 'plain'],
				['2', 'a,b'],
				['3', 'say "hi"'],
				['4', '"quoted'],
				['5', 'two\nlines']
			])
		).toBe('id,text\n1,plain\n2,"a,b"\n3,say "hi"\n4,"""quoted"\n5,"two\nlines"\n');
	});

	it('round-trips through parseCSV', () => {
		const rows = [
			['id', 'html'],
			['01', '<b>"A", B</b>\r\nnext'],
			['02', '']
		];
		const { header, rows: parsed } = parseCSV(formatCSV(rows), ',');
		expect([header, ...parsed]).toEqual(rows);
	});
});

describe('parseCellValue', () => {
	it('parses numbers as versatiles-rs does', () => {
		expect(parseCellValue('12')).toBe(12);
		expect(parseCellValue('-3')).toBe(-3);
		expect(parseCellValue('1.5')).toBe(1.5);
		expect(parseCellValue('2e3')).toBe(2000);
	});

	it('keeps text that only looks like a number', () => {
		expect(parseCellValue('01')).toBe('01');
		expect(parseCellValue('1.')).toBe('1.');
		expect(parseCellValue('1,5')).toBe('1,5');
		expect(parseCellValue('')).toBe('');
	});

	it('parses booleans', () => {
		expect(parseCellValue('true')).toBe(true);
		expect(parseCellValue('false')).toBe(false);
	});

	it('applies a decimal separator to numbers only', () => {
		expect(parseCellValue('1,5', ',')).toBe(1.5);
		expect(parseCellValue('Berlin, Mitte', ',')).toBe('Berlin, Mitte');
	});
});
