import { test, expect } from "bun:test";
import path, {join} from "node:path";

let initServer: typeof import('../../src/bun/server').initServer;
let stopServer: typeof import('../../src/bun/server').stopServer;

test('server', async () => {
	({ initServer, stopServer } = await import('../../src/bun/server'));

	initServer();

	const relPath = '../fixtures/large.jpg';
	const formData = new FormData();
	const file = Bun.file(join(__dirname, relPath));
	formData.append("image", file, path.parse(relPath).base);
	const afterStartRes = await fetch("http://localhost:43117/images", {
		method: "POST",
		body: formData,
	});

	expect(afterStartRes.ok).toBe(true);
	
	stopServer();

	const afterStopRes = await fetch("http://localhost:43117/images");

	expect(afterStopRes.ok).toBe(false);

});