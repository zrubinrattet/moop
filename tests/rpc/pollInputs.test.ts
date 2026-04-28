import { test, expect } from "bun:test";
import { mkdirSync } from "node:fs";
import path, { join } from "node:path";
let pollInputs: typeof import('../../src/bun/rpc/pollInputs').default;
let getImageDirectories: typeof import("../../src/bun/shared/directories").getImageDirectories;
let initServer: typeof import('../../src/bun/server').initServer;
let stopServer: typeof import('../../src/bun/server').stopServer;
test('pollInputs', async () => {
	({ default: pollInputs } = await import("../../src/bun/rpc/pollInputs"));
	({ getImageDirectories } = await import("../../src/bun/shared/directories"));
	({ initServer, stopServer } = await import('../../src/bun/server'));
	const { inputDirectory, outputDirectory } = getImageDirectories();
	initServer();

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

	try {
		const relPath = '../fixtures/large.jpg';
		const formData = new FormData();
		const file = Bun.file(join(__dirname, relPath));
		formData.append("image", file, path.parse(relPath).base);
		const res = await fetch("http://localhost:43117/images", {
			method: "POST",
			body: formData,
		});
		const resJson = await res.json();

		expect(resJson.ok).toBe(true);
		expect(resJson.data.severity).toBe('SUCCESS');

		const afterInputOutputDirsRes = await pollInputs();
		expect(afterInputOutputDirsRes.message).toBe("Found inputs");
		expect(afterInputOutputDirsRes.inputPaths).not.toEqual([]);
	} catch (error) {
		console.error(error);
		throw error;
	}

	stopServer();
})