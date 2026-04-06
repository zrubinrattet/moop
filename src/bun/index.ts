import { BrowserWindow, BrowserView, Utils, ApplicationMenu } from "electrobun/bun";
import { mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { availableParallelism } from "node:os";
import path from "node:path";
import sharp from "sharp";

import type { APIResponseType, BaseResponseType, AppRPCSchema, Image, UpdateImageResponseType, ProcessImageTask } from '../shared/shared-types';
import { BaseResponse, APIResponse } from '../shared/shared-objects';
import { getImageDirectories } from '../shared/shared-directories';
import { convertImageURL } from '../shared/shared-funcs';
import { statSync } from "node:fs";
import { imageSizeFromFile } from "image-size/fromFile";
import { appContextDefaults } from "../shared/shared-context";

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
		// rest api to upload images
		'/images': {
			POST: async (req) => {
				const ret: APIResponseType = APIResponse;

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

						const inputResolution = await imageSizeFromFile(inputPath);
						const outputResolution = await imageSizeFromFile(outputPath);

						const image: Image = {
							input: convertImageURL({ url: inputPath, type: 'absolutetolocal' }),
							inputSizeBytes: statSync(inputPath).size,
							inputResolution: {
								width: inputResolution.width,
								height: inputResolution.height,
							},
							output: convertImageURL({ url: outputPath, type: 'absolutetolocal' }),
							outputSizeBytes: statSync(outputPath).size,
							outputResolution: {
								width: outputResolution.width,
								height: outputResolution.height,
							},
							isActive: false,
							effort: appContextDefaults.settings.effort,
							quality: appContextDefaults.settings.quality,
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
			},
		},
		// rest api that serves filesystem images via URL
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

const concurrency = availableParallelism();



const queue: queueAsPromised<ProcessImageTask> = fastq.promise(processImage, concurrency);


async function processImage(arg: ProcessImageTask): Promise<void> {
	// No need for a try-catch block, fastq handles errors automatically
	const parsed = path.parse(arg.path);
	const outputPath = join(outputDirectory, `${parsed.name}.webp`);

	// webp's quality/effort defaults are 80/4
	await sharp(arg.path, {
		density: 72,
		animated: true,
	}).resize({
		width: 2400,
		withoutEnlargement: true
	}).webp({
		quality:  arg.quality || appContextDefaults.settings.quality,
		effort: arg.effort || appContextDefaults.settings.effort,
	}).toFile(outputPath);
}



const rpc = BrowserView.defineRPC<AppRPCSchema>({
	maxRequestTime: 30000,
	handlers: {
		requests: {
			revealInFileManager: async () => {
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
			},
			updateImage: async (params) => {
				const ret: UpdateImageResponseType = {
					...BaseResponse, image: {
						input: '',
						output: '',
						inputSizeBytes: 0,
						outputSizeBytes: 0,
						inputResolution: {
							width: 0,
							height: 0,
						},
						outputResolution: {
							width: 0,
							height: 0,
						},
						isActive: false,
						effort: appContextDefaults.settings.effort,
						quality: appContextDefaults.settings.quality,
					}
				};

				const inputPath = convertImageURL({
					url: params.path,
					type: 'localtoabsolute',
				});

				const { quality, effort } = params;

				await queue.push({
					path: inputPath,
					quality: quality,
					effort: effort,
				}).then(async () => {
					ret.message = `Successfully processed image.`;

					const outputPath = join(outputDirectory, `${path.parse(inputPath).name}.webp`);
					const inputResolution = await imageSizeFromFile(inputPath);
					const outputResolution = await imageSizeFromFile(outputPath);

					ret.image = {
						input: convertImageURL({ url: inputPath, type: 'absolutetolocal' }),
						inputSizeBytes: statSync(inputPath).size,
						inputResolution: {
							width: inputResolution.width,
							height: inputResolution.height,
						},
						output: convertImageURL({ url: outputPath, type: 'absolutetolocal' }),
						outputSizeBytes: statSync(outputPath).size,
						outputResolution: {
							width: outputResolution.width,
							height: outputResolution.height,
						},
						isActive: true,
						effort: effort || appContextDefaults.settings.effort,
						quality: quality || appContextDefaults.settings.quality,
					};
				}).catch((err) => {
					console.error(err)
					ret.message = 'Error processing image';
					ret.severity = 'ERROR';
				})

				return ret;
			},
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
