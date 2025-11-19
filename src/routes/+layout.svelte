<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main>
	<nav><a href="/">Home</a></nav>
	{@render children()}
</main>

<style>
	:global(body) {
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		margin: 0;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}
	main {
		position: absolute;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
	}
</style>
