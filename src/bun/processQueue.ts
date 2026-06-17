import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { availableParallelism } from "node:os";
import path, { join } from "node:path";
import sharp from "sharp";
import { convert as aviphy } from "@ozymandias724/aviphy";
import apng from "sharp-apng";
import isAnimated from 'is-animated';

import type { ProcessImageTask } from "../shared/types";
import { getImageDirectories } from "./shared/directories";
import { getSettings } from "./shared/settings";
import { map as rangeMap } from "./shared/funcs";

const concurrency = availableParallelism();

async function processImage(arg: ProcessImageTask): Promise<void> {
	// No need for a try-catch block, fastq handles errors automatically
	const { outputDirectory } = getImageDirectories();
	const appSettings = getSettings();

	const parsedPath = path.parse(arg.path);
	const outputFormat = arg.outputFormat?.toLowerCase() || appSettings.outputFormat || 'webp';
	const outputPath = join(outputDirectory, `${parsedPath.name}.${outputFormat}`);
	const inputFormat = parsedPath.ext.replace('.', '');


	function getResized(inputPath: string) {
		return sharp(inputPath, {
			density: 72,
			animated: outputFormat === 'jpeg' ? false : true,
		}).resize({
			width: Number(appSettings.maxWidth) ? Number(appSettings.maxWidth) : undefined,
			height: Number(appSettings.maxHeight) ? Number(appSettings.maxHeight) : undefined,
			withoutEnlargement: true
		})
	}

	const clampedQuality = Math.max(1, Math.min(Number(arg.quality) >= 0 ? Number(arg.quality) : Number(appSettings.quality), 100));
	const maybeDefaultedEffort = typeof arg.effort === 'undefined' ? Number(appSettings.effort) : Number(arg.effort);

	if (outputFormat === 'webp') {
		const clampedEffort = Math.max(0, Math.min(maybeDefaultedEffort, 6));
		// special suppoort for animated png input
		if (inputFormat === 'png' && isAnimated(Buffer.from(await Bun.file(arg.path).arrayBuffer()))) {
			const apngData = apng.framesFromApng(arg.path) as sharp.Sharp[];

			const frameBuffers = await Promise.all(
				apngData.map((frame) =>
					frame
						.resize({
							width: Number(appSettings.maxWidth) || undefined,
							height: Number(appSettings.maxHeight) || undefined,
							withoutEnlargement: true,
						})
						.png()
						.toBuffer()
				)
			);

			await sharp(frameBuffers, {
				join: { animated: true },
			}).webp({
				quality: clampedQuality,
				effort: clampedEffort,
				loop: 1
			}).toFile(outputPath);
		}
		else {
			await getResized(arg.path).webp({
				quality: clampedQuality,
				effort: clampedEffort,
			}).toFile(outputPath);
		}
	}
	else if (outputFormat === 'png') {
		const clampedEffort = Math.max(1, Math.min(maybeDefaultedEffort, 10));
		if (isAnimated(Buffer.from(await Bun.file(arg.path).arrayBuffer()))) {

			if (['webp', 'gif'].indexOf(inputFormat) > -1) {
				await apng.sharpToApng(sharp(arg.path, { animated: true }), outputPath, {
					resizeOptions: {
						width: Number(appSettings.maxWidth) || undefined,
						height: Number(appSettings.maxHeight) || undefined,
						withoutEnlargement: true
					}
				});
			}
			else {
				const frames = apng.framesFromApng(arg.path) as sharp.Sharp[];
				await apng.framesToApng(frames, outputPath, {
					cnum: clampedQuality >= 100 ? 0 : Math.max(2, Math.round(256 * (clampedQuality / 100))),
					resizeOptions: {
						width: Number(appSettings.maxWidth) || undefined,
						height: Number(appSettings.maxHeight) || undefined,
						withoutEnlargement: true
					}
				});
			}
		}
		else {

			await getResized(arg.path).png({
				quality: clampedQuality,
				effort: clampedEffort,
			}).toFile(outputPath);
		}
	}
	else if (outputFormat === 'jpeg') {
		await getResized(arg.path).jpeg({
			quality: clampedQuality
		}).toFile(outputPath);
	}
	else if (outputFormat === 'avif') {
		let resizedAsBuffer = await getResized(arg.path).toBuffer();

		const outputBuffer = Buffer.from(await Bun.file(arg.path).arrayBuffer());

		if (isAnimated(outputBuffer)) {

			if (inputFormat === 'png') {
				const apngSharp = await apng.sharpFromApng(arg.path) as sharp.Sharp;
				resizedAsBuffer = await apngSharp.toBuffer();
			}
			// must cast to integer
			const parsedEffort = Math.round(Number(rangeMap(maybeDefaultedEffort, 0, 10, 1, 10)));
			const parsedSpeed = Math.abs(10 - parsedEffort);

			await aviphy({
				input: resizedAsBuffer,
				output: outputPath,
				quality: clampedQuality,
				speed: parsedSpeed,
				preset: 'fast'
			});
		} else {

			// must cast to integer
			const parsedEffort = Math.round(Number(rangeMap(maybeDefaultedEffort, 0, 10, 0, 9)));
			await getResized(arg.path).avif({
				quality: clampedQuality,
				effort: parsedEffort,
			}).toFile(outputPath);
		}
	}
}

export const queue: queueAsPromised<ProcessImageTask> = fastq.promise(processImage, concurrency);
