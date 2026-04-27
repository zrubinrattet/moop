import { expect, test } from "bun:test";
import {join} from "node:path";
import { mkdirSync } from "node:fs";
import { cp } from "node:fs/promises";

let updateImage: typeof import("../../src/bun/rpc/updateImage").default;
let getImageDirectories: typeof import("../../src/bun/shared/directories").getImageDirectories;

test('updateImage', async () => {
	({ default: updateImage } = await import("../../src/bun/rpc/updateImage"));
	({ getImageDirectories } = await import("../../src/bun/shared/directories"));
	const { inputDirectory, outputDirectory } = getImageDirectories();
	// add the image to the input dir & create input dir implicitly
	await cp(join(__dirname, '../fixtures/large.jpg'), join(inputDirectory, 'large.jpg'));
	// make the output directory
	mkdirSync(outputDirectory, { recursive: true });

	const res = await updateImage({
		path: 'http://localhost:43117/images/input/large.jpg',
		quality: 10,
		effort: 1
	});

	expect(res.severity).toBe('SUCCESS');
	expect(res.message).toBe('Successfully processed image.');
})