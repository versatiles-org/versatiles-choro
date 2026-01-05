import * as v from 'valibot';
import { Path } from './basics';

export const VPLParamFromContainer = v.object({
	filename: Path
});

export const VPLParamFilter = v.object({
	minZoom: v.optional(v.number()),
	maxZoom: v.optional(v.number()),
	bounds: v.optional(v.tuple([v.number(), v.number(), v.number(), v.number()]))
});

export const VPLParamMetaUpdate = v.object({
	attribution: v.optional(v.string()),
	name: v.optional(v.string()),
	description: v.optional(v.string())
});

export const VPLParamFilterLayers = v.object({
	layer_names: v.array(v.string()),
	invert: v.optional(v.boolean())
});

export const VPLParamFilterProperties = v.object({
	regex: v.string(),
	invert: v.optional(v.boolean())
});

export const VPLParamUpdateProperties = v.object({
	data_source_path: Path,
	layer_name: v.string(),
	id_field_tiles: v.string(),
	id_field_data: v.string(),
	replace_properties: v.optional(v.boolean()),
	remove_non_matching: v.optional(v.boolean()),
	include_id: v.optional(v.boolean())
});

export const VPLParam = v.object({
	from_container: VPLParamFromContainer,
	filter: v.optional(VPLParamFilter),
	meta_update: v.optional(VPLParamMetaUpdate),
	filter_layers: v.optional(VPLParamFilterLayers),
	filter_properties: v.optional(VPLParamFilterProperties),
	update_properties: v.optional(VPLParamUpdateProperties)
});
