import { Utils } from "electrobun";
import { BaseResponse } from "../shared/objects";

import type { OpenFileDialogResponseType } from "../../shared/types";

export default async () => {
	const res = await Utils.openFileDialog({
		canChooseDirectory: true,
		canChooseFiles: false,
		allowsMultipleSelection: false,
		startingFolder: Utils.paths.pictures,
	});
	const ret: OpenFileDialogResponseType = { ...BaseResponse, ...{ path: res[0] } };
	return ret;
};