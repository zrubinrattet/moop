/**
 * For BE shared utility functions.
 */

import { join } from 'node:path';
import { getImageDirectories } from './directories';
import { imageDimensionsFromData } from 'image-dimensions';
import { imageSizeFromFile } from "image-size/fromFile";
import { readFile } from 'node:fs/promises';

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
			ret = decodeURIComponent(join(imageDirectory, base[1]));
			break;
		}
	}
	return ret;
}

export const getImageDimensionsFromPath = async (filePath: string) => {
	const dimensions = imageDimensionsFromData(await readFile(filePath));

	if (dimensions) {
		return dimensions;
	}

	return imageSizeFromFile(filePath);
}

/**
 * Maps `v` from the input range `e` to `g` into the output range `a` to `n`.
 * Values past the input range end clamp to the output range end; values before
 * the input range start continue to extrapolate. Returns undefined for a
 * zero-length input range.
 */
export function map(v: number, e: number, g: number, a: number, n: number) {
	if (e === g) {
		return undefined;
	}

	const t = Math.max(0, Math.min(1, (v - e) / (g - e)));
	return a + t * (n - a);
}