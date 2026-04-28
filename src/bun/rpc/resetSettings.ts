import { appContextDefaults } from "../../shared/context";
import { BaseResponse } from "../shared/objects";
import { getSettings, setSettings } from "../shared/settings";
import type { SettingsResponseType } from "../../shared/types";
import { t } from "../../lang/lang";

export default async () => {
	const ret: SettingsResponseType = {
		...{ ...BaseResponse }, ...appContextDefaults.settings,
	}
	try {
		setSettings({ ...appContextDefaults.settings, ...{ outputFolder: '' } })

		const newSettings = getSettings();

		return { ...ret, ...newSettings };
	} catch (error) {
		if (error instanceof Error) {
			return { ...ret, message: error.message };
		}
		return { ...ret, message: t('unknownError') };
	}
};