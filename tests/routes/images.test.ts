import { expect, test, beforeEach, afterEach } from "bun:test";
import path, { join } from "node:path";
import { describe } from "node:test";
import isAnimated from "is-animated";

let initServer: typeof import("../../src/bun/server").initServer;
let stopServer: typeof import("../../src/bun/server").stopServer;
describe('images api route tests', () => {
	beforeEach(async () => {
		({ initServer } = await import("../../src/bun/server"));
		initServer();
	});
	afterEach(async () => {
		({ stopServer } = await import("../../src/bun/server"));
		stopServer();
	});
	test('imagesGetSet', async () => {
		const acceptedFiles = ['../fixtures/large.jpg', '../fixtures/tall.jpg', '../fixtures/transparent.png'];
		const promises = acceptedFiles.map(async (relPath) => {
			const formData = new FormData();
			const file = Bun.file(join(__dirname, relPath));
			formData.append("image", file, path.parse(relPath).base);
			const res = await fetch("http://localhost:43117/images", {
				method: "POST",
				body: formData,
			});
			return await res.json();
		})
		const postRes = await Promise.all(promises);

		expect(postRes).toHaveLength(3);

		if (postRes.length) {
			for (const obj of postRes) {
				expect(obj.ok).toBe(true)
				expect(obj.data.message).toBe('Successfully processed image.');
			}
		}

		const getReq = await fetch('http://localhost:43117/images/input/large.jpg');

		expect(getReq.ok).toBe(true);
	});
	test('imageUpload: svg', async () => {
		const relPath = '../fixtures/bacteria.svg';
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
	})
	test('imageUpload: avif', async () => {
		const relPath = '../fixtures/still.avif';
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
	})
	test('imageUpload: animated gif', async () => {
		const relPath = '../fixtures/animated.gif';
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
		const outputUrl = resJson.data.images?.[0]?.output;
		expect(outputUrl).toBeTruthy();

		// strip cache query (?v=...)
		const cleanOutputUrl = outputUrl.split("?")[0];
		const outputRes = await fetch(cleanOutputUrl);
		expect(outputRes.ok).toBe(true);

		const outputBuffer = Buffer.from(await outputRes.arrayBuffer());
		expect(isAnimated(outputBuffer)).toBe(true);
	})
	test('imageUpload: animated webp', async () => {
		const relPath = '../fixtures/animated.webp';
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
		const outputUrl = resJson.data.images?.[0]?.output;
		expect(outputUrl).toBeTruthy();

		// strip cache query (?v=...)
		const cleanOutputUrl = outputUrl.split("?")[0];
		const outputRes = await fetch(cleanOutputUrl);
		expect(outputRes.ok).toBe(true);

		const outputBuffer = Buffer.from(await outputRes.arrayBuffer());
		expect(isAnimated(outputBuffer)).toBe(true);
	})
})