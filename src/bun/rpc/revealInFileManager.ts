import { Utils } from "electrobun";
import { getImageDirectories } from "../shared/directories";
import { BaseResponse } from "../shared/objects";

import type { BaseResponseType } from "../../shared/types";
import { convertImageURL } from "../shared/funcs";
import { t } from "../../lang/lang";


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