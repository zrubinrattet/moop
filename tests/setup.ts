// Global test setup
import { beforeEach, afterEach, mock } from "bun:test";
import { rmSync, mkdirSync, existsSync } from "node:fs";

import { USER_DATA, PICTURES, TMP } from "./var";

let purgeSettings: typeof import("../src/bun/shared/settings").purgeSettings;
let initSettings: typeof import("../src/bun/shared/settings").initSettings;

beforeEach(async () => {
	mkdirSync(USER_DATA, { recursive: true });
	mkdirSync(PICTURES, { recursive: true });

	const mockElectroBun = {
		Utils: {
			paths: { pictures: PICTURES, userData: USER_DATA },
			showMessageBox: () => {
				return { response: 0 };
			},
			moveToTrash: (path: string) => {
				rmSync(path, { recursive: true, force: true });
				return !existsSync(path);
			}
		},
	};

	mock.module("electrobun", () => mockElectroBun);
	mock.module("electrobun/bun", () => mockElectroBun);

	// import AFTER mocks
	({ initSettings } = await import("../src/bun/shared/settings"));

	await initSettings();
});

afterEach(async () => {
	({ purgeSettings } = await import("../src/bun/shared/settings"));
	// purge the settings cache & rebuild
	await purgeSettings();
	rmSync(TMP, { recursive: true, force: true });
});