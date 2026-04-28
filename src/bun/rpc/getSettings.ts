import { BaseResponse } from "../shared/objects";
import { appContextDefaults } from "../../shared/context";
import { getSettings } from "../shared/settings";
import type { SettingsResponseType } from "../../shared/types";
import { t } from "../../lang/lang";

export default async () => {
	const base: SettingsResponseType = {
		...{ ...BaseResponse }, ...appContextDefaults.settings,
	}
	try {
		const loadedSettings = getSettings();
		return { ...base, ...loadedSettings };
	} catch(error) {
		if( error instanceof Error ){
			return { ...base, message: error.message };
		}
		return { ...base, message: t('unknownError') };
	}

};