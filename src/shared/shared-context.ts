import { createContext, Dispatch, SetStateAction } from "react";
import { Image } from "./shared-types";

type ApplicationState = {
	settings: {
		theme: 'auto' | 'light' | 'dark',
		defaultQuality: number,
		defaultEffort: number,
	},
	images: Array<Image>,
	setImages: Dispatch<SetStateAction<Array<Image>>>,
	activeImage: Image,
	setActiveImage: Dispatch<SetStateAction<Image>>,
	inputFolderSize: number,
	setInputFolderSize: Dispatch<SetStateAction<number>>,
	outputFolderSize: number,
	setOutputFolderSize: Dispatch<SetStateAction<number>>,
};

export const appContextDefaults: ApplicationState = {
	setOutputFolderSize: () => { },
	outputFolderSize: 0,
	setInputFolderSize: () => { },
	inputFolderSize: 0,
	setImages: () => { },
	images: [],
	setActiveImage: () => { },
	activeImage: {
		output: '',
		input: '',
		inputSizeBytes: 0,
		outputSizeBytes: 0,
	},
	settings: {
		defaultEffort: 4,
		defaultQuality: 75,
		theme: 'auto'
	}
};

export const sharedContext = createContext(appContextDefaults);