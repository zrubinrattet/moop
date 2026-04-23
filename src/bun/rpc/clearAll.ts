import { Utils } from "electrobun";
import { getImageDirectories } from "../../shared/shared-directories";
import { BaseResponse } from "../../shared/shared-objects";
import { t } from "../../mainview/lang/lang";
import { readdir, mkdir } from "node:fs/promises"

export default async () => {
	const { inputDirectory, outputDirectory } = getImageDirectories();
	const ret = { ...BaseResponse };

	const { response } = await Utils.showMessageBox({
		type: "question",
		title: t('confirmClearAllTitle'),
		message: t('confirmClearAllMessage'),
		detail: t('confirmClearAllDetail'),
		buttons: [t('confirmClearButton0'), t('confirmClearButton1')],
		// Focus on the cancel button by default
		defaultId: 1,
		// Pressing Escape returns 1 (Cancel)
		cancelId: 1
	});

	// if clear all was pressed
	if (response === 0) {
		try {
			Utils.moveToTrash(inputDirectory);
			Utils.moveToTrash(outputDirectory);
			await mkdir(inputDirectory, { recursive: true });
			await mkdir(outputDirectory, { recursive: true });
			const inputFiles = await readdir(inputDirectory);
			const outputFiles = await readdir(outputDirectory);

			if (inputFiles.length === 0 && outputFiles.length === 0) {
				ret.message = t('deleteImagesSuccess');
			}
		} catch {
			ret.message = t('deleteImagesError');
			ret.severity = 'ERROR';
		}
	}
	else {
		ret.message = t('deleteImagesCancel');
		ret.severity = 'WARNING';
	}
	
	return ret;
}