import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import type { RollupOptions } from 'rollup';

const config: RollupOptions = {
	input: 'src/cli.ts',
	plugins: [
		typescript({ sourceMap: false, allowImportingTsExtensions: false, outDir: 'build-cli' }),
		json()
	],
	output: {
		file: 'build-cli/cli.mjs',
		format: 'esm',
		banner: '#!/usr/bin/env node'
	},
	external: [
		'@sveltejs/kit',
		'@versatiles/versatiles-rs',
		'child_process',
		'commander',
		'fs',
		'fs/promises',
		'https',
		'os',
		'path',
		'pino',
		'valibot',
		'zlib'
	]
};
export default config;
