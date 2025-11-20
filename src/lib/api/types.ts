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
	input: Path,
	filter: v.optional(
		v.object({
			minZoom: v.optional(v.number()),
			maxZoom: v.optional(v.number()),
			bounds: v.optional(v.tuple([v.number(), v.number(), v.number(), v.number()]))
		})
	),
	meta_update: v.optional(
		v.object({
			attribution: v.optional(v.string()),
			name: v.optional(v.string()),
			description: v.optional(v.string())
		})
	),
	filter_layers: v.optional(
		v.object({
			layer_names: v.array(v.string()),
			invert: v.optional(v.boolean())
		})
	),
	filter_properties: v.optional(
		v.object({
			regex: v.string(),
			invert: v.optional(v.boolean())
		})
	),
	update_properties: v.optional(
		v.object({
			data_source_path: v.string(),
			layer_name: v.string(),
			id_field_tiles: v.string(),
			id_field_data: v.string(),
			replace_properties: v.optional(v.boolean()),
			remove_non_matching: v.optional(v.boolean()),
			include_id: v.optional(v.boolean())
		})
	)
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
