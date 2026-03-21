import { BrowserWindow, Utils, ApplicationMenu, BrowserView } from "electrobun/bun";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import type { AppRPCSchema } from "../rpc-schema";

let mainWindow: BrowserWindow;

const moopDirectoryKey = Date.now();

const rpc = BrowserView.defineRPC<AppRPCSchema>({
	handlers: {
		requests: {
			uploadImages: async (response) => {
				console.log(response.map(item => item.name));
				const imageDirectory = join(homedir(), "Pictures", `moop-${moopDirectoryKey}`);
				const inputDirectory = join(imageDirectory, 'input');
				const outputDirectory = join(imageDirectory, 'output');
				try {
					await mkdir(imageDirectory, { recursive: true });
					await mkdir(inputDirectory, { recursive: true });
					await mkdir(outputDirectory, { recursive: true });

					for (const image of response) {
						const inputPath = join(inputDirectory, image.name);
						const bytes = image.bytes instanceof Uint8Array ? image.bytes : new Uint8Array(Object.values(image.bytes));
						await writeFile(inputPath, bytes);
					}

				} catch (error) {
					console.log(error)
				}
				return {};
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
mainWindow = new BrowserWindow({
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
