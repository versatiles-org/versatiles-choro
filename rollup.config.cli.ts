import typescript from '@rollup/plugin-typescript';
import type { RollupOptions } from 'rollup';

const config: RollupOptions = {
	input: 'src/cli.ts',
	plugins: [
		typescript({ sourceMap: false, allowImportingTsExtensions: false, outDir: 'build-cli' })
	],
	output: {
		file: 'build-cli/cli.mjs',
		format: 'esm',
		banner: '#!/usr/bin/env node'
	},
	external: [
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
