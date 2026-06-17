import { expect, test } from "bun:test";
import { uploadImage } from "../utils";
import { join } from "node:path";
import isAnimated from "is-animated";


let setSettings: typeof import("../../../src/bun/shared/settings").setSettings;
let convertImageURL: typeof import("../../../src/bun/shared/funcs").convertImageURL;

test('images route: apng to png', async () => {
	({ setSettings } = await import("../../../src/bun/shared/settings"));
	({ convertImageURL } = await import("../../../src/bun/shared/funcs"));

	await setSettings({
		outputFormat: 'png'
	})

	const inputPath = join(__dirname, '../../fixtures/animated.png');

	const resJson = await uploadImage(inputPath);

	expect(resJson.ok).toBe(true);
	expect(resJson.data.severity).toBe('SUCCESS');

	const outputUrl = resJson.data.images?.[0]?.output;
	expect(outputUrl).toBeTruthy();

	const cleanOutputUrl = outputUrl.split("?")[0];

	const outputFilePath = convertImageURL({
		type: 'localtoabsolute',
		url: cleanOutputUrl
	})

	expect(isAnimated(Buffer.from(await Bun.file(outputFilePath).arrayBuffer()))).toBe(true);

});