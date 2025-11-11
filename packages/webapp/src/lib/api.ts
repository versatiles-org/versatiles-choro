// webapp/src/lib/api.ts
// Centralized API client for the WebUI (browser-side).
// All calls return typed data or throw a descriptive Error.

export type TileSource = {
	id: string;
	name: string;
	size: number;
};

export type ApiError = Error & { status?: number; details?: unknown };

const API_BASE = '/api';
const DEFAULT_TIMEOUT_MS = 5_000;

function withTimeout<T>(p: Promise<T>, ms = DEFAULT_TIMEOUT_MS): Promise<T> {
	const ctrl = new AbortController();
	const t = setTimeout(() => ctrl.abort(), ms);
	return new Promise<T>((resolve, reject) => {
		p.then((v) => {
			clearTimeout(t);
			resolve(v);
		}).catch((e) => {
			clearTimeout(t);
			reject(e);
		});
	});
}

async function requestJSON<T>(
	path: string,
	init: RequestInit = {},
	timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
	const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
	const res = await withTimeout(
		fetch(url, {
			...init,
			headers: {
				'accept': 'application/json',
				...(init.headers || {}),
			},
		}),
		timeoutMs
	);

	if (!res.ok) {
		let details: unknown;
		try {
			details = await res.clone().json();
		} catch {
			details = await res.text().catch(() => undefined);
		}
		const err: ApiError = new Error(
			`Request failed: ${res.status} ${res.statusText} (${url})`
		) as ApiError;
		err.status = res.status;
		err.details = details;
		throw err;
	}

	return res.json() as Promise<T>;
}

/**
 * Lists available tile sources the backend knows about.
 * Accepts both array responses and { items: [...] } envelopes.
 */
export async function listTileSources(): Promise<TileSource[]> {
	const raw = await requestJSON<unknown>('/list_tile_sources');
	const items = Array.isArray(raw) ? raw : (raw as any)?.items ?? [];
	return (items as any[]).map((d) => ({
		id: String(d?.id ?? d?.name ?? d?.path ?? d?.file ?? d?.url ?? '').trim(),
		name: d?.name ?? d?.label ?? d?.id ?? d?.file ?? d?.path ?? d?.url ?? 'Unknown',
		url: d?.url,
		type: d?.type,
	}));
}
