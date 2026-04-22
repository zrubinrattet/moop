import { BrowserWindow, BrowserView, Utils, ApplicationMenu } from "electrobun/bun";
import { mkdir, readdir, stat, exists } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import Electrobun from "electrobun/bun";
import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { availableParallelism } from "node:os";
import path from "node:path";
import sharp from "sharp";

import type { APIResponseType, BaseResponseType, AppRPCSchema, Image, ProcessImageResponseType, ProcessImageTask, SettingsResponseType, OpenFileDialogResponseType, PollInputsResponseType } from '../shared/shared-types';
import { BaseResponse, APIResponse, ProcessImageResponse } from '../shared/shared-objects';
import { getImageDirectories } from '../shared/shared-directories';
import { convertImageURL } from '../shared/shared-funcs';
import { statSync } from "node:fs";
import { imageSizeFromFile } from "image-size/fromFile";
import { appContextDefaults } from "../shared/shared-context";
import { getSettings, initSettings, setSettings } from "../shared/shared-settings";
import { cp } from "node:fs/promises";
import { setLocale, t } from "../mainview/lang/lang";
import pkg from "../../package.json" with { type: "json" };


const APP_VERSION = pkg.version;


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
// const settingsPath = join(Utils.paths.userData, 'settings.json');

// async function settingsValidJSON() {
// 	try {
// 		await Bun.file(settingsPath).json();
// 		return true;
// 	} catch {
// 		return false;
// 	}
// }

// if (
// 	// if the settings file doesn't exist
// 	!await Bun.file(settingsPath).exists()
// 	||
// 	// file does exist but got corrupted
// 	(
// 		await Bun.file(settingsPath).exists()
// 		&&
// 		await !settingsValidJSON()
// 	)
// ) {
// 	// Write a settings file based on the defaults we got in-app.
// 	await Bun.write(settingsPath, JSON.stringify({ ...appContextDefaults.settings, ...{ outputFolder: '' } }));
// }

// const appSettings: ApplicationSettingsType = await Bun.file(settingsPath).json();

// console.log('app settings loaded: ', appSettings)

await initSettings();

setLocale(getSettings().language);

// const { rootDirectory, imageDirectory, inputDirectory, outputDirectory } = getImageDirectories();

Bun.serve({
	port: 3000,
	routes: {
		// rest api to upload images
		'/images': {
			POST: async (req) => {
				const { imageDirectory, inputDirectory, outputDirectory } = getImageDirectories();
				const ret: APIResponseType = APIResponse;
				const appSettings = getSettings();

				const form = await req.formData();
				const image = form.get('image');

				let ok = true;

				if (!(image instanceof File)) {
					return new Response('Missing file', {
						status: 400,
						headers: corsHeaders,
					});
				}

				const allowedTypes = ['image/jpeg',
					'image/png',
					'image/webp',
					'image/tiff',
					'image/gif',
					'image/svg+xml',
					'image/avif'];

				if (!allowedTypes.find(entry => entry === image.type)) {
					return new Response('Incorrect file type', {
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
					const outputPath = join(outputDirectory, `${path.parse(image.name).name}.${appSettings.outputFormat}`);

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
							effort: appSettings.effort,
							quality: appSettings.quality,
							outputFormat: appSettings.outputFormat
						};

						ret.images = [image];
						ret.inputFolderSize = await dirSize(inputDirectory);
						ret.outputFolderSize = await dirSize(outputDirectory);
					}
					else {
						ret.message = t('updateImageError');
						ret.severity = 'ERROR';
						ok = false;
					}

				} catch (error) {
					if (error instanceof Error) {
						ret.message = error.message;
					}
					else {
						ret.message = t('unknownError');
					}

					ret.severity = 'ERROR';
				}

				return Response.json(
					{ ok: ok, data: ret },
					{ headers: corsHeaders }
				);
			},
		},
		// rest api that serves filesystem images via URL
		'/images/*': req => {
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
	const { outputDirectory } = getImageDirectories();
	const appSettings = getSettings();

	const parsed = path.parse(arg.path);
	const outputFormat = arg.outputFormat?.toLowerCase() || appSettings.outputFormat || 'webp';
	const outputPath = join(outputDirectory, `${parsed.name}.${outputFormat}`);

	const resized = sharp(arg.path, {
		density: 72,
		animated: outputFormat === 'jpeg' ? false : true,
	}).resize({
		width: Number(appSettings.maxWidth) ? Number(appSettings.maxWidth) : undefined,
		height: Number(appSettings.maxHeight) ? Number(appSettings.maxHeight) : undefined,
		withoutEnlargement: true
	})

	if (outputFormat === 'webp') {
		await resized.webp({
			quality: Number(arg.quality) || Number(appSettings.quality),
			effort: Number(arg.effort) || Number(appSettings.effort),
		}).toFile(outputPath);
	}
	else if (outputFormat === 'png') {
		await resized.png({
			quality: Number(arg.quality) || Number(appSettings.quality),
			effort: Number(arg.effort) || Number(appSettings.effort),
		}).toFile(outputPath);
	}
	else if (outputFormat === 'jpeg') {
		await resized.jpeg({
			quality: Number(arg.quality) || Number(appSettings.quality)
		}).toFile(outputPath);
	}
}



const rpc = BrowserView.defineRPC<AppRPCSchema>({
	maxRequestTime: 30000,
	handlers: {
		requests: {
			pollInputs: async () => {
				const { inputDirectory } = getImageDirectories();
				const inputPaths: Array<string> = []
				const ret: PollInputsResponseType = {
					...{ ...BaseResponse }, inputPaths
				}
				try {
					const glob = new Bun.Glob("**/*");

					// Get absolute paths for all files in a specific directory
					const inputPaths = await Array.fromAsync(
						glob.scan({
							cwd: inputDirectory,
							absolute: true,
							onlyFiles: true
						})
					);

					ret.inputPaths = inputPaths.map(inputPath => convertImageURL({ url: inputPath, type: 'absolutetolocal' }));
					ret.message = 'Found inputs'
				} catch (error) {

					if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
						ret.message = 'Folder does not exist yet';
					}
				}
				return ret;
			},
			openFileDialog: async () => {
				const res = await Utils.openFileDialog({
					canChooseDirectory: true,
					canChooseFiles: false,
					allowsMultipleSelection: false,
					startingFolder: Utils.paths.pictures,
				});
				const ret: OpenFileDialogResponseType = { ...BaseResponse, ...{ path: res[0] } };
				return ret;
			},
			getSettings: async () => {
				const base: SettingsResponseType = {
					...{ ...BaseResponse }, ...appContextDefaults.settings,
				}
				const loadedSettings = getSettings();

				return { ...base, ...loadedSettings };
			},
			resetSettings: async () => {
				const ret: SettingsResponseType = {
					...{ ...BaseResponse }, ...appContextDefaults.settings,
				}

				setSettings({ ...appContextDefaults.settings, ...{ outputFolder: '' } })

				const newSettings = await getSettings();

				return { ...ret, ...newSettings };
			},
			setSettings: async (props) => {
				const ret: SettingsResponseType = {
					...{ ...BaseResponse }, ...appContextDefaults.settings,
				}
				const loadedSettings = getSettings();
				const newSettings = { ...loadedSettings, ...props };
				console.log('newsettings: ', newSettings)
				console.log(ret)

				const oldImageDirectory = getImageDirectories().imageDirectory;

				await setSettings(newSettings);
				setLocale(newSettings.language);

				const newImageDirectory = getImageDirectories().imageDirectory;
				console.log(oldImageDirectory, newImageDirectory)
				if (await exists(oldImageDirectory) && oldImageDirectory !== newImageDirectory) {
					await cp(oldImageDirectory, newImageDirectory, { recursive: true });
				}

				return { ...ret, ...newSettings };
			},
			revealInFileManager: async (props) => {
				const { imageDirectory } = getImageDirectories();
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
						ret.message = t('unknownError');
					}

					ret.severity = 'ERROR';
				}
				return ret;
			},
			updateImage: async (params) => {
				const { outputDirectory } = getImageDirectories();
				const { quality, effort, outputFormat } = params;
				const appSettings = getSettings();

				if (quality === undefined || effort === undefined) {

					const ret: ProcessImageResponseType = {
						...{ ...ProcessImageResponse },
						message: 'No update',
						severity: 'WARNING'
					};

					return ret;
				}

				const ret: ProcessImageResponseType = {
					...{ ...ProcessImageResponse },
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
					outputFormat: outputFormat
				}).then(async () => {
					ret.message = t('updateImageSuccess');

					const outputPath = join(outputDirectory, `${path.parse(inputPath).name}.${outputFormat?.toLowerCase() || 'webp'}`);
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
						isActive: false,
						effort: effort || appSettings.effort,
						quality: quality || appSettings.quality,
						outputFormat: outputFormat || appSettings.outputFormat,
					};
				}).catch((err) => {
					console.error(err)
					ret.message = t('updateImageError');
					ret.severity = 'ERROR';
				})
				console.log('Ret', ret)
				return ret;
			},
			deleteImage: async (params) => {
				const { outputDirectory } = getImageDirectories();
				const { response } = await Utils.showMessageBox({
					type: "question",
					title: t('confirmDeleteImageTitle'),
					message: t('confirmDeleteImageMessage'),
					detail: t('confirmDeleteImageDetail'),
					buttons: [t('confirmDeleteImageButton0'), t('confirmDeleteImageButton1')],
					defaultId: 1,  // Focus "Cancel" by default
					cancelId: 1    // Pressing Escape returns 1 (Cancel)
				});

				if (response === 0) {
					// User clicked "Delete"
					console.log("Deleting file...");
					const ret: ProcessImageResponseType = { ...ProcessImageResponse };
					const inputPath = convertImageURL({
						url: params.path,
						type: 'localtoabsolute',
					});
					const outputPath = join(outputDirectory, `${path.parse(inputPath).name}.webp`);
					const outputPathPng = join(outputDirectory, `${path.parse(inputPath).name}.png`);
					const outputPathJpeg = join(outputDirectory, `${path.parse(inputPath).name}.jpeg`);
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
					const outputPngTrashSuccessful = await exists(outputPathPng) ? Utils.moveToTrash(outputPathPng) : true;
					const outputJpegTrashSuccessful = await exists(outputPathPng) ? Utils.moveToTrash(outputPathJpeg) : true;

					if (inputTrashSuccessful && outputTrashSuccessful && outputJpegTrashSuccessful && outputPngTrashSuccessful) {
						ret.message = t('deleteImageSuccess');
					}
					else {
						ret.message = t('deleteImageError');
						ret.severity = 'ERROR';
					}

					return ret;
				} else {
					// user clicked cancel or closed the dialog
					console.log("Cancelled");
					return { ...BaseResponse, message: 'Cancelled delete' };
				}
			},
			clearAll: async () => {
				const { inputDirectory, outputDirectory } = getImageDirectories();
				const ret = { ...BaseResponse };

				const { response } = await Utils.showMessageBox({
					type: "question",
					title: t('confirmClearAllTitle'),
					message: t('confirmClearAllMessage'),
					detail: t('confirmClearAllDetail'),
					buttons: [t('confirmClearButton0'), t('confirmClearButton1')],
					// Focus on the cancel button by default
					defaultId: 1,
					// Pressing Escape returns 1 (Cancel)
					cancelId: 1
				});

				// if clear all was pressed
				if (response === 0) {
					try {
						Utils.moveToTrash(inputDirectory);
						Utils.moveToTrash(outputDirectory);
						await mkdir(inputDirectory, { recursive: true });
						await mkdir(outputDirectory, { recursive: true });
						const inputFiles = await readdir(inputDirectory);
						const outputFiles = await readdir(outputDirectory);

						if (inputFiles.length === 0 && outputFiles.length === 0) {
							ret.message = t('deleteImagesSuccess');
						}
					} catch {
						ret.message = t('deleteImagesError');
						ret.severity = 'ERROR';
					}
				}
				else {
					ret.message = t('deleteImagesCancel');
					ret.severity = 'WARNING';
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
			{ label: t('about'), action: "about" },
			{ label: t('settings'), action: "settings", accelerator: ',' },
			{ label: t('quit'), role: "quit", accelerator: 'q' }
		],
	}
]);

// prevent too small screen
const MIN_WIDTH = 1200;
const MIN_HEIGHT = 800;

// Create the main application window
const mainWindow = new BrowserWindow({
	title: "moop",
	url: "views://mainview/index.html",
	frame: {
		width: MIN_WIDTH,
		height: MIN_HEIGHT,
		x: 200,
		y: 200,
	},
	rpc: rpc
});


mainWindow.on("resize", () => {
	const { width, height } = mainWindow.getSize();

	if (width < MIN_WIDTH || height < MIN_HEIGHT) {
		mainWindow.setSize(
			Math.max(width, MIN_WIDTH),
			Math.max(height, MIN_HEIGHT)
		);
	}
});

// crack open dev tools only for dev channel
const appChannel = path.basename(Utils.paths.userData);
if (appChannel === "dev") {
	mainWindow.webview.openDevTools();
}

// mainWindow.webview.on("will-navigate", (event) => {
// 	console.log("webview will-navigate", event);
// });

// mainWindow.webview.on("did-navigate", (event) => {
// 	console.log("webview did-navigate", event);
// });

// mainWindow.webview.on("did-commit-navigation", (event) => {
// 	console.log("webview did-commit-navigation", event);
// });
Electrobun.events.on("application-menu-clicked", (e) => {
	console.log("application menu clicked", e.data.action);
	if (e.data.action === 'settings') {
		mainWindow.webview.rpc?.send.openSettings()
	}
	else if (e.data.action === 'about') {
		Utils.showMessageBox({
			type: 'info',
			title: '',
			message: `Version
			${APP_VERSION}
			
			Learn more at https://getmoop.app

			Made with 💜 in Oakland, CA.`
		});
	}
});
// Quit the app when the main window is closed
mainWindow.on("close", () => {
	Utils.quit();
});

console.log("Moop Electrobun app started!");
