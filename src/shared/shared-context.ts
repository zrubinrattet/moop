import { createContext, Dispatch, SetStateAction } from "react";
import { Image, ApplicationSettingsType } from "./shared-types";

type Crop = {
	x: number,
	y: number,
}
type ApplicationState = {
	settings: ApplicationSettingsType,
	setSettings: Dispatch<SetStateAction<ApplicationSettingsType>>,
	images: Array<Image>,
	setImages: Dispatch<SetStateAction<Array<Image>>>,
	inputFolderSize: number,
	setInputFolderSize: Dispatch<SetStateAction<number>>,
	outputFolderSize: number,
	setOutputFolderSize: Dispatch<SetStateAction<number>>,
	imagesLoading: boolean,
	setImagesLoading: Dispatch<SetStateAction<boolean>>,
	imagesProcessing: Array<string>,
	setImagesProcessing: Dispatch<SetStateAction<Array<string>>>,
	crop: Crop,
	setCrop: Dispatch<SetStateAction<Crop>>
	zoom: number,
	setZoom: Dispatch<SetStateAction<number>>
	quality: number,
	setQuality: Dispatch<SetStateAction<number>>
	effort: number,
	setEffort: Dispatch<SetStateAction<number>>
};

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
	effort: 4,
	setQuality: () => { },
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
		language: 'en-US',
		outputFormat: 'webp'
	}
};

export const sharedContext = createContext(appContextDefaults);