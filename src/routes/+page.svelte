<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';

	const features: {
		title: string;
		description: string;
		icon: string;
		href: '/download_test_data' | '/convert_polygons' | '/map';
		color: string;
	}[] = [
		{
			title: 'Download Test Data',
			description: 'Download sample datasets to get started with choropleth mapping',
			icon: '📥',
			href: '/download_test_data',
			color: 'hsl(200, 70%, 50%)'
		},
		{
			title: 'Convert Polygons',
			description: 'Transform polygon data into optimized vector tiles for efficient rendering',
			icon: '🔄',
			href: '/convert_polygons',
			color: 'hsl(280, 60%, 55%)'
		},
		{
			title: 'Preview & Style Maps',
			description: 'Visualize and customize your choropleth maps with interactive styling',
			icon: '🗺️',
			href: '/map',
			color: 'hsl(140, 60%, 45%)'
		}
	];
</script>

<div class="container">
	<header class="hero">
		<h1>VersaTiles Choro</h1>
		<p class="tagline">Create beautiful choropleth maps from polygon data</p>
	</header>

	<div class="features">
		{#each features as feature (feature.href)}
			<a
				href={resolve(feature.href)}
				class="card"
				style="--card-color: {feature.color}"
				data-sveltekit-reload
			>
				<div class="icon">{feature.icon}</div>
				<h2>{feature.title}</h2>
				<p>{feature.description}</p>
			</a>
		{/each}
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.hero {
		text-align: center;
		margin-bottom: 4rem;
		padding: 3rem 1rem;
	}

	.hero h1 {
		font-size: 3rem;
		margin: 0 0 1rem 0;
		background: linear-gradient(135deg, hsl(200, 70%, 50%), hsl(280, 60%, 55%));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.tagline {
		font-size: 1.25rem;
		color: hsl(220, 20%, 40%);
		margin: 0;
	}

	.features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: 2rem;
		background: white;
		border: 2px solid hsl(220, 20%, 90%);
		border-radius: 12px;
		text-decoration: none;
		color: inherit;
		transition: all 0.3s ease;
		overflow: hidden;
	}

	.card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: var(--card-color);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.3s ease;
	}

	.card:hover {
		transform: translateY(-4px);
		border-color: var(--card-color);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
	}

	.card:hover::before {
		transform: scaleX(1);
	}

	.icon {
		text-align: center;
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.card h2 {
		text-align: center;
		margin: 0 0 0.75rem 0;
		font-size: 1.2rem;
		color: hsl(220, 20%, 20%);
	}

	.card p {
		margin: 0;
		color: hsl(220, 20%, 40%);
		line-height: 1.6;
		flex-grow: 1;
	}

	@media (max-width: 768px) {
		.hero h1 {
			font-size: 2rem;
		}

		.tagline {
			font-size: 1rem;
		}

		.features {
			grid-template-columns: 1fr;
		}
	}
</style>
