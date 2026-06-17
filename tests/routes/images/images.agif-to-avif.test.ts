import { expect, test } from "bun:test";
import { uploadImage, isAnimatedAvif } from "../utils";
import { join } from "node:path";

let setSettings: typeof import("../../../src/bun/shared/settings").setSettings;

test('images route: animated gif to avif', async () => {

	({ setSettings } = await import("../../../src/bun/shared/settings"));

	await setSettings({
		outputFormat: 'avif'
	})

	const resJson = await uploadImage(join(__dirname, '../../fixtures/animated.gif'));

	expect(resJson.ok).toBe(true);
	expect(resJson.data.severity).toBe('SUCCESS');


	const outputUrl = resJson.data.images?.[0]?.output;
	expect(outputUrl).toBeTruthy();

	const cleanOutputUrl = outputUrl.split("?")[0];
	const outputRes = await fetch(cleanOutputUrl);
	expect(outputRes.ok).toBe(true);

	const outputBuffer = Buffer.from(await outputRes.arrayBuffer());

	expect(isAnimatedAvif(outputBuffer)).toBe(true);
});