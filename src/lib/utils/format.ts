/**
 * Format a file size in bytes to a human-readable string.
 * @param bytes - The file size in bytes
 * @returns A formatted string like "1.5 KB", "2.3 MB", etc.
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';

	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	const k = 1024;
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	const size = bytes / Math.pow(k, i);

	// Use 0 decimal places for bytes, 1 for others
	const decimals = i === 0 ? 0 : 1;
	return `${size.toFixed(decimals)} ${units[i]}`;
}

/**
 * Format a timestamp to a date string.
 * @param timestamp - Unix timestamp in milliseconds
 * @returns A formatted date string
 */
export function formatDate(timestamp: number): string {
	const date = new Date(timestamp);
	return date.toISOString().replace('T', ' ').replace(/\..+/, '');
}
