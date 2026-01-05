<script lang="ts" generics="T extends ApiRoute">
	import Progress from './Progress.svelte';
	import type { ApiRoute, ApiRequestType } from '$lib/api/schemas';

	let {
		url,
		title = 'Progress',
		params,
		onComplete = undefined
	}: {
		url: T;
		title?: string;
		params: ApiRequestType<T>;
		onComplete?: () => void;
	} = $props();
</script>

<Progress {url} {title} {params} {onComplete} />
