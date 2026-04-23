import { Utils } from "electrobun";
import { getImageDirectories } from "../../shared/shared-directories";
import { BaseResponse } from "../../shared/shared-objects";

import type { BaseResponseType } from "../../shared/shared-types";
import { convertImageURL } from "../../shared/shared-funcs";
import { t } from "../../mainview/lang/lang";


export default async (props:{path?: string}|undefined) => {
	const { imageDirectory } = getImageDirectories();
	// init response
	const ret: BaseResponseType = BaseResponse;

	try {
		Utils.showItemInFolder(typeof props?.path === 'undefined' ? imageDirectory : convertImageURL({
			url: props.path,
			type: 'localtoabsolute'
		}));
		ret.message = 'Opened images folder';
	} catch (error) {
		if (error instanceof Error) {
			ret.message = error.message;
		}
		else {
			ret.message = t('unknownError');
		}

		ret.severity = 'ERROR';
	}
	return ret;
};