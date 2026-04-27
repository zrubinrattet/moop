import { Utils } from "electrobun";
import { getImageDirectories } from "../shared/directories";
import { ProcessImageResponse } from "../shared/objects";
import { convertImageURL } from "../shared/funcs";
import { imageSizeFromFile } from "image-size/fromFile";
import path, { join } from "node:path";
import { statSync } from "node:fs";
import { exists } from "node:fs/promises";
import type { ProcessImageResponseType, ProcessImageTask } from "../../shared/types";
import { BaseResponse } from "../shared/objects";
import { t } from "../../lang/lang";

export default async (params: ProcessImageTask) => {
	const { outputDirectory } = getImageDirectories();
	const { response } = await Utils.showMessageBox({
		type: "question",
		title: t('confirmDeleteImageTitle'),
		message: t('confirmDeleteImageMessage'),
		detail: t('confirmDeleteImageDetail'),
		buttons: [t('confirmDeleteImageButton0'), t('confirmDeleteImageButton1')],
		defaultId: 1,  // Focus "Cancel" by default
		cancelId: 1    // Pressing Escape returns 1 (Cancel)
	});

	if (response === 0) {
		// User clicked "Delete"

		const ret: ProcessImageResponseType = { ...ProcessImageResponse };
		const inputPath = convertImageURL({
			url: params.path,
			type: 'localtoabsolute',
		});
		const outputPath = join(outputDirectory, `${path.parse(inputPath).name}.webp`);
		const outputPathPng = join(outputDirectory, `${path.parse(inputPath).name}.png`);
		const outputPathJpeg = join(outputDirectory, `${path.parse(inputPath).name}.jpeg`);
		const inputResolution = await imageSizeFromFile(inputPath);
		const outputResolution = await imageSizeFromFile(outputPath);
		const image = {
			input: convertImageURL({ url: inputPath, type: 'absolutetolocal' }),
			inputSizeBytes: statSync(inputPath).size,
			inputResolution: {
				width: inputResolution.width,
				height: inputResolution.height,
			},
			output: `${convertImageURL({ url: outputPath, type: 'absolutetolocal' })}?v=${statSync(outputPath).mtimeMs}`,
			outputSizeBytes: statSync(outputPath).size,
			outputResolution: {
				width: outputResolution.width,
				height: outputResolution.height,
			},
			isActive: true,
		}
		ret.image = { ...ProcessImageResponse.image, ...image };

		const inputTrashSuccessful = Utils.moveToTrash(inputPath)
		const outputTrashSuccessful = Utils.moveToTrash(outputPath)
		const outputPngTrashSuccessful = await exists(outputPathPng) ? Utils.moveToTrash(outputPathPng) : true;
		const outputJpegTrashSuccessful = await exists(outputPathPng) ? Utils.moveToTrash(outputPathJpeg) : true;

		if (inputTrashSuccessful && outputTrashSuccessful && outputJpegTrashSuccessful && outputPngTrashSuccessful) {
			ret.message = t('deleteImageSuccess');
		}
		else {
			ret.message = t('deleteImageError');
			ret.severity = 'ERROR';
		}

		return ret;
	} else {
		// user clicked cancel or closed the dialog

		return { ...BaseResponse, message: 'Cancelled delete' };
	}
}