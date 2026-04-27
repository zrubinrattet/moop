import { test, expect } from "bun:test";
import { join } from 'node:path';
import { cp } from 'node:fs/promises';

let getImageDirectories: typeof import('../../src/bun/shared/directories').getImageDirectories;
let convertImageURL: typeof import('../../src/bun/shared/funcs').convertImageURL;

test('convertImageURL', async () => {
	({ getImageDirectories } = await import("../../src/bun/shared/directories"));
	({ convertImageURL } = await import("../../src/bun/shared/funcs"));
	const { inputDirectory } = getImageDirectories();
	// add the image to the input
	await cp(join(__dirname, '../fixtures/large.jpg'), join(inputDirectory, 'large.jpg'));
	const newURL = convertImageURL({
		url: 'http://localhost:43117/images/input/large.jpg',
		type: 'localtoabsolute'
	})
	expect(newURL).toEqual(join(inputDirectory, 'large.jpg'));
});