import { Path, TileSourceId } from './basics';
import { VPLParam } from './vpl';
import * as v from 'valibot';

export const ConvertPolygonsRequest = v.object({
	input: Path,
	output: Path
});

export const TilesInitRequest = v.object({
	old_id: v.optional(TileSourceId),
	vpl: VPLParam
});

export const TilesInitResponse = v.object({
	id: TileSourceId
});

export const TilesLoadRequest = v.object({
	id: TileSourceId,
	path: Path
});
