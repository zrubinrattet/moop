import { BaseResponse } from "../shared/objects";
import { appContextDefaults } from "../../shared/context";
import type { ApplicationSettingsType, SettingsResponseType } from "../../shared/types";
import { getSettings, setSettings } from "../shared/settings";
import { getImageDirectories } from "../shared/directories";
import { setLocale, t } from "../../lang/lang";
import { exists, cp } from "node:fs/promises";

export default async (props: ApplicationSettingsType) => {
	const ret: SettingsResponseType = {
		...{ ...BaseResponse }, ...appContextDefaults.settings,
	}
	try {
		const loadedSettings = getSettings();

		const newSettings = { ...loadedSettings, ...props };
	
		const oldImageDirectory = getImageDirectories().imageDirectory;
	
		await setSettings(newSettings);
		setLocale(newSettings.language);
	
		// if output folder changed, copy the output/input folders over to the new location
		const newImageDirectory = getImageDirectories().imageDirectory;
	
		if (await exists(oldImageDirectory) && oldImageDirectory !== newImageDirectory) {
			await cp(oldImageDirectory, newImageDirectory, { recursive: true });
		}
	
		return { ...ret, ...newSettings };
	} catch (error) {
		if (error instanceof Error) {
			return { ...ret, message: error.message };
		}
		return { ...ret, message: t('unknownError') };
	}
}