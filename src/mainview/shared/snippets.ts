/**
 * Make bytes human readable
 * @param bytes 
 * @returns string
 */
export function formatBytes(bytes: number) {
	if (bytes === 0) return "0 B";

	const units = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(1000));
	const value = bytes / 1000 ** i;

	return `${value.toFixed(2)} ${units[i]}`;
}