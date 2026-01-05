import type {
	VPLParam,
	VPLParamFilter,
	VPLParamFilterLayers,
	VPLParamFilterProperties,
	VPLParamFromContainer,
	VPLParamMetaUpdate,
	VPLParamUpdateProperties
} from '$lib/api/schemas';
import { resolve_data } from '$lib/server/filesystem/filesystem';
import * as v from 'valibot';

export function buildVPL(vpl: v.InferOutput<typeof VPLParam>): string {
	const commands: (string | null)[] = [];

	commands.push(buildVPLFrom(vpl.from_container));

	if (vpl.update_properties) commands.push(buildVPLUpdateProperties(vpl.update_properties));

	if (vpl.filter_layers) commands.push(buildVPLFilterLayers(vpl.filter_layers));

	if (vpl.filter_properties) commands.push(buildVPLFilterProperties(vpl.filter_properties));

	if (vpl.filter) commands.push(buildVPLFilter(vpl.filter));

	if (vpl.meta_update) commands.push(buildVPLMetaUpdate(vpl.meta_update));

	return commands.filter(Boolean).join('\n   | ');
}

export function buildVPLFrom(p: v.InferOutput<typeof VPLParamFromContainer>): string {
	return `from_container filename="${resolve_data(p.filename)}"`;
}

export function buildVPLUpdateProperties(
	p: v.InferOutput<typeof VPLParamUpdateProperties>
): string | null {
	const parts = [
		'vector_update_properties',
		`data_source_path="${p.data_source_path}"`,
		`layer_name="${p.layer_name}"`,
		`id_field_tiles="${p.id_field_tiles}"`,
		`id_field_data="${p.id_field_data}"`,
		p.replace_properties ? `replace_properties="${p.replace_properties}"` : null,
		p.remove_non_matching ? `remove_non_matching="${p.remove_non_matching}"` : null,
		p.include_id ? `include_id="${p.include_id}"` : null
	].filter(Boolean);
	return parts.join(' ');
}

export function buildVPLFilterLayers(p: v.InferOutput<typeof VPLParamFilterLayers>): string | null {
	const parts = [
		'vector_filter_layers',
		`filter="${p.layer_names.map((name) => name.trim()).join(',')}"`,
		p.invert ? `invert="${p.invert}"` : null
	].filter(Boolean);
	return parts.join(' ');
}

export function buildVPLFilterProperties(
	p: v.InferOutput<typeof VPLParamFilterProperties>
): string | null {
	const parts = [
		'vector_filter_properties',
		`regex="${p.regex}"`,
		p.invert ? `invert="${p.invert}"` : null
	].filter(Boolean);
	return parts.join(' ');
}

export function buildVPLFilter(p: v.InferOutput<typeof VPLParamFilter>): string | null {
	const parts = [];
	if (p.minZoom !== undefined) parts.push(`min_zoom="${p.minZoom}"`);
	if (p.maxZoom !== undefined) parts.push(`max_zoom="${p.maxZoom}"`);
	if (p.bounds !== undefined) parts.push(`bounds="${p.bounds.join(',')}"`);
	return ['filter', ...parts].join(' ');
}

export function buildVPLMetaUpdate(p: v.InferOutput<typeof VPLParamMetaUpdate>): string | null {
	const parts = [];
	if (p.attribution !== undefined) parts.push(`attribution="${p.attribution}"`);
	if (p.name !== undefined) parts.push(`name="${p.name}"`);
	if (p.description !== undefined) parts.push(`description="${p.description}"`);
	if (parts.length === 0) return null;
	return ['meta_update', ...parts].join(' ');
}
