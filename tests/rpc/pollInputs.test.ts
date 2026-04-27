import { test, expect } from "bun:test";

let pollInputs: typeof import('../../src/bun/rpc/pollInputs').default;

test('pollInputs', async () => {
	({ default: pollInputs } = await import("../../src/bun/rpc/pollInputs"));
	const res = await pollInputs();
	expect(res.message).toBe("Folder does not exist yet");
	expect(res.inputPaths).toEqual([]);
})