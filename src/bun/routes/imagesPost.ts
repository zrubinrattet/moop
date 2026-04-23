import { getImageDirectories } from "../../shared/shared-directories";
import { getSettings } from "../../shared/shared-settings";
import type { APIResponseType } from "../../shared/shared-types";
import { APIResponse } from "../../shared/shared-objects";
import { mkdir, readdir, stat } from "node:fs/promises";
import path, { join } from 'node:path';


import corsHeaders from "./corsHeaders";
import { queue } from "../processQueue";
import { convertImageURL } from "../../shared/shared-funcs";
import { imageSizeFromFile } from "image-size/fromFile";
import { statSync } from "node:fs";
import { t } from "../../mainview/lang/lang";
import type { Image } from "../../shared/shared-types";

const dirSize = async (directory: string) => {
	const files = await readdir(directory);
	const stats = files.map(file => stat(path.join(directory, file)));

	return (await Promise.all(stats)).reduce((accumulator, { size }) => accumulator + size, 0);
}

export default async (req: Bun.BunRequest) => {
	const { imageDirectory, inputDirectory, outputDirectory } = getImageDirectories();
	const ret: APIResponseType = APIResponse;
	const appSettings = getSettings();

	const form = await req.formData();
	const image = form.get('image');

	let ok = true;

	if (!(image instanceof File)) {
		return new Response('Missing file', {
			status: 400,
			headers: corsHeaders,
		});
	}

	const allowedTypes = ['image/jpeg',
		'image/png',
		'image/webp',
		'image/tiff',
		'image/gif',
		'image/svg+xml',
		'image/avif'];

	if (!allowedTypes.find(entry => entry === image.type)) {
		return new Response('Incorrect file type', {
			status: 400,
			headers: corsHeaders,
		});
	}

	try {

		// make the dirs
		await mkdir(imageDirectory, { recursive: true });
		await mkdir(inputDirectory, { recursive: true });
		await mkdir(outputDirectory, { recursive: true });

		// add the file to the queue for processing
		const inputPath = join(inputDirectory, image.name);
		const bytes = await image.bytes();
		await Bun.write(inputPath, bytes);
		await queue.push({ path: inputPath }).catch((err) => {
			console.error(err)
		})

		// check if the output file got made
		const outputPath = join(outputDirectory, `${path.parse(image.name).name}.${appSettings.outputFormat}`);

		if (await Bun.file(outputPath).exists()) {
			ret.message = `Successfully processed image.`;

			const inputResolution = await imageSizeFromFile(inputPath);
			const outputResolution = await imageSizeFromFile(outputPath);

			const image: Image = {
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
				effort: appSettings.effort,
				quality: appSettings.quality,
				outputFormat: appSettings.outputFormat
			};

			ret.images = [image];
			ret.inputFolderSize = await dirSize(inputDirectory);
			ret.outputFolderSize = await dirSize(outputDirectory);
		}
		else {
			ret.message = t('updateImageError');
			ret.severity = 'ERROR';
			ok = false;
		}

	} catch (error) {
		if (error instanceof Error) {
			ret.message = error.message;
		}
		else {
			ret.message = t('unknownError');
		}

		ret.severity = 'ERROR';
	}

	return Response.json(
		{ ok: ok, data: ret },
		{ headers: corsHeaders }
	);
}