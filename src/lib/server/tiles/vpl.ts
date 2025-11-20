import type { TilesInitRequest } from '$lib/api/types';
import * as v from 'valibot';

export function buildVPL(params: v.InferOutput<typeof TilesInitRequest>): string {
	const vpl: (string | null)[] = [`from_container filename="${params.input}"`];

	vpl.push(buildVPLUpdateProperties(params.update_properties));
	vpl.push(buildVPLFilterLayers(params.filter_layers));
	vpl.push(buildVPLFilterProperties(params.filter_properties));
	vpl.push(buildVPLFilter(params.filter));
	vpl.push(buildVPLMetaUpdate(params.meta_update));

	return vpl.filter(Boolean).join('\n   | ');
}

export function buildVPLUpdateProperties(
	p: v.InferOutput<typeof TilesInitRequest>['update_properties']
): string | null {
	if (!p) return null;
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

export function buildVPLFilterLayers(
	p: v.InferOutput<typeof TilesInitRequest>['filter_layers']
): string | null {
	if (!p) return null;
	const parts = [
		'vector_filter_layers',
		`filter="${p.layer_names.map((name) => name.trim()).join(',')}"`,
		p.invert ? `invert="${p.invert}"` : null
	].filter(Boolean);
	return parts.join(' ');
}

export function buildVPLFilterProperties(
	p: v.InferOutput<typeof TilesInitRequest>['filter_properties']
): string | null {
	if (!p) return null;
	const parts = [
		'vector_filter_properties',
		`regex="${p.regex}"`,
		p.invert ? `invert="${p.invert}"` : null
	].filter(Boolean);
	return parts.join(' ');
}

export function buildVPLFilter(p: v.InferOutput<typeof TilesInitRequest>['filter']): string | null {
	if (!p) return null;
	const parts = [];
	if (p.minZoom !== undefined) parts.push(`min_zoom="${p.minZoom}"`);
	if (p.maxZoom !== undefined) parts.push(`max_zoom="${p.maxZoom}"`);
	if (p.bounds !== undefined) parts.push(`bounds="${p.bounds.join(',')}"`);
	return ['filter', ...parts].join(' ');
}

export function buildVPLMetaUpdate(
	p: v.InferOutput<typeof TilesInitRequest>['meta_update']
): string | null {
	if (!p) return null;
	const parts = [];
	if (p.attribution !== undefined) parts.push(`attribution="${p.attribution}"`);
	if (p.name !== undefined) parts.push(`name="${p.name}"`);
	if (p.description !== undefined) parts.push(`description="${p.description}"`);
	if (parts.length === 0) return null;
	return ['meta_update', ...parts].join(' ');
}
