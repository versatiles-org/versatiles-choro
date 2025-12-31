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
			<div class="error-container">
				<h2>Something went wrong</h2>
				<p class="error-message">{error.message}</p>
				{#if import.meta.env.DEV && errorInfo}
					<details>
						<summary>Error details</summary>
						<pre class="error-stack">{errorInfo}</pre>
					</details>
				{/if}
				<button onclick={reset}>Try again</button>
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
		padding: 2rem;
		background: #fee;
		border: 2px solid #c33;
		border-radius: 8px;
	}

	h2 {
		margin: 0 0 1rem 0;
		color: #c33;
	}

	.error-message {
		margin: 0 0 1rem 0;
		color: #600;
		font-weight: 500;
	}

	details {
		margin: 1rem 0;
	}

	summary {
		cursor: pointer;
		color: #600;
		font-weight: 500;
	}

	.error-stack {
		margin: 0.5rem 0 0 0;
		padding: 1rem;
		background: #fff;
		border: 1px solid #c33;
		border-radius: 4px;
		overflow-x: auto;
		font-size: 0.875rem;
		color: #600;
	}

	button {
		padding: 0.5rem 1rem;
		background: #c33;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
	}

	button:hover {
		background: #a22;
	}
</style>
