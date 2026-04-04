import { Utils } from "electrobun";
import { join } from 'node:path';

// set the directories
const moopDirectoryKey = Date.now();
const imageDirectory = join(Utils.paths.pictures, `moop-${moopDirectoryKey}`);
const inputDirectory = join(imageDirectory, 'input');
const outputDirectory = join(imageDirectory, 'output');

export function getImageDirectories(){
	return {
		imageDirectory,
		inputDirectory,
		outputDirectory
	}
}