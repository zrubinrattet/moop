import { expect, test } from "bun:test";
import { appContextDefaults } from "../../src/shared/context";
import { PICTURES } from "../var";

let getSettings: typeof import("../../src/bun/shared/settings").getSettings;
let setSettings: typeof import("../../src/bun/shared/settings").setSettings;

test('getSettings/setSettings', async () => {
	({ getSettings, setSettings } = await import("../../src/bun/shared/settings"));
	const base = { ...appContextDefaults.settings, outputFolder: PICTURES };
	expect(getSettings()).toEqual(base);
	await setSettings({
		outputFormat: 'jpeg'
	})
	expect(getSettings()).toEqual({ ...base, outputFormat: 'jpeg' });
})