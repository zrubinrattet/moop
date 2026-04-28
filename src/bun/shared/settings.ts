import { Utils } from "electrobun/bun";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import type { ApplicationSettingsType } from "../../shared/types";
import { appContextDefaults } from "../../shared/context";
import { t } from "../../lang/lang";

const settingsPath = join(Utils.paths.userData, "settings.json");
// in-memory store of settings
let settingsCache: ApplicationSettingsType | null = null;

function getDefaultSettings(): ApplicationSettingsType {
	return {
		...appContextDefaults.settings,
		outputFolder: Utils.paths.pictures,
	};
}

export async function purgeSettings() {
	settingsCache = getDefaultSettings();
	const ret = await Bun.write(settingsPath, JSON.stringify(settingsCache));
	if (ret === 0) {
		throw new Error(t('settingsWriteError'))
	}
}

export async function initSettings(): Promise<ApplicationSettingsType> {
	if (settingsCache) return settingsCache; // already cached

	mkdirSync(Utils.paths.userData, { recursive: true });

	const file = Bun.file(settingsPath);
	const exists = await file.exists();

	if (!exists) {
		settingsCache = getDefaultSettings();
		const ret = await Bun.write(settingsPath, JSON.stringify(settingsCache));
		if (ret === 0) {
			throw new Error(t('settingsWriteError'))
		}
		return settingsCache;
	}

	try {
		const loaded = (await file.json()) as ApplicationSettingsType;
		settingsCache = { ...getDefaultSettings(), ...loaded };
	} catch {
		settingsCache = getDefaultSettings();
		const ret = await Bun.write(settingsPath, JSON.stringify(settingsCache));
		if (ret === 0) {
			throw new Error(t('settingsWriteError'))
		}
	}

	return settingsCache;
}

export function getSettings(): ApplicationSettingsType {
	if (!settingsCache) {
		// this only occurs if initSettings() wasn't called first.
		throw new Error(t('unknownError'));
	}
	return settingsCache;
}

export async function setSettings(
	patch: Partial<ApplicationSettingsType>
): Promise<ApplicationSettingsType> {
	const current = getSettings();
	settingsCache = { ...current, ...patch };
	const ret = await Bun.write(settingsPath, JSON.stringify(settingsCache));
	if (ret === 0) {
		throw new Error(t('settingsWriteError'))
	}
	return settingsCache;
}

export function getSettingsPath() {
	return settingsPath;
}
