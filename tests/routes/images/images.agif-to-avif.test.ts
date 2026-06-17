import { expect, test } from "bun:test";
import { uploadImage, isAnimatedAvif } from "../utils";
import { join } from "node:path";

let setSettings: typeof import("../../../src/bun/shared/settings").setSettings;
let convertImageURL: typeof import("../../../src/bun/shared/funcs").convertImageURL;

test('images route: animated gif to avif', async () => {
	({ setSettings } = await import("../../../src/bun/shared/settings"));
	({ convertImageURL } = await import("../../../src/bun/shared/funcs"));

	await setSettings({
		outputFormat: 'avif'
	})

	const resJson = await uploadImage(join(__dirname, '../../fixtures/animated.gif'));

	expect(resJson.ok).toBe(true);
	expect(resJson.data.severity).toBe('SUCCESS');


	const outputUrl = resJson.data.images?.[0]?.output;
	expect(outputUrl).toBeTruthy();

	const outputFilePath = convertImageURL({
		type: 'localtoabsolute',
		url: outputUrl,
	});

	const outputBuffer = Buffer.from(await Bun.file(outputFilePath).arrayBuffer());
	expect(isAnimatedAvif(outputBuffer)).toBe(true);
});
