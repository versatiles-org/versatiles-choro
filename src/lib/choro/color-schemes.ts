/**
 * Color schemes for choropleth maps.
 * Each scheme is an array of hex colors from low to high values.
 */

// Viridis: Purple → Blue → Teal → Green → Yellow
export const viridis = [
	'#440154',
	'#482878',
	'#3e4a89',
	'#31688e',
	'#26838f',
	'#1f9e89',
	'#6cce5a',
	'#b5de2c',
	'#fde725'
];

// Plasma: Purple → Pink → Orange → Yellow
export const plasma = [
	'#0d0887',
	'#46039f',
	'#7201a8',
	'#9c179e',
	'#bd3786',
	'#d8576b',
	'#ed7953',
	'#fb9f3a',
	'#fdca26'
];

// Inferno: Black → Purple → Red → Orange → Yellow
export const inferno = [
	'#000004',
	'#1b0c41',
	'#4a0c6b',
	'#781c6d',
	'#a52c60',
	'#cf4446',
	'#ed6925',
	'#fb9b06',
	'#f7d13d'
];

// Magma: Black → Purple → Pink → Light Pink
export const magma = [
	'#000004',
	'#180f3d',
	'#440f76',
	'#721f81',
	'#9e2f7f',
	'#cd4071',
	'#f1605d',
	'#fd9668',
	'#fcfdbf'
];

export const COLOR_SCHEMES = {
	viridis,
	plasma,
	inferno,
	magma
} as const;

export type ColorSchemeName = keyof typeof COLOR_SCHEMES;

export const COLOR_SCHEME_NAMES: ColorSchemeName[] = ['viridis', 'plasma', 'inferno', 'magma'];

export interface ChoroplethParams {
	field: string;
	colorScheme: ColorSchemeName;
	min: number;
	max: number;
	tooltipTemplate?: string;
}
