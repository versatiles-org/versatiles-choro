/**
 * Tooltip template interpolation utility.
 * Replaces {propertyName} placeholders with actual feature property values.
 */

/**
 * Interpolates a template string with feature properties.
 *
 * @param template - HTML template string with {propertyName} placeholders
 * @param properties - Feature properties object
 * @returns Interpolated HTML string with placeholders replaced by property values
 *
 * @example
 * interpolateTemplate('<b>{name}</b><br>Population: {population}', { name: 'Berlin', population: 3645000 })
 * // Returns: '<b>Berlin</b><br>Population: 3645000'
 */
export function interpolateTemplate(template: string, properties: Record<string, unknown>): string {
	return template.replace(/\{([^}]+)\}/g, (match, key) => {
		const value = properties[key];
		if (value === undefined || value === null) {
			return '';
		}
		return String(value);
	});
}
