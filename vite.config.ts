import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
	plugins: [
		sveltekit(),
		visualizer({
			filename: 'stats.html',
			open: false,
			gzipSize: true,
			brotliSize: true
		})
	],
	test: {
		globals: true,
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'.svelte-kit/**',
				'**/*.config.{js,ts}',
				'**/*.{test,spec}.{js,ts}',
				'**/mockData/**',
				'coverage/**',
				'node_modules/**',
				'src/test-setup/**',
				'src/app.d.ts',
				'src/hooks.client.ts',
				'src/hooks.server.ts'
			],
			thresholds: {
				branches: 70,
				functions: 70,
				lines: 70,
				statements: 70
			}
		},
		projects: [
			{
				extends: './vite.config.ts',
				resolve: {
					conditions: ['browser']
				},
				test: {
					name: 'client',
					environment: 'jsdom',
					setupFiles: [
						'./src/test-setup/setup.ts',
						'./src/test-setup/client-setup.ts',
						'./src/test-setup/mocks/maplibre.ts',
						'./src/test-setup/mocks/remote-functions.ts'
					],
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					setupFiles: ['./src/test-setup/server-setup.ts'],
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	},
	build: {
		chunkSizeWarningLimit: 1500,
		rollupOptions: {
			output: {
				manualChunks(id) {
					// Only split node_modules packages
					if (id.includes('node_modules')) {
						// Separate vendor chunks for better caching
						if (id.includes('svelte')) {
							return 'vendor-svelte';
						}
						if (id.includes('@lucide/svelte')) {
							return 'vendor-lucide';
						}
						// Isolate MapLibre (will be lazy loaded)
						if (id.includes('maplibre-gl')) {
							return 'vendor-maplibre';
						}
					}
				}
			}
		}
	}
});
