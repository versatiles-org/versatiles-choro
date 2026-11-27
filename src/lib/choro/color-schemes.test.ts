import { describe, it, expect } from 'vitest';
import { getColorForValue, viridis } from './color-schemes';

describe('getColorForValue', () => {
	const choropleth = { colorScheme: 'viridis' as const, min: 0, max: 80 };

	it('returns the scheme colors at the stops', () => {
		// 9 colors from 0 to 80 put a stop every 10
		expect(getColorForValue(choropleth, 0)).toBe(viridis[0]);
		expect(getColorForValue(choropleth, 10)).toBe(viridis[1]);
		expect(getColorForValue(choropleth, 80)).toBe(viridis[8]);
	});

	it('interpolates linearly in RGB between stops', () => {
		// halfway between #440154 and #482878
		expect(getColorForValue(choropleth, 5)).toBe('#461566');
	});

	it('clamps values outside the range', () => {
		expect(getColorForValue(choropleth, -100)).toBe(viridis[0]);
		expect(getColorForValue(choropleth, 1000)).toBe(viridis[8]);
	});

	it('returns undefined for values that are not finite numbers', () => {
		expect(getColorForValue(choropleth, undefined)).toBeUndefined();
		expect(getColorForValue(choropleth, null)).toBeUndefined();
		expect(getColorForValue(choropleth, '12')).toBeUndefined();
		expect(getColorForValue(choropleth, NaN)).toBeUndefined();
		expect(getColorForValue(choropleth, Infinity)).toBeUndefined();
	});

	it('handles an empty range', () => {
		const flat = { colorScheme: 'viridis' as const, min: 5, max: 5 };
		expect(getColorForValue(flat, 4)).toBe(viridis[0]);
		expect(getColorForValue(flat, 5)).toBe(viridis[8]);
	});
});
