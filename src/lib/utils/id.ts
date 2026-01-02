/**
 * Generates a random ID for component use
 * @param prefix - Optional prefix for the ID
 * @returns A random ID string
 */
export function generateId(prefix = 'id'): string {
	// Use crypto.randomUUID if available (Node 14.17+, modern browsers)
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return `${prefix}-${crypto.randomUUID()}`;
	}

	// Fallback for older environments
	const random = crypto.getRandomValues(new Uint32Array(2));
	return `${prefix}-${random[0].toString(36)}-${random[1].toString(36)}`;
}
