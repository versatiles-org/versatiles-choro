/**
 * Safely converts value to number
 */
export function toNumber(value: unknown): number | undefined {
	if (value === undefined || value === null) return undefined;
	const num = Number(value);
	return isNaN(num) ? undefined : num;
}

/**
 * Safely converts value to string
 */
export function toString(value: unknown): string | undefined {
	if (value === undefined || value === null) return undefined;
	return String(value);
}

/**
 * Safely converts value to boolean
 */
export function toBoolean(value: unknown): boolean {
	if (typeof value === 'boolean') return value;
	return value === 'true' || value === '1';
}

/**
 * Maps Record<string, unknown> options to typed options
 */
export function mapOptions<T>(
	source: Record<string, unknown> | undefined,
	mapping: Record<string, (value: unknown) => unknown>
): Partial<T> {
	if (!source) return {};

	const result: Record<string, unknown> = {};
	for (const [key, mapper] of Object.entries(mapping)) {
		const value = source[key];
		if (value !== undefined) {
			result[key] = mapper(value);
		}
	}
	return result as Partial<T>;
}
