import { BrowserWindow, BrowserView, Utils, ApplicationMenu } from "electrobun/bun";
import { mkdir, readdir, stat } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { availableParallelism } from "node:os";
import path from "node:path";
import sharp from "sharp";

import type { APIResponseType, BaseResponseType, AppRPCSchema, Image, ProcessImageResponseType, ProcessImageTask, SettingsResponseType, ApplicationSettingsType } from '../shared/shared-types';
import { BaseResponse, APIResponse, ProcessImageResponse } from '../shared/shared-objects';
import { getImageDirectories } from '../shared/shared-directories';
import { convertImageURL } from '../shared/shared-funcs';
import { statSync } from "node:fs";
import { imageSizeFromFile } from "image-size/fromFile";
import { appContextDefaults } from "../shared/shared-context";
import { rm } from "node:fs/promises";

const { rootDirectory, imageDirectory, inputDirectory, outputDirectory } = getImageDirectories();

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


// prime the settings.json file on disk
// ensure the userData directory exists
mkdirSync(Utils.paths.userData, { recursive: true });
// establish settings file
const settingsPath = join(Utils.paths.userData, 'settings.json');

// if the settings file doesn't exist
if (!await Bun.file(settingsPath).exists()) {
	// Write a settings file based on the defaults we got in-app.
	await Bun.write(settingsPath, JSON.stringify({ ...appContextDefaults.settings, ...{ outputFolder: rootDirectory } }));
}

const appSettings: ApplicationSettingsType = await Bun.file(settingsPath).json();



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
							output: `${convertImageURL({ url: outputPath, type: 'absolutetolocal' })}?v=${statSync(outputPath).mtimeMs}`,
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
		width: appSettings.maxWidth ? appSettings.maxWidth : undefined,
		withoutEnlargement: true
	}).webp({
		quality: arg.quality || appContextDefaults.settings.quality,
		effort: arg.effort || appContextDefaults.settings.effort,
	}).toFile(outputPath);
}



const rpc = BrowserView.defineRPC<AppRPCSchema>({
	maxRequestTime: 30000,
	handlers: {
		requests: {
			getSettings: async () => {
				const base: SettingsResponseType = {
					...BaseResponse, ...appContextDefaults.settings,
				}
				const loadedSettings = await Bun.file(settingsPath).json();

				return { ...base, ...loadedSettings };
			},
			resetSettings: async () => {
				const ret: SettingsResponseType = {
					...BaseResponse, ...appContextDefaults.settings,
				}

				await Bun.write(settingsPath, JSON.stringify({ ...appContextDefaults.settings, ...{ outputFolder: rootDirectory } }));

				const newSettings = await Bun.file(settingsPath).json();

				return { ...ret, ...newSettings };
			},
			setSettings: async (props) => {
				const ret: SettingsResponseType = {
					...BaseResponse, ...appContextDefaults.settings,
				}

				const loadedSettings = await Bun.file(settingsPath).json();
				const newSettings = { ...loadedSettings, ...props };
				await Bun.write(settingsPath, newSettings);

				return { ...ret, ...newSettings };
			},
			revealInFileManager: async (props) => {
				// init response
				const ret: BaseResponseType = BaseResponse;

				try {
					Utils.showItemInFolder(typeof props?.path === 'undefined' ? imageDirectory : convertImageURL({
						url: props.path,
						type: 'localtoabsolute'
					}));
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

				const { quality, effort } = params;

				if (quality === undefined || effort === undefined) {

					const ret: ProcessImageResponseType = {
						...ProcessImageResponse,
						message: 'No update',
						severity: 'WARNING'
					};

					return ret;
				}

				const ret: ProcessImageResponseType = {
					...ProcessImageResponse,
					image: {
						...ProcessImageResponse.image,
						effort,
						quality,
					},
				};

				const inputPath = convertImageURL({
					url: params.path,
					type: 'localtoabsolute',
				});


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
						output: `${convertImageURL({ url: outputPath, type: 'absolutetolocal' })}?v=${statSync(outputPath).mtimeMs}`,
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
			deleteImage: async (params) => {
				const { response } = await Utils.showMessageBox({
					type: "question",
					title: "Confirm Delete",
					message: "Are you sure you want to delete this file?",
					detail: "This action cannot be undone.",
					buttons: ["Delete", "Cancel"],
					defaultId: 1,  // Focus "Cancel" by default
					cancelId: 1    // Pressing Escape returns 1 (Cancel)
				});

				if (response === 0) {
					// User clicked "Delete"
					console.log("Deleting file...");
					const ret: ProcessImageResponseType = ProcessImageResponse;
					const inputPath = convertImageURL({
						url: params.path,
						type: 'localtoabsolute',
					});
					const outputPath = join(outputDirectory, `${path.parse(inputPath).name}.webp`);
					const inputResolution = await imageSizeFromFile(inputPath);
					const outputResolution = await imageSizeFromFile(outputPath);
					const image = {
						input: convertImageURL({ url: inputPath, type: 'absolutetolocal' }),
						inputSizeBytes: statSync(inputPath).size,
						inputResolution: {
							width: inputResolution.width,
							height: inputResolution.height,
						},
						output: `${convertImageURL({ url: outputPath, type: 'absolutetolocal' })}?v=${statSync(outputPath).mtimeMs}`,
						outputSizeBytes: statSync(outputPath).size,
						outputResolution: {
							width: outputResolution.width,
							height: outputResolution.height,
						},
						isActive: true,
					}
					ret.image = { ...ProcessImageResponse.image, ...image };

					const inputTrashSuccessful = Utils.moveToTrash(inputPath)
					const outputTrashSuccessful = Utils.moveToTrash(outputPath)

					if (inputTrashSuccessful && outputTrashSuccessful) {
						ret.message = 'Successfully deleted image';
					}
					else {
						ret.message = 'Could not delete image';
						ret.severity = 'ERROR';
					}

					return ret;
				} else {
					// User clicked "Cancel" or closed the dialog
					console.log("Cancelled");
					return { ...BaseResponse, message: 'Cancelled delete' };
				}
			},
			clearAll: async () => {
				const ret = BaseResponse;

				const { response } = await Utils.showMessageBox({
					type: "question",
					title: "Confirm clear all",
					message: "Are you sure you want to delete all images?",
					detail: "This action cannot be undone.",
					buttons: ["Clear all", "Cancel"],
					defaultId: 1,  // Focus "Cancel" by default
					cancelId: 1    // Pressing Escape returns 1 (Cancel)
				});
				if (response === 0) {
					try {
						// await rm(inputDirectory, { recursive: true, force: true });
						// await rm(outputDirectory, { recursive: true, force: true });
						Utils.moveToTrash(inputDirectory);
						Utils.moveToTrash(outputDirectory);
						await mkdir(inputDirectory, { recursive: true });
						await mkdir(outputDirectory, { recursive: true });
						const [inputFiles, outputFiles] = await Promise.all([
							readdir(inputDirectory),
							readdir(outputDirectory),
						]);
						if (inputFiles.length === 0 && outputFiles.length === 0) {
							ret.message = 'All images deleted successfully';
						}
					} catch {
						ret.message = 'There was an error';
						ret.severity = 'ERROR';
					}
				}
				else {
					ret.message = 'Cancelled clear all';
				}
				console.log('returning: ', ret);
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

// prevent too small screen
const MIN_WIDTH = 1200;
const MIN_HEIGHT = 800;

mainWindow.on("resize", () => {
	const { width, height } = mainWindow.getSize();

	if (width < MIN_WIDTH || height < MIN_HEIGHT) {
		mainWindow.setSize(
			Math.max(width, MIN_WIDTH),
			Math.max(height, MIN_HEIGHT)
		);
	}
});

// crack open dev tools
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
