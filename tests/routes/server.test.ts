import { expect, test } from "bun:test";
import { describe } from "node:test";
import corsHeaders from "../../src/bun/routes/corsHeaders";

describe('server tests', () => {

	test('preflight', async () => {
		const res = await fetch("http://localhost:43117", {
			method: "OPTIONS",
			headers: corsHeaders
		});

		expect(res.status).toBe(204);
	});

	test('404', async () => {
		const res = await fetch("http://localhost:43117/cow", {
			method: "POST",
			headers: corsHeaders
		});

		expect(res.status).toBe(404);
	});

})
