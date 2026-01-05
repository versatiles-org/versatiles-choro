<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		fallback?: Snippet<[Error]>;
		children?: Snippet;
	}

	let { fallback, children }: Props = $props();

	let error = $state<Error | null>(null);
	let errorInfo = $state<string>('');

	onMount(() => {
		// Global error handler for uncaught errors
		const handleError = (event: ErrorEvent) => {
			event.preventDefault();
			error = event.error;
			errorInfo = event.error?.stack || '';
			console.error('Caught by ErrorBoundary:', event.error);
		};

		// Global handler for unhandled promise rejections
		const handleRejection = (event: PromiseRejectionEvent) => {
			event.preventDefault();
			error = new Error(String(event.reason));
			errorInfo = event.reason?.stack || '';
			console.error('Unhandled promise rejection:', event.reason);
		};

		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleRejection);

		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleRejection);
		};
	});

	function reset() {
		error = null;
		errorInfo = '';
	}
</script>

{#if error}
	{#if fallback}
		{@render fallback(error)}
	{:else}
		<div class="error-boundary">
			<div class="alert-error error-container">
				<h2>Something went wrong</h2>
				<p class="error-message">{error.message}</p>
				{#if import.meta.env.DEV && errorInfo}
					<details>
						<summary>Error details</summary>
						<pre class="error-stack">{errorInfo}</pre>
					</details>
				{/if}
				<button class="button button-danger" onclick={reset}>Try again</button>
			</div>
		</div>
	{/if}
{:else if children}
	{@render children()}
{/if}

<style>
	.error-boundary {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		padding: 2rem;
	}

	.error-container {
		max-width: 600px;
	}

	.error-message {
		margin: 0 0 1rem 0;
		color: var(--color-danger-700);
		font-weight: 500;
	}

	details {
		margin: 1rem 0;
	}

	summary {
		cursor: pointer;
		color: var(--color-danger-700);
		font-weight: 500;
	}

	.error-stack {
		margin: 0.5rem 0 0 0;
		padding: 1rem;
		background: var(--color-bg-primary);
		border: 1px solid var(--color-danger-600);
		border-radius: var(--radius-sm);
		overflow-x: auto;
		font-size: 0.875rem;
		color: var(--color-danger-700);
	}
</style>
