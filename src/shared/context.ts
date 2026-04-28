import type { ApplicationState } from "./types";

export const appContextDefaults: ApplicationState = {
	setOutputFolderSize: () => { },
	outputFolderSize: 0,
	setInputFolderSize: () => { },
	inputFolderSize: 0,
	setImages: () => { },
	images: [],
	imagesLoading: false,
	setImagesLoading: () => { },
	imagesProcessing: [],
	setImagesProcessing: () => { },
	zoom: 1,
	setZoom: () => { },
	// quality & effort are used for the UI, not an app-settings representation
	quality: 80,
	setQuality: () => { },
	effort: 4,
	setEffort: () => { },
	crop: {
		x: 0,
		y: 0,
	},
	setCrop: () => { },
	setSettings: () => { },
	settings: {
		effort: 4,
		quality: 80,
		theme: 'auto',
		// if 0, no resizing.
		maxWidth: 2400,
		// if 0, no resizing.
		maxHeight: 0,
		outputFolder: '',
		language: 'en',
		outputFormat: 'webp'
	}
};