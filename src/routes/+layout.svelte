<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { resolve } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-container">
	<nav><a href={resolve('/')}>Home</a></nav>
	<main>
		{@render children()}
	</main>
</div>

<style>
	:global(body) {
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		margin: 0;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}
	.app-container {
		position: absolute;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
	}
	nav {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2.5rem;
		display: flex;
		align-items: center;
		padding: 0 1rem;
		box-sizing: border-box;
	}
	main {
		position: absolute;
		top: 2.5rem;
		bottom: 0;
		left: 0;
		right: 0;
	}
</style>
