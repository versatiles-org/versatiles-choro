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
 * Format a timestamp to a relative or short date string.
 * @param timestamp - Unix timestamp in milliseconds
 * @returns A formatted date string
 */
export function formatDate(timestamp: number): string {
	const date = new Date(timestamp);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	// Today: show time
	if (diffDays === 0) {
		return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
	}

	// Yesterday
	if (diffDays === 1) {
		return 'Yesterday';
	}

	// Within last 7 days: show day name
	if (diffDays < 7) {
		return date.toLocaleDateString(undefined, { weekday: 'short' });
	}

	// Within same year: show month and day
	if (date.getFullYear() === now.getFullYear()) {
		return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}

	// Different year: show full date
	return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
