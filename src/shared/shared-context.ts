import { createContext, Dispatch, SetStateAction } from "react";
import { Image } from "./shared-types";
type ApplicationSettings = {
	theme: 'auto' | 'light' | 'dark',
	quality: number,
	effort: number,
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
	zoom: 1,
	setZoom: () => {},
	quality: 80,
	setQuality: () => {},
	effort: 4,
	setEffort: () => {},
	crop: {
		x: 0,
		y : 0,
	},
	setCrop: () => {},
	setSettings: () => { },
	settings: {
		effort: 4,
		quality: 80,
		theme: 'auto'
	}
};

export const sharedContext = createContext(appContextDefaults);