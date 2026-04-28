import { expect, test } from "bun:test";
import { mkdirSync } from "node:fs";
import path, { join } from "node:path";
import { cp } from "node:fs/promises";

let clearAll: typeof import("../../src/bun/rpc/clearAll").default;
let getImageDirectories: typeof import("../../src/bun/shared/directories").getImageDirectories;

test('clearAll', async () => {
	({ default: clearAll } = await import("../../src/bun/rpc/clearAll"));
	({ getImageDirectories } = await import("../../src/bun/shared/directories"));

	const { inputDirectory, outputDirectory } = getImageDirectories();

	// make the output directory
	mkdirSync(outputDirectory, { recursive: true });

	// prime inputs
	const inputs = ['../fixtures/large.jpg', '../fixtures/tall.jpg', '../fixtures/transparent.png']
	for (const relPath of inputs) {
		await cp(join(__dirname, relPath), join(inputDirectory, path.parse(relPath).base));
	};

	const res = await clearAll();
	expect(res.severity).toBe('SUCCESS');
});