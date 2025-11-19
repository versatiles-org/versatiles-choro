import { SimpleProgress } from '../progress/simple';
import https from 'https';
import { createWriteStream, existsSync } from 'fs';
import path from 'path';
import zlib from 'zlib';
import { rename } from 'fs/promises';
import type { Writable } from 'stream';

export function downloadTestData(outputDir: string) {
	const urlVerwaltungsgebiete =
		'https://raw.githubusercontent.com/MichaelKreil/verwaltungsgebiete/refs/heads/main/data/2025-01-01/';
	const files: { url: string; name: string }[] = [
		{ url: urlVerwaltungsgebiete + '1_bundeslaender.geojson.br', name: '1_bundeslaender.geojson' },
		{
			url: urlVerwaltungsgebiete + '2_regierungsbezirke.geojson.br',
			name: '2_regierungsbezirke.geojson'
		},
		{ url: urlVerwaltungsgebiete + '3_kreise.geojson.br', name: '3_kreise.geojson' },
		{
			url: urlVerwaltungsgebiete + '4_verwaltungsgemeinschaften.geojson.br',
			name: '4_verwaltungsgemeinschaften.geojson'
		},
		{ url: urlVerwaltungsgebiete + '5_gemeinden.geojson.br', name: '5_gemeinden.geojson' }
	];

	const downloadTasks = files.flatMap((file) => {
		const outputPath = path.join(outputDir, file.name);
		if (existsSync(outputPath)) return [];
		return [
			async () => {
				const tempFilePath = outputPath + '.part';
				let fileStream: Writable = createWriteStream(tempFilePath);

				if (file.url.endsWith('.br')) {
					const unzip = zlib.createBrotliDecompress();
					unzip.pipe(fileStream);
					fileStream = unzip;
				}

				await downloadFile(file.url, fileStream);
				await rename(tempFilePath, outputPath);
			}
		];
	});

	return new SimpleProgress('downloading test data', downloadTasks);
}

function downloadFile(url: string, stream: Writable): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		https
			.get(url, (response) => {
				if (response.statusCode !== 200) {
					console.error(`Failed to download ${url}: ${response.statusCode}`);
					return reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
				}
				response.pipe(stream);
				stream.on('finish', async () => {
					resolve();
				});
			})
			.on('error', (err) => {
				console.error(`Error downloading ${url}: ${err.message}`);
				reject(err);
			});
	});
}
