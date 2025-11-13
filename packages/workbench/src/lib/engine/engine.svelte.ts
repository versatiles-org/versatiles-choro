import { getNewTileSourceId } from './engine.remote';

export async function getTileUrl(input: string): Promise<string> {
	const id = await getNewTileSourceId(input);
	return `/tiles/${id}/`;
}
