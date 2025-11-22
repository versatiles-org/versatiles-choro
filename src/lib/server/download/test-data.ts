import https from 'https';
import { createWriteStream, existsSync } from 'fs';
import path, { basename } from 'path';
import zlib from 'zlib';
import { rename } from 'fs/promises';
import type { Writable } from 'stream';
import { SimpleProgress, type Progress } from '../progress/index';

export function downloadTestData(outputDir: string): Progress {
	const urlUser = 'https://raw.githubusercontent.com/MichaelKreil/';
	const urlRegions = `${urlUser}verwaltungsgebiete/refs/heads/main/data/2025-01-01/`;
	const urlTestdata = `${urlUser}testdata/refs/heads/main/`;
	const files: string[] = [
		urlRegions + '1_bundeslaender.geojson.br',
		urlRegions + '2_regierungsbezirke.geojson.br',
		urlRegions + '3_kreise.geojson.br',
		urlRegions + '4_verwaltungsgemeinschaften.geojson.br',
		urlRegions + '5_gemeinden.geojson.br',
		urlTestdata + '73111-01-01-5-Einkommen.tsv.br'
	];

	const downloadTasks = files.flatMap((url) => {
		const filename = url
			.split('/')
			.pop()!
			.replace(/\.(br)$/, '');
		const outputPath = path.join(outputDir, filename);
		if (existsSync(outputPath)) return [];
		return [
			{
				message: `Downloading ${basename(filename)}...`,
				callback: async () => {
					const tempFilePath = outputPath + '.part';
					let fileStream: Writable = createWriteStream(tempFilePath);

					if (url.endsWith('.br')) {
						const unzip = zlib.createBrotliDecompress();
						unzip.pipe(fileStream);
						fileStream = unzip;
					}

					await downloadFile(url, fileStream);
					await rename(tempFilePath, outputPath);
				}
			}
		];
	});

	return new SimpleProgress(downloadTasks);
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
