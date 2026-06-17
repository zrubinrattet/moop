import path from "node:path";
export async function uploadImage(filePath: string) {
	const formData = new FormData();
	const file = Bun.file(filePath);
	formData.append("image", file, path.parse(filePath).base);
	const res = await fetch("http://localhost:43117/images", {
		method: "POST",
		body: formData,
	});
	const resJson = await res.json();
	return resJson;
}

export function isAnimatedAvif(buffer: Buffer) {
	// 1. Fast Check: If the major brand is "avis", it is definitely animated
	const majorBrand = buffer.toString('ascii', 8, 12);
	if (majorBrand === 'avis') return true;

	// 2. Deep Check: Scan for the Sample Size (stsz) box to count frames
	// Look for the "stsz" magic bytes: 0x73, 0x74, 0x73, 0x7A
	const stszMarker = Buffer.from([0x73, 0x74, 0x73, 0x7A]);
	const stszOffset = buffer.indexOf(stszMarker);

	if (stszOffset !== -1) {
		// The 32-bit integer stating the total frame count is located
		// exactly 12 bytes after the start of the 'stsz' string
		const frameCount = buffer.readUInt32BE(stszOffset + 12);
		return frameCount > 1;
	}

	return false;
}
