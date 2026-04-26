import type { RPCSchema } from "electrobun/bun";
export type AvailableThemes = 'auto' | 'light' | 'dark';
// export type AvailableLangs = 'en' | 'es';
export type AvailableLangs =
  | 'en'  // English
  | 'zh'  // Chinese (merged: Mandarin/Yue/Wu)
  | 'hi'  // Hindi
  | 'es'  // Spanish
  | 'ar'  // Arabic (merged dialects)
  | 'fr'  // French
  | 'bn'  // Bengali
  | 'pt'  // Portuguese
  | 'id'  // Indonesian
  | 'ur'  // Urdu
  | 'ru'  // Russian
  | 'de'  // German
  | 'ja'  // Japanese
  | 'mr'  // Marathi
  | 'vi'  // Vietnamese
  | 'te'  // Telugu
  | 'sw'  // Swahili
  | 'ha'  // Hausa
  | 'tr'  // Turkish
  | 'pa'  // Punjabi
  | 'fil' // Filipino/Tagalog
  | 'ta'  // Tamil
  | 'fa'  // Persian
  | 'ko'  // Korean
  | 'am'  // Amharic
  | 'th'  // Thai
  | 'jv'  // Javanese
  | 'it'  // Italian
  | 'gu'  // Gujarati
  | 'kn'  // Kannada
  | 'yo'  // Yoruba
  | 'bho' // Bhojpuri (ISO 639-3)
  | 'ml'; // Malayalam
export type AvailableOutputFormats = 'webp' | 'jpeg' | 'png';
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
	outputFormat: AvailableOutputFormats;
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
	outputFormat: AvailableOutputFormats,
}
export type ProcessImageTask = {
	// the input path
	path: string,
	quality?: number,
	effort?: number,
	outputFormat?: AvailableOutputFormats
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