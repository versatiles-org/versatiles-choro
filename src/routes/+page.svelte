<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<h1>Welcome to SvelteKit</h1>
<p><a href={resolve('/download_test_data')}>Download test data</a></p>
<p><a href={resolve('/convert_polygons')}>Convert Polygons</a></p>
<p><a href={resolve('/map')}>Preview/Style Map</a></p>
