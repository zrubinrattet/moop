import { BrowserWindow, BrowserView, Utils, ApplicationMenu } from "electrobun/bun";
import { mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { availableParallelism } from "node:os";
import path from "node:path";
import sharp from "sharp";
// import { Glob } from "bun";

import type { APIResponseType, BaseResponseType, AppRPCSchema, Image } from '../shared/shared-types';
import { BaseResponse, APIResponse } from '../shared/shared-objects';
import { getImageDirectories } from '../shared/shared-directories';
import { convertImageURL } from '../shared/shared-funcs';
import { statSync } from "node:fs";

const { imageDirectory, inputDirectory, outputDirectory } = getImageDirectories();

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

const dirSize = async (directory: string) => {
	const files = await readdir(directory);
	const stats = files.map(file => stat(path.join(directory, file)));

	return (await Promise.all(stats)).reduce((accumulator, { size }) => accumulator + size, 0);
}

Bun.serve({
	port: 3000,
	routes: {
		'/images/*': req => {
			const url = new URL(req.url);
			const basename = decodeURIComponent(url.pathname.slice("/images/".length));
			const imagePath = join(imageDirectory, basename);
			let imageStats;
			try {
				imageStats = statSync(imagePath);

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

		},
	},
	async fetch(req) {

		// console.log(req)

		const ret: APIResponseType = APIResponse;

		const url = new URL(req.url);

		// console.log(url)

		if (req.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: corsHeaders,
			});
		}

		if (req.method === "POST" && url.pathname === "/upload") {

			const form = await req.formData();
			const image = form.get('image');

			if (!(image instanceof File)) {
				return new Response('Missing file', {
					status: 400,
					headers: corsHeaders,
				});
			}



			try {

				// make the dirs
				await mkdir(imageDirectory, { recursive: true });
				await mkdir(inputDirectory, { recursive: true });
				await mkdir(outputDirectory, { recursive: true });

				// add the file to the queue for processing
				const inputPath = join(inputDirectory, image.name);
				const bytes = await image.bytes();
				await Bun.write(inputPath, bytes);
				await queue.push({ path: inputPath }).catch((err) => {
					console.error(err)
				})

				// check if the output file got made
				const outputPath = join(outputDirectory, `${path.parse(image.name).name}.webp`);

				if (await Bun.file(outputPath).exists()) {
					ret.message = `Successfully processed image.`;
					const image: Image = {
						input: convertImageURL({ url: inputPath, type: 'absolutetolocal' }),
						inputSizeBytes: statSync(inputPath).size,
						output: convertImageURL({ url: outputPath, type: 'absolutetolocal' }),
						outputSizeBytes: statSync(outputPath).size,
					};

					ret.images = [image];
					ret.inputFolderSize = await dirSize(inputDirectory);
					ret.outputFolderSize = await dirSize(outputDirectory);
				}
				else {
					ret.message = `Could not process image.`;
					ret.severity = 'ERROR';
				}

			} catch (error) {
				if (error instanceof Error) {
					ret.message = error.message;
				}
				else {
					ret.message = 'Unknown error occurred.';
				}

				ret.severity = 'ERROR';
			}

			return Response.json(
				{ ok: true, data: ret },
				{ headers: corsHeaders }
			);
		}

		// if (req.method === 'GET' && url.pathname === '/images') {
		// 	// do a dirscan for the affected files
		// 	const glob = new Glob('*/**');

		// 	const inputs: Record<string, string> = {};
		// 	const outputs: Record<string, string> = {};

		// 	for await (const file of glob.scan(imageDirectory)) {
		// 		const parsed = path.parse(file);

		// 		if (file.startsWith("input/")) {
		// 			inputs[parsed.name] = file;
		// 		}

		// 		if (file.startsWith("output/")) {
		// 			outputs[parsed.name] = file;
		// 		}
		// 	}


		// 	for (const name of Object.keys(inputs)) {
		// 		const inputFile = join(imageDirectory, inputs[name]);
		// 		const outputFile = join(imageDirectory, outputs[name]);

		// 		if (!inputFile || !outputFile) continue;
		// 		ret.images[inputFile] = outputFile;
		// 	}
		// }

		return new Response('Not found', {
			status: 404,
			headers: corsHeaders,
		});
	},
});

const concurrency = availableParallelism();

type ProcessImageTask = {
	path: string
}

const queue: queueAsPromised<ProcessImageTask> = fastq.promise(processImage, concurrency);


async function processImage(arg: ProcessImageTask): Promise<void> {
	// No need for a try-catch block, fastq handles errors automatically
	// console.log('fastq worker: ', arg.path)
	const parsed = path.parse(arg.path);
	const outputPath = join(outputDirectory, `${parsed.name}.webp`);

	await sharp(arg.path, {
		density: 72,
		animated: true,
	}).resize({
		width: 2400,
		withoutEnlargement: true
	}).webp({
		quality: 75,
	}).toFile(outputPath);

}



const rpc = BrowserView.defineRPC<AppRPCSchema>({
	maxRequestTime: 30000,
	handlers: {
		requests: {
			revealInFileManager: async () => {
				console.log('revealInFileManager');
				// init response
				const ret: BaseResponseType = BaseResponse;
				try {
					Utils.showItemInFolder(imageDirectory);
					ret.message = 'Opened images folder';
				} catch (error) {
					if (error instanceof Error) {
						ret.message = error.message;
					}
					else {
						ret.message = 'Unknown error occurred.';
					}

					ret.severity = 'ERROR';
				}
				return ret;
			}
		},
	},
});

ApplicationMenu.setApplicationMenu([
	{
		submenu: [
			{ label: "Settings", action: "settings", accelerator: ',' },
			{ label: "Quit", role: "quit", accelerator: 'q' }
		],
	}
]);




// Create the main application window
const mainWindow: BrowserWindow = new BrowserWindow({
	title: "moop",
	url: "views://mainview/index.html",
	frame: {
		width: 1200,
		height: 800,
		x: 200,
		y: 200,
	},
	rpc: rpc
});

mainWindow.webview.openDevTools();

// mainWindow.webview.on("will-navigate", (event) => {
// 	console.log("webview will-navigate", event);
// });

// mainWindow.webview.on("did-navigate", (event) => {
// 	console.log("webview did-navigate", event);
// });

// mainWindow.webview.on("did-commit-navigation", (event) => {
// 	console.log("webview did-commit-navigation", event);
// });
// Electrobun.events.on("application-menu-clicked", (e) => {
// 	console.log("application menu clicked", e.data.action);
// });
// Quit the app when the main window is closed
mainWindow.on("close", () => {
	Utils.quit();
});

console.log("Moop Electrobun app started!");
