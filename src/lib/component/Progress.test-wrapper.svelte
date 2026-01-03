<script lang="ts">
	import Progress from './Progress.svelte';

	let {
		url,
		title = 'Progress',
		params = {},
		onComplete = undefined
	}: {
		url: string;
		title?: string;
		params?: Record<string, unknown>;
		onComplete?: () => void;
	} = $props();
</script>

<Progress {url} {title} {params} {onComplete} />
