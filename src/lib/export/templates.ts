/**
 * Embedded templates for export feature.
 * These are embedded as strings to ensure they're available at runtime.
 */

export const INDEX_HTML_TEMPLATE = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Choropleth Map</title>
		<link
			href="https://tiles.versatiles.org/assets/lib/maplibre-gl/maplibre-gl.css"
			rel="stylesheet"
		/>
		<script src="https://tiles.versatiles.org/assets/lib/maplibre-gl/maplibre-gl.js"></script>
		<script src="choro-lib.js"></script>
		<style>
			* {
				margin: 0;
				padding: 0;
				box-sizing: border-box;
			}
			html,
			body {
				width: 100%;
				height: 100%;
			}
			#map {
				width: 100%;
				height: 100%;
			}
		</style>
	</head>
	<body>
		<div id="map"></div>
		<script>
			// Configuration: Set your VersaTiles tile server URL here
			const VERSATILES_URL = 'http://localhost:8080';

			choroLib
				.initMap('map', 'config.json', VERSATILES_URL)
				.then((map) => {
					console.log('Map initialized successfully');
				})
				.catch((error) => {
					console.error('Failed to initialize map:', error);
					document.getElementById('map').innerHTML =
						'<div style="padding: 20px; color: red;">Error loading map: ' +
						error.message +
						'</div>';
				});
		</script>
	</body>
</html>`;
