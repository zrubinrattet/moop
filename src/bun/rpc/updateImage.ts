import { imageSizeFromFile } from "image-size/fromFile";
import { getImageDirectories } from "../shared/directories";
import { convertImageURL } from "../shared/funcs";
import { ProcessImageResponse } from "../shared/objects";
import { getSettings } from "../shared/settings";
import type { ProcessImageResponseType, ProcessImageTask } from "../../shared/types";
import path, { join } from "node:path";
import { statSync } from "node:fs";
import { t } from "../../lang/lang";
import { queue } from "../processQueue";

export default async (params:ProcessImageTask) => {
	const { outputDirectory } = getImageDirectories();
	const { quality, effort, outputFormat } = params;
	const appSettings = getSettings();

	if (quality === undefined || effort === undefined) {

		const ret: ProcessImageResponseType = {
			...{ ...ProcessImageResponse },
			message: 'No update',
			severity: 'WARNING'
		};

		return ret;
	}

	const ret: ProcessImageResponseType = {
		...{ ...ProcessImageResponse },
		image: {
			...ProcessImageResponse.image,
			effort,
			quality,
			outputFormat: outputFormat || appSettings.outputFormat
		},
	};

	const inputPath = convertImageURL({
		url: params.path,
		type: 'localtoabsolute',
	});

	const clampedQuality = Math.max(1, Math.min((quality || appSettings.quality), 100));
	const clampedEffort = Math.max((outputFormat || appSettings.outputFormat) === 'webp' ? 0 : 1, Math.min(effort || appSettings.effort, (outputFormat || appSettings.outputFormat) === 'webp' ? 6 : 10));


	await queue.push({
		path: inputPath,
		quality: clampedQuality,
		effort: clampedEffort,
		outputFormat: outputFormat
	}).then(async () => {
		ret.message = t('updateImageSuccess');

		const outputPath = join(outputDirectory, `${path.parse(inputPath).name}.${outputFormat?.toLowerCase() || 'webp'}`);
		const inputResolution = await imageSizeFromFile(inputPath);
		const outputResolution = await imageSizeFromFile(outputPath);

		ret.image = {
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
			isActive: false,
			effort: clampedEffort,
			quality: clampedQuality,
			outputFormat: outputFormat || appSettings.outputFormat,
		};
	}).catch(() => {
		ret.message = t('updateImageError');
		ret.severity = 'ERROR';
	})
	
	return ret;
};