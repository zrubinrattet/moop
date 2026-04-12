/**
 * For BE shared utility functions.
 */

import { join } from 'node:path';
import { getImageDirectories } from './shared-directories';

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
			ret = join('http://localhost:3000/images/', base[1]);
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
