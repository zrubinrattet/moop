import { Utils } from "electrobun/bun";
import { mkdirSync } from "node:fs";
import { getSettings, initSettings } from "./shared/settings";
import { setLocale } from "../lang/lang";
import { initServer } from "./server";


// prime the settings.json file on disk
// ensure the userData directory exists
mkdirSync(Utils.paths.userData, { recursive: true });

await initSettings();

// set the locale for the translations
setLocale(getSettings().language);

// start the bun server for bulk image upload & static image serving.
initServer();

// start the main window
import './mainWindow';

// start the application menu
import './applicationMenu';