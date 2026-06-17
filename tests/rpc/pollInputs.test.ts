import { test, expect } from "bun:test";
import { mkdirSync } from "node:fs";
import path, { join } from "node:path";
let pollInputs: typeof import('../../src/bun/rpc/pollInputs').default;
let getImageDirectories: typeof import("../../src/bun/shared/directories").getImageDirectories;

test('pollInputs', async () => {
	({ default: pollInputs } = await import("../../src/bun/rpc/pollInputs"));
	({ getImageDirectories } = await import("../../src/bun/shared/directories"));

	const { inputDirectory, outputDirectory } = getImageDirectories();


	const res = await pollInputs();
	expect(res.message).toBe("Folder does not exist yet");
	expect(res.inputPaths).toEqual([]);

	// make the input directory
	mkdirSync(inputDirectory, { recursive: true });
	// make the output directory
	mkdirSync(outputDirectory, { recursive: true });

	const afterInputOutputDirsRes = await pollInputs();
	expect(afterInputOutputDirsRes.message).toBe("Inputs do not exist yet");
	expect(afterInputOutputDirsRes.inputPaths).toEqual([]);


	const relPath = '../fixtures/large.jpg';
	const formData = new FormData();
	const file = Bun.file(join(__dirname, relPath));
	formData.append("image", file, path.parse(relPath).base);
	const afterUploadRes = await fetch("http://localhost:43117/images", {
		method: "POST",
		body: formData,
	});
	const afterUploadResJson = await afterUploadRes.json();

	expect(afterUploadResJson.ok).toBe(true);
	expect(afterUploadResJson.data.severity).toBe('SUCCESS');

	const afterUploadPollRes = await pollInputs();
	expect(afterUploadPollRes.message).toBe("Found inputs");
	expect(afterUploadPollRes.inputPaths).not.toEqual([]);



})