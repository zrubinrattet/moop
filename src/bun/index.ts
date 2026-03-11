import { BrowserWindow, Utils } from "electrobun/bun";

// Create the main application window
const mainWindow = new BrowserWindow({
	title: "moop",
	url: "views://mainview/index.html",
	frame: {
		width: 1200,
		height: 800,
		x: 200,
		y: 200,
	},
	titleBarStyle: "hidden",
});

mainWindow.webview.openDevTools();

// Quit the app when the main window is closed
mainWindow.on("close", () => {
	Utils.quit();
});

console.log("Moop Electrobun app started!");
