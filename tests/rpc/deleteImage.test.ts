import { expect, test } from "bun:test";
import {join} from "node:path";
import { cp } from "node:fs/promises";
import { mkdirSync } from "node:fs";

let updateImage: typeof import("../../src/bun/rpc/updateImage").default;
let deleteImage: typeof import("../../src/bun/rpc/deleteImage").default;
let getImageDirectories: typeof import("../../src/bun/shared/directories").getImageDirectories;

test('deleteImage', async () => {
	({ getImageDirectories } = await import("../../src/bun/shared/directories"));
	({ default: updateImage } = await import("../../src/bun/rpc/updateImage"));
	const { inputDirectory, outputDirectory } = getImageDirectories();
	// add the image to the input dir & create input dir implicitly
	await cp(join(__dirname, '../fixtures/large.jpg'), join(inputDirectory, 'large.jpg'));
	// make the output directory
	mkdirSync(outputDirectory, { recursive: true });

	await updateImage({
		path: 'http://localhost:43117/images/input/large.jpg',
		quality: 10,
		effort: 1
	});

	({ default: deleteImage } = await import("../../src/bun/rpc/deleteImage"));

	const res = await deleteImage({
		path: 'http://localhost:43117/images/input/large.jpg'
	});

	expect(res.severity).toBe('SUCCESS');
	expect(res.message).toBe('Successfully deleted image');
});