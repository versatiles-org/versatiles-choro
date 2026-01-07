import { defineConfig } from 'eslint/config';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import globals from 'globals';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import svelteConfig from './svelte.config.js';
import ts from 'typescript-eslint';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

// Shared configurations
const commonGlobals = { ...globals.browser, ...globals.node };

const commonRules = {
	'@typescript-eslint/no-unused-vars': [
		'off',
		{
			argsIgnorePattern: '^_',
			varsIgnorePattern: '^_'
		}
	],
	'no-return-await': 'error'
};

const typeAwareRules = {
	'@typescript-eslint/no-deprecated': 'error',
	'@typescript-eslint/await-thenable': 'error'
};

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	prettier,
	{
		ignores: [
			'.svelte-kit/**',
			'build/**',
			'build-lib/**',
			'rollup.config.*.ts',
			'src/lib/choro/bundle-entry.ts'
		]
	},
	...svelte.configs.recommended,
	...svelte.configs.prettier,
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			globals: commonGlobals,
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		},
		rules: {
			...commonRules,
			...typeAwareRules
		}
	},
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			globals: commonGlobals,
			parserOptions: {
				projectService: true
			}
		},
		rules: {
			...commonRules,
			...typeAwareRules
		}
	},
	{
		files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
		languageOptions: {
			globals: commonGlobals
		},
		rules: commonRules
	}
);
