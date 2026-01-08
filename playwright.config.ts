import { defineConfig, devices } from '@playwright/test';

// All available browser projects
const allProjects = [
	{
		name: 'chromium',
		use: { ...devices['Desktop Chrome'] }
	},
	{
		name: 'firefox',
		use: { ...devices['Desktop Firefox'] }
	},
	{
		name: 'webkit',
		use: { ...devices['Desktop Safari'] }
	}
];

// Filter projects if PLAYWRIGHT_PROJECT env var is set (for CI matrix)
const selectedProject = process.env.PLAYWRIGHT_PROJECT;
const projects = selectedProject
	? allProjects.filter((p) => p.name === selectedProject)
	: allProjects;

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure'
	},
	projects,
	webServer: {
		command: 'npm run build && DATA_PATH=temp npm run preview',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI,
		timeout: 120000
	}
});
