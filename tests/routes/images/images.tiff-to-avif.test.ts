import { expect, test } from "bun:test";
import { uploadImage } from "../utils";
import {join} from "node:path";

let setSettings: typeof import("../../../src/bun/shared/settings").setSettings;

test('images route: tiff to avif', async () => {
	({ setSettings } = await import("../../../src/bun/shared/settings"));

	await setSettings({
		outputFormat: 'avif'
	})

	const resJson = await uploadImage(join(__dirname, '../../fixtures/example.tif'));

	expect(resJson.ok).toBe(true);
	expect(resJson.data.severity).toBe('SUCCESS');
});