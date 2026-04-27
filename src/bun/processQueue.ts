import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { availableParallelism } from "node:os";
import path, { join } from "node:path";
import sharp from "sharp";

import type { ProcessImageTask } from "../shared/types";
import { getImageDirectories } from "./shared/directories";
import { getSettings } from "./shared/settings";

const concurrency = availableParallelism();

async function processImage(arg: ProcessImageTask): Promise<void> {
	// No need for a try-catch block, fastq handles errors automatically
	const { outputDirectory } = getImageDirectories();
	const appSettings = getSettings();

	const parsed = path.parse(arg.path);
	const outputFormat = arg.outputFormat?.toLowerCase() || appSettings.outputFormat || 'webp';
	const outputPath = join(outputDirectory, `${parsed.name}.${outputFormat}`);
	
	const resized = sharp(arg.path, {
		density: 72,
		animated: outputFormat === 'jpeg' ? false : true,
	}).resize({
		width: Number(appSettings.maxWidth) ? Number(appSettings.maxWidth) : undefined,
		height: Number(appSettings.maxHeight) ? Number(appSettings.maxHeight) : undefined,
		withoutEnlargement: true
	})

	const parsedQuality = Math.max(1, Math.min(Number(arg.quality) || Number(appSettings.quality), 100));
	if (outputFormat === 'webp') {
		const parsedEffort = Math.max(0, Math.min(Number(arg.effort) || Number(appSettings.effort), 6));
		await resized.webp({
			quality: parsedQuality,
			effort: parsedEffort,
		}).toFile(outputPath);
	}
	else if (outputFormat === 'png') {
		const parsedEffort = Math.max(1, Math.min(Number(arg.effort) || Number(appSettings.effort), 10));
		await resized.png({
			quality: parsedQuality,
			effort: parsedEffort,
		}).toFile(outputPath);
	}
	else if (outputFormat === 'jpeg') {
		await resized.jpeg({
			quality: parsedQuality
		}).toFile(outputPath);
	}
}

export const queue: queueAsPromised<ProcessImageTask> = fastq.promise(processImage, concurrency);
