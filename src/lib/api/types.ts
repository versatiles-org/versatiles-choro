import * as v from 'valibot';

const TileSourceId = v.pipe(
	v.string(),
	v.regex(/^\d+$/),
	v.title('TileSourceId'),
	v.description('A unique numeric identifier for a tile source')
);

const Path = v.pipe(
	v.string(),
	v.regex(/^[^\s]+$/),
	v.title('Path'),
	v.description('A valid path, like "/abc/def.ghi"')
);

export const ConvertPolygonsRequest = v.object({
	input: Path,
	output: Path
});

export const TilesInitRequest = v.object({
	input: Path
});

export const TilesInitResponse = v.object({
	id: TileSourceId
});

export const TilesLoadRequest = v.object({
	id: TileSourceId,
	path: Path
});

export const ProgressStatus = v.union([
	v.object({ event: v.literal('progress'), progress: v.number() }),
	v.object({ event: v.literal('message'), message: v.string() }),
	v.object({ event: v.literal('done') }),
	v.object({ event: v.literal('error'), error: v.string() })
]);
