<script lang="ts">
	import IconInfo from '@lucide/svelte/icons/info';

	const { text }: { text: string } = $props();
</script>

<span class="hint" title={text}>
	<IconInfo size={14} />
</span>

<style>
	.hint {
		display: inline-flex;
		align-items: center;
		vertical-align: middle;
		margin-left: 0.25rem;
		opacity: 0.2;
	}
	.hint:hover {
		opacity: 1;
	}
</style>
