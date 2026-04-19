import { I18n } from "i18n-js";
import am from './am.json';
import ar from './ar.json';
import bho from './bho.json';
import bn from './bn.json';
import de from './de.json';
import en from './en.json';
import es from './es.json';
import fa from './fa.json';
import fil from './fil.json';
import fr from './fr.json';
import gu from './gu.json';
import ha from './ha.json';
import hi from './hi.json';
import id from './id.json';
import it from './it.json';
import ja from './ja.json';
import jv from './jv.json';
import kn from './kn.json';
import ko from './ko.json';
import ml from './ml.json';
import mr from './mr.json';
import pa from './pa.json';
import pt from './pt.json';
import ru from './ru.json';
import sw from './sw.json';
import ta from './ta.json';
import te from './te.json';
import th from './th.json';
import tr from './tr.json';
import ur from './ur.json';
import vi from './vi.json';
import yo from './yo.json';
import zh from './zh.json';

const i18n = new I18n({
	...am,
	...ar,
	...bho,
	...bn,
	...de,
	...en,
	...es,
	...fa,
	...fil,
	...fr,
	...gu,
	...ha,
	...hi,
	...id,
	...it,
	...ja,
	...jv,
	...kn,
	...ko,
	...ml,
	...mr,
	...pa,
	...pt,
	...ru,
	...sw,
	...ta,
	...te,
	...th,
	...tr,
	...ur,
	...vi,
	...yo,
	...zh,
});

i18n.defaultLocale = 'en';
i18n.locale = 'en';

export const t = (scope: string, options?: Record<string, unknown>) => i18n.t(scope, options);

export function setLocale(language: string) {
	i18n.locale = language;
}

export default i18n;
