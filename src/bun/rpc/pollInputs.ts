import { getImageDirectories } from "../../shared/shared-directories";
import { convertImageURL } from "../../shared/shared-funcs";
import { BaseResponse } from "../../shared/shared-objects";
import type { PollInputsResponseType } from "../../shared/shared-types";


export default async () => {
	const { inputDirectory } = getImageDirectories();
	const inputPaths: Array<string> = []
	const ret: PollInputsResponseType = {
		...{ ...BaseResponse }, inputPaths
	}
	try {
		const glob = new Bun.Glob("**/*");

		// Get absolute paths for all files in a specific directory
		const inputPaths = await Array.fromAsync(
			glob.scan({
				cwd: inputDirectory,
				absolute: true,
				onlyFiles: true
			})
		);

		ret.inputPaths = inputPaths.map(inputPath => convertImageURL({ url: inputPath, type: 'absolutetolocal' }));
		ret.message = 'Found inputs'
	} catch (error) {

		if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
			ret.message = 'Folder does not exist yet';
		}
	}
	return ret;
};