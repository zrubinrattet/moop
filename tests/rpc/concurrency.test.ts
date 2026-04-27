import { expect, test } from "bun:test";
import { mkdirSync } from "node:fs";
import path, { join } from "node:path";
import { cp } from "node:fs/promises";

let updateImage: typeof import("../../src/bun/rpc/updateImage").default;
let getImageDirectories: typeof import("../../src/bun/shared/directories").getImageDirectories;
let convertImageURL: typeof import("../../src/bun/shared/funcs").convertImageURL;

test('concurrency', async () => {
	({ default: updateImage } = await import("../../src/bun/rpc/updateImage"));
	({ getImageDirectories } = await import("../../src/bun/shared/directories"));
	({ convertImageURL } = await import("../../src/bun/shared/funcs"));

	const { inputDirectory, outputDirectory } = getImageDirectories();
	// make the output directory
	mkdirSync(outputDirectory, { recursive: true });
	// prime inputs
	const inputs = ['../fixtures/large.jpg', '../fixtures/tall.jpg', '../fixtures/transparent.png']
	for (const relPath of inputs) {
		await cp(join(__dirname, relPath), join(inputDirectory, path.parse(relPath).base));
	};
	const res = await Promise.all(inputs.map(async (relPath) => {
		return await updateImage({
			path: convertImageURL({
				url: join(inputDirectory, path.parse(relPath).base),
				type: 'absolutetolocal'
			}),
			quality: 10,
			effort: 1
		});
	}));

	expect(res).toHaveLength(3);

	for (const item of res) {
		expect(item).toEqual(
			expect.objectContaining({
				severity: "SUCCESS",
				message: "Successfully processed image.",
				image: expect.objectContaining({
					isActive: false,
					effort: 1,
					quality: 10,
					outputFormat: "webp",
				}),
			}),
		);

		expect(item.image.input).toMatch(/^http:\/localhost:43117\/images\/input\/.+\.(jpg|jpeg|png)$/);
		expect(item.image.output).toMatch(/^http:\/localhost:43117\/images\/output\/.+\.webp\?v=\d+$/);
		expect(item.image.inputSizeBytes).toBeGreaterThan(0);
		expect(item.image.outputSizeBytes).toBeGreaterThan(0);
		expect(item.image.inputResolution.width).toBeGreaterThan(0);
		expect(item.image.inputResolution.height).toBeGreaterThan(0);
		expect(item.image.outputResolution.width).toBeGreaterThan(0);
		expect(item.image.outputResolution.height).toBeGreaterThan(0);
	}
})