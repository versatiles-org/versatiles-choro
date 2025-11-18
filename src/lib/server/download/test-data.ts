import { SimpleProgress } from '../progress/simple';
import https from 'https';
import { createWriteStream, existsSync, unlinkSync } from 'fs';
import path from 'path';
import zlib from 'zlib';
import { rename } from 'fs/promises';
import type { Writable } from 'stream';


export function downloadTestData(outputDir: string) {
	const urlVerwaltungsgebiete = 'https://raw.githubusercontent.com/MichaelKreil/verwaltungsgebiete/refs/heads/main/data/2025-01-01/';
	const files: { url: string, name: string }[] = [
		{ url: urlVerwaltungsgebiete + '1_bundeslaender.geojson.br', name: '1_bundeslaender.geojson' },
		{ url: urlVerwaltungsgebiete + '2_regierungsbezirke.geojson.br', name: '2_regierungsbezirke.geojson' },
		{ url: urlVerwaltungsgebiete + '3_kreise.geojson.br', name: '3_kreise.geojson' },
		{ url: urlVerwaltungsgebiete + '4_verwaltungsgemeinschaften.geojson.br', name: '4_verwaltungsgemeinschaften.geojson' },
		{ url: urlVerwaltungsgebiete + '5_gemeinden.geojson.br', name: '5_gemeinden.geojson' },
	];

	return new SimpleProgress('downloading test data', files.flatMap(file => {
		const outputPath = path.join(outputDir, file.name);
		if (existsSync(outputPath)) return [];
		return [async () => {
			const tempFilePath = outputPath + '.part';
			let fileStream: Writable = createWriteStream(tempFilePath);

			if (file.url.endsWith('.br')) {
				const unzip = zlib.createBrotliDecompress();
				unzip.pipe(fileStream);
				fileStream = unzip;
			}

			await new Promise<void>((resolve, reject) => {
				https.get(file.url, (response: any) => {
					if (response.statusCode !== 200) {
						console.error(`Failed to download ${file.url}: ${response.statusCode}`);
						return reject(new Error(`Failed to download ${file.url}: ${response.statusCode}`));
					}
					response.pipe(fileStream);
					fileStream.on('finish', async () => {
						await rename(tempFilePath, outputPath);
						resolve();
					});
				}).on('error', (err: any) => {
					console.error(`Error downloading ${file.url}: ${err.message}`);
					unlinkSync(outputPath);
					reject(err);
				})
			});
		}]
	}))
}