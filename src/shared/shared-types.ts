import type { RPCSchema } from "electrobun/bun";
export type ApplicationSettingsType = {
	theme: 'auto' | 'light' | 'dark',
	quality: number,
	effort: number,
	maxWidth: number,
	outputFolder: string,
	language: 'English',
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
			revealInFileManager: {
				params: {path?: string} | undefined,
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
	}>;
	webview: RPCSchema;
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