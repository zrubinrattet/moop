import { APIResponseType, BaseResponseType } from './shared-types';

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