import { createContext, Dispatch, SetStateAction } from "react";
import { Image } from "./shared-types";
type ApplicationSettings = {
	theme: 'auto' | 'light' | 'dark',
	defaultQuality: number,
	defaultEffort: number,
}
type Crop = {
	x : number,
	y: number,
}
type ApplicationState = {
	settings: ApplicationSettings,
	setSettings: Dispatch<SetStateAction<ApplicationSettings>>,
	images: Array<Image>,
	setImages: Dispatch<SetStateAction<Array<Image>>>,
	activeImage: Image,
	setActiveImage: Dispatch<SetStateAction<Image>>,
	inputFolderSize: number,
	setInputFolderSize: Dispatch<SetStateAction<number>>,
	outputFolderSize: number,
	setOutputFolderSize: Dispatch<SetStateAction<number>>,
	imagesLoading: boolean,
	setImagesLoading: Dispatch<SetStateAction<boolean>>,
	crop: Crop,
	setCrop: Dispatch<SetStateAction<Crop>>
	zoom: number,
	setZoom: Dispatch<SetStateAction<number>>
};

export const appContextDefaults: ApplicationState = {
	setOutputFolderSize: () => { },
	outputFolderSize: 0,
	setInputFolderSize: () => { },
	inputFolderSize: 0,
	setImages: () => { },
	images: [],
	setActiveImage: () => { },
	imagesLoading: false,
	setImagesLoading: () => { },
	activeImage: {
		output: '',
		input: '',
		inputSizeBytes: 0,
		outputSizeBytes: 0,
	},
	zoom: 1,
	setZoom: () => {},
	crop: {
		x: 0,
		y : 0,
	},
	setCrop: () => {},
	setSettings: () => { },
	settings: {
		defaultEffort: 4,
		defaultQuality: 75,
		theme: 'auto'
	}
};

export const sharedContext = createContext(appContextDefaults);