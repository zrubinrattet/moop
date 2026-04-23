import { BaseResponse } from "../../shared/shared-objects";
import { appContextDefaults } from "../../shared/shared-context";
import { getSettings } from "../../shared/shared-settings";
import type { SettingsResponseType } from "../../shared/shared-types";

export default async () => {
	const base: SettingsResponseType = {
		...{ ...BaseResponse }, ...appContextDefaults.settings,
	}
	const loadedSettings = getSettings();

	return { ...base, ...loadedSettings };
};