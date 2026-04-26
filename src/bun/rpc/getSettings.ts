import { BaseResponse } from "../shared/objects";
import { appContextDefaults } from "../../shared/context";
import { getSettings } from "../shared/settings";
import type { SettingsResponseType } from "../../shared/types";

export default async () => {
	const base: SettingsResponseType = {
		...{ ...BaseResponse }, ...appContextDefaults.settings,
	}
	const loadedSettings = getSettings();

	return { ...base, ...loadedSettings };
};