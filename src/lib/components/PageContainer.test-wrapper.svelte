<script lang="ts">
	import PageContainer from './PageContainer.svelte';

	let { title = 'Test Title', content = 'Test Content' }: { title?: string; content?: string } =
		$props();
</script>

<PageContainer {title}>
	{content}
</PageContainer>
