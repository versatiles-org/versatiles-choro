import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
	plugins: [
		sveltekit({
			preprocess: vitePreprocess(),
			adapter: adapter(),
			compilerOptions: {
				experimental: {
					async: true
				}
			},
			experimental: { remoteFunctions: true }
		}),
		visualizer({
			filename: 'stats.html',
			open: false,
			gzipSize: true,
			brotliSize: true
		})
	],
	test: {
		silent: true,
		globals: true,
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/**/*.ts', 'src/**/*.svelte'],
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
		chunkSizeWarningLimit: 1500
	},
	environments: {
		// Vendor chunks only make sense for the browser; the server build is bundled by the adapter
		client: {
			build: {
				rolldownOptions: {
					output: {
						// Separate vendor chunks for better caching (merged with SvelteKit's own groups)
						codeSplitting: {
							groups: [
								{ name: 'vendor-lucide', test: /node_modules.*@lucide[\\/]svelte/, priority: 2 },
								// Isolate MapLibre (will be lazy loaded)
								{ name: 'vendor-maplibre', test: /node_modules.*maplibre-gl/, priority: 2 },
								{ name: 'vendor-svelte', test: /node_modules[\\/]svelte[\\/]/, priority: 1 }
							]
						}
					}
				}
			}
		}
	}
});
