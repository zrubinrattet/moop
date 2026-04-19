import { I18n } from "i18n-js";
import en from './en.json';
import es from './es.json';

const i18n = new I18n({
	...en,
	...es
});

i18n.defaultLocale = 'en';
i18n.locale = 'en';

export const t = (scope: string, options?: Record<string, unknown>) => i18n.t(scope, options);

export function setLocale(language: string) {
	i18n.locale = language;
}

export default i18n;
