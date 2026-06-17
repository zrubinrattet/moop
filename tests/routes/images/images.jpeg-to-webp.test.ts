import { expect, test } from "bun:test";
import { uploadImage } from "../utils";
import {join} from "node:path";

let setSettings: typeof import("../../../src/bun/shared/settings").setSettings;

test('images route: jpeg to webp', async () => {
	({ setSettings } = await import("../../../src/bun/shared/settings"));

	await setSettings({
		outputFormat: 'webp'
	})

	const resJson = await uploadImage(join(__dirname, '../../fixtures/tall.jpg'));

	expect(resJson.ok).toBe(true);
	expect(resJson.data.severity).toBe('SUCCESS');
});