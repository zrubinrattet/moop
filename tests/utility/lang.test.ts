import { test, expect } from "bun:test";
let setLocale: typeof import('../../src/lang/lang').setLocale;
let getLocale: typeof import('../../src/lang/lang').getLocale;

test('lang', async () => {
	({ getLocale, setLocale } = await import('../../src/lang/lang'));

	expect(getLocale()).toBe('en');

	setLocale('es');

	expect(getLocale()).toBe('es');
});