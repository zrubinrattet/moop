import { BrowserWindow, BrowserView, Utils, ApplicationMenu } from "electrobun/bun";
import { mkdirSync } from "node:fs";
import path from "node:path";
import Electrobun from "electrobun/bun";

import type { AppRPCSchema  } from '../shared/shared-types';
import { getSettings, initSettings } from "../shared/shared-settings";
import { setLocale, t } from "../mainview/lang/lang";
import pkg from "../../package.json" with { type: "json" };

import pollInputs from "./rpc/pollInputs";
import openFileDialog from "./rpc/openFileDialog";
import getSettingsRPC from "./rpc/getSettings";
import resetSettings from "./rpc/resetSettings";
import setSettingsRPC from "./rpc/setSettings";
import revealInFileManager from "./rpc/revealInFileManager";
import updateImage from "./rpc/updateImage";
import deleteImage from "./rpc/deleteImage";
import clearAll from "./rpc/clearAll";

import imagesPost from "./routes/imagesPost";
import imagesGet from "./routes/imagesGet";
import corsHeaders from "./routes/corsHeaders";


// prime the settings.json file on disk
// ensure the userData directory exists
mkdirSync(Utils.paths.userData, { recursive: true });

await initSettings();

// set the locale for the translations
setLocale(getSettings().language);


Bun.serve({
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

const rpc = BrowserView.defineRPC<AppRPCSchema>({
	maxRequestTime: 600000,
	handlers: {
		requests: {
			pollInputs,
			openFileDialog,
			getSettings: getSettingsRPC,
			resetSettings,
			setSettings: setSettingsRPC,
			revealInFileManager,
			updateImage,
			deleteImage,
			clearAll
		}
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


Electrobun.events.on("application-menu-clicked", (e) => {
	if (e.data.action === 'settings') {
		mainWindow.webview.rpc?.send.openSettings()
	}
	else if (e.data.action === 'about') {
		Utils.showMessageBox({
			type: 'info',
			title: '',
			message: `${t('version')}
			${pkg.version}
			
			${t('learnMore')} https://getmoop.app

			${t('madeWith')}`
		});
	}
});
// Quit the app when the main window is closed
mainWindow.on("close", () => {
	Utils.quit();
});