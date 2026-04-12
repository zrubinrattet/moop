import { Utils } from "electrobun";
import { join } from 'node:path';
import { ApplicationSettingsType } from "./shared-types";


export async function getImageDirectories() {
	const settingsPath = join(Utils.paths.userData, 'settings.json');

	let rootDirectory = Utils.paths.pictures;

	if (await Bun.file(settingsPath).exists()) {
		try {
			const settingsData: ApplicationSettingsType = await Bun.file(settingsPath).json();
			rootDirectory = settingsData.outputFolder || Utils.paths.pictures;
		}
		catch{
			rootDirectory = Utils.paths.pictures;
		}
	}

	// set the directories
	const moopDirectoryKey = Date.now();
	const imageDirectory = join(rootDirectory, `moop-${moopDirectoryKey}`);
	const inputDirectory = join(imageDirectory, 'input');
	const outputDirectory = join(imageDirectory, 'output');
	return {
		rootDirectory,
		imageDirectory,
		inputDirectory,
		outputDirectory
	}
}
