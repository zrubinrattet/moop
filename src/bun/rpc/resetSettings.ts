import { appContextDefaults } from "../../shared/context";
import { BaseResponse } from "../shared/objects";
import { getSettings, setSettings } from "../shared/settings";
import type { SettingsResponseType } from "../../shared/types";

export default async () => {
	const ret: SettingsResponseType = {
		...{ ...BaseResponse }, ...appContextDefaults.settings,
	}

	setSettings({ ...appContextDefaults.settings, ...{ outputFolder: '' } })

	const newSettings = getSettings();

	return { ...ret, ...newSettings };
};