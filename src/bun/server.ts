import imagesPost from "./routes/imagesPost";
import imagesGet from "./routes/imagesGet";
import corsHeaders from "./routes/corsHeaders";
let server: Bun.Server<undefined>;
export function initServer() {
	server = Bun.serve({
		port: 43117,
		routes: {
			// rest api to upload images
			'/images': {
				POST: imagesPost,
			},
			// rest api that serves filesystem images via URL
			'/images/*': imagesGet,
		},
		async fetch(req) {
			// CORS Preflight, 404 etc.
			if (req.method === "OPTIONS") {
				return new Response(null, {
					status: 204,
					headers: corsHeaders,
				});
			}
			return new Response('Not found', {
				status: 404,
				headers: corsHeaders,
			});
		},
	});
}
export function stopServer() {
	server.stop();
}