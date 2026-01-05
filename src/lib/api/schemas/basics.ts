import * as v from 'valibot';

export const TileSourceId = v.pipe(
	v.string(),
	v.regex(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
	v.title('TileSourceId'),
	v.description('A unique UUID identifier for a tile source')
);

export const Path = v.pipe(
	v.string(),
	v.regex(/^[^\s]+$/),
	v.title('Path'),
	v.description('A valid path, like "/abc/def.ghi"')
);

export const ProgressStatus = v.union([
	v.object({ event: v.literal('progress'), progress: v.number() }),
	v.object({ event: v.literal('message'), message: v.string() }),
	v.object({ event: v.literal('done') }),
	v.object({ event: v.literal('error'), error: v.string() })
]);
