import esbuild from 'rollup-plugin-esbuild';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import type { RollupOptions } from 'rollup';

const config: RollupOptions = {
	input: 'src/lib/choro/bundle-entry.ts',
	plugins: [
		esbuild({
			target: 'es2020',
			sourceMap: false
		}),
		nodeResolve({
			browser: true,
			preferBuiltins: false
		}),
		commonjs(),
		json()
	],
	output: {
		file: 'build-lib/choro-lib.js',
		format: 'iife',
		name: 'choroLib',
		globals: {
			'maplibre-gl': 'maplibregl'
		}
	},
	external: ['maplibre-gl']
};

export default config;
