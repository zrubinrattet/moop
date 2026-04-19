import type { RPCSchema } from "electrobun/bun";
export type AvailableThemes = 'auto' | 'light' | 'dark';
export type AvailableLangs = 'en' | 'es';
export type ApplicationSettingsType = {
	theme: AvailableThemes,
	quality: number,
	effort: number,
	// note set to 0 means no resizing
	maxWidth: number,
	// note set to 0 means no resizing
	maxHeight: number,
	// will eventually support custom root output folder
	// if blank, use Utils.paths.pictures
	outputFolder: string,
	// multiple langs supported
	language: AvailableLangs,
	// will eventually support multiple output formats
	outputFormat: 'webp' | 'jpeg' | 'png';
}
export type Image = {
	input: string,
	output: string,
	inputSizeBytes: number,
	outputSizeBytes: number,
	inputResolution: {
		width: number,
		height: number,
	},
	outputResolution: {
		width: number,
		height: number,
	},
	isActive: boolean,
	quality: number,
	effort: number,
}
export type ProcessImageTask = {
	// the input path
	path: string,
	quality?: number,
	effort?: number,
}
export type AppRPCSchema = {
	bun: RPCSchema<{
		requests: {
			pollInputs : {
				params: undefined,
				response: PollInputsResponseType
			},
			openFileDialog: {
				params: undefined,
				response: OpenFileDialogResponseType
			},
			revealInFileManager: {
				params: { path?: string } | undefined,
				response: BaseResponseType
			},
			clearAll: {
				params: undefined,
				response: BaseResponseType
			},
			deleteImage: {
				params: ProcessImageTask,
				response: ProcessImageResponseType | BaseResponseType,
			}
			updateImage: {
				params: ProcessImageTask,
				response: ProcessImageResponseType,
			},
			resetSettings: {
				params: undefined,
				response: SettingsResponseType,
			},
			getSettings: {
				params: undefined,
				response: SettingsResponseType,
			},
			setSettings: {
				params: ApplicationSettingsType,
				response: SettingsResponseType,
			},
		}
	}>,
	webview: RPCSchema<{
		messages: {
			openSettings: undefined,
		}
	}>
};

export type BaseResponseType = {
	severity: 'ERROR' | 'WARNING' | 'SUCCESS',
	message: string,
}

export type APIResponseType = BaseResponseType & {
	images: Array<Image>,
	inputFolderSize: number,
	outputFolderSize: number,
}

export type ProcessImageResponseType = BaseResponseType & {
	image: Image
}

export type SettingsResponseType = BaseResponseType & ApplicationSettingsType

export type OpenFileDialogResponseType = BaseResponseType & {
	path: string,
}

export type PollInputsResponseType = BaseResponseType & {
	inputPaths : Array<string>,
}