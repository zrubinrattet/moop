import { Utils } from "electrobun";
import { join } from "node:path";
import { getSettings } from "./shared-settings";

// stable for app lifetime
const moopDirectoryKey = Date.now();

export function getImageDirectories() {
	const { outputFolder } = getSettings();
	const rootDirectory = outputFolder?.trim() || Utils.paths.pictures;
	const moopDirectory = `moop-${moopDirectoryKey}`;
	const imageDirectory = join(rootDirectory, moopDirectory);
	const inputDirectory = join(imageDirectory, "input");
	const outputDirectory = join(imageDirectory, "output");

	return { rootDirectory, moopDirectory, imageDirectory, inputDirectory, outputDirectory };
}