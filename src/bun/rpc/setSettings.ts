import { BaseResponse } from "../shared/objects";
import { appContextDefaults } from "../../shared/context";
import type { ApplicationSettingsType, SettingsResponseType } from "../../shared/types";
import { getSettings, setSettings } from "../shared/settings";
import { getImageDirectories } from "../shared/directories";
import { setLocale } from "../../lang/lang";
import { exists, cp } from "node:fs/promises";

export default async (props:ApplicationSettingsType) => {
	const ret: SettingsResponseType = {
		...{ ...BaseResponse }, ...appContextDefaults.settings,
	}
	const loadedSettings = getSettings();
	const newSettings = { ...loadedSettings, ...props };

	const oldImageDirectory = getImageDirectories().imageDirectory;

	await setSettings(newSettings);
	setLocale(newSettings.language);

	const newImageDirectory = getImageDirectories().imageDirectory;

	if (await exists(oldImageDirectory) && oldImageDirectory !== newImageDirectory) {
		await cp(oldImageDirectory, newImageDirectory, { recursive: true });
	}

	return { ...ret, ...newSettings };
}