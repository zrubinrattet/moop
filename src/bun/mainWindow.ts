import { BrowserWindow, BrowserView, Utils } from "electrobun/bun";
import type { AppRPCSchema } from "../shared/types";
import pollInputs from "./rpc/pollInputs";
import openFileDialog from "./rpc/openFileDialog";
import getSettingsRPC from "./rpc/getSettings";
import resetSettings from "./rpc/resetSettings";
import setSettingsRPC from "./rpc/setSettings";
import revealInFileManager from "./rpc/revealInFileManager";
import updateImage from "./rpc/updateImage";
import deleteImage from "./rpc/deleteImage";
import clearAll from "./rpc/clearAll";
import path from "node:path";

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

// prevent too small screen
const MIN_WIDTH = 1200;
const MIN_HEIGHT = 800;

// create the main application window
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

export function getMainWindow(){
	return mainWindow;
}