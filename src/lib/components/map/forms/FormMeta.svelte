<script lang="ts">
	import type { InferOutput } from 'valibot';
	import type { VPLParamMetaUpdate } from '$lib/api/schemas';
	import type { TileJSONSpecificationVector } from '@versatiles/style';
	import Hint from '$lib/components/Hint.svelte';

	let {
		// eslint-disable-next-line no-useless-assignment
		params = $bindable(),
		tilejson
	}: {
		params: InferOutput<typeof VPLParamMetaUpdate> | undefined;
		tilejson: TileJSONSpecificationVector | undefined;
	} = $props();

	let attribution: string = $state('');

	// Attribution inherited from the source TileJSON, shown as a fallback hint
	let inheritedAttribution: string | undefined = $derived(tilejson?.attribution);

	// Bindable output pattern: aggregate internal form state into params for parent.
	// Empty input => undefined, so the source TileJSON attribution passes through unchanged.
	$effect(() => {
		const trimmed = attribution.trim();
		params = trimmed ? { attribution: trimmed } : undefined;
	});
</script>

<div class="meta-form">
	<label>
		Copyright / Attribution<Hint
			text="Custom attribution shown on the map. Leave empty to use the attribution from the source tiles."
		/>
		<input
			type="text"
			class="input-full"
			bind:value={attribution}
			placeholder={inheritedAttribution || '© OpenStreetMap contributors'}
		/>
	</label>
	{#if !attribution.trim() && inheritedAttribution}
		<span class="hint">Using source attribution: {inheritedAttribution}</span>
	{:else if !attribution.trim()}
		<span class="hint">No attribution set on the source tiles.</span>
	{/if}
</div>

<style>
	.meta-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		display: block;
	}

	.hint {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		font-style: italic;
	}
</style>
