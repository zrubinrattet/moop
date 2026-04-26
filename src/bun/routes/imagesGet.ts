import { getImageDirectories } from "../shared/directories";

import { join } from 'node:path'
import {statSync} from "node:fs";

import corsHeaders from "./corsHeaders";

export default (req: Bun.BunRequest) => {
	const { imageDirectory } = getImageDirectories();
	const url = new URL(req.url);
	const basename = decodeURIComponent(url.pathname.slice("/images/".length));
	const imagePath = join(imageDirectory, basename);

	try {
		const imageStats = statSync(imagePath);

		const imageFile = Bun.file(imagePath);
		const etag = `W/"${imageStats.size}-${imageStats.mtimeMs}"`;
		const lastModified = imageStats.mtime.toUTCString();

		if (req.headers.get("if-none-match") === etag) {
			return new Response(null, {
				status: 304,
				headers: {
					...corsHeaders,
					"Cache-Control": "public, max-age=3600, must-revalidate",
					"ETag": etag,
					"Last-Modified": lastModified,
				},
			});
		}

		return new Response(imageFile, {
			headers: {
				...corsHeaders,
				"Cache-Control": "public, max-age=3600, must-revalidate",
				"ETag": etag,
				"Last-Modified": lastModified,
			},
		});
	} catch {
		return new Response('Not found', {
			status: 404,
			headers: corsHeaders,
		});
	}
}