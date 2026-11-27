import { describe, it, expect } from 'vitest';
import { getTemplateFields, interpolateTemplate } from './tooltip';

describe('getTemplateFields', () => {
	it('returns each placeholder once', () => {
		expect(getTemplateFields('<b>{name}</b> {value} {name}')).toEqual(['name', 'value']);
		expect(getTemplateFields('no placeholders')).toEqual([]);
	});
});

describe('interpolateTemplate', () => {
	it('replaces placeholders and leaves missing values empty', () => {
		expect(interpolateTemplate('{name}: {value}', { name: 'Berlin' })).toBe('Berlin: ');
	});
});
