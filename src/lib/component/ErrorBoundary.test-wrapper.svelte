<script lang="ts">
	import ErrorBoundary from './ErrorBoundary.svelte';

	let {
		content = undefined,
		useFallback = false
	}: { content?: string | undefined; useFallback?: boolean } = $props();
</script>

<ErrorBoundary>
	{#snippet fallback(error)}
		{#if useFallback}
			Custom error: {error.message}
		{/if}
	{/snippet}

	{#if content !== undefined}
		{content}
	{/if}
</ErrorBoundary>
