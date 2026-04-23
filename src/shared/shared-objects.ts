import { APIResponseType, BaseResponseType, ProcessImageResponseType } from './shared-types';

export const APIResponse: APIResponseType = {
	images: [],
	inputFolderSize: 0,
	outputFolderSize: 0,
	message: '',
	severity: 'SUCCESS',
}

export const BaseResponse: BaseResponseType = {
	severity: 'SUCCESS',
	message: '',
}

export const ProcessImageResponse: ProcessImageResponseType = {
	...BaseResponse, image: {
		input: '',
		output: '',
		inputSizeBytes: 0,
		outputSizeBytes: 0,
		inputResolution: {
			width: 0,
			height: 0,
		},
		outputResolution: {
			width: 0,
			height: 0,
		},
		isActive: false,
		effort: 0,
		quality: 0,
		outputFormat: 'webp',
	}
}