/**
 * For BE shared utility functions.
 */

import { join } from 'node:path';
import { getImageDirectories } from './directories';

type convertImageURLProps = {
	url: string,
	type: 'absolutetolocal' | 'localtoabsolute',
}

export function convertImageURL(props: convertImageURLProps) {
	let ret = '';

	const { imageDirectory } = getImageDirectories();
	switch (props.type) {
		case 'absolutetolocal': {
			const base = props.url.split(/moop-\d+(.*)/);
			const rel = (base[1] || "").replace(/^\/+/, "");
			ret = new URL(rel, 'http://localhost:43117/images/').toString();
			break;
		}

		case 'localtoabsolute': {
			const sanitizedURL = props.url.split(/[?#]/)[0];
			const base = sanitizedURL.split(/\/images\/(.*)/);
			ret = join(imageDirectory, base[1]);
			break;
		}
	}
	return ret;
}
