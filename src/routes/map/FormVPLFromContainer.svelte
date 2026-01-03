<script lang="ts">
	import type { VPLParamFromContainer } from '$lib/api/vpl';
	import FileSelector from '$lib/component/FileSelector.svelte';
	import Foldable from '$lib/component/SidebarFoldable.svelte';
	import type { InferOutput } from 'valibot';

	let { params = $bindable() }: { params: InferOutput<typeof VPLParamFromContainer> | undefined } =
		$props();

	let showModal = $state(false);
	let filename: string | undefined = $state();

	// Bindable output pattern: aggregate internal form state into params for parent
	$effect(() => {
		if (filename) {
			params = {
				filename
			};
		} else {
			params = undefined;
		}
	});
</script>

<Foldable title="Add data">
	<label>
		Select Map Data
		<button onclick={() => (showModal = true)}>Open File Selector</button>
		<FileSelector
			bind:showModal
			bind:file={filename}
			fileFilter={(name) => /\.(versa|mb|pm)tiles$/.test(name)}
		/>
	</label>
</Foldable>
