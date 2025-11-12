import { getNewTileSourceId } from './engine.remote';

export async function getTileUrl(fullPath: string): Promise<string> {
	const id = await getNewTileSourceId(fullPath);
	return `/tiles/${id}/`;
}
