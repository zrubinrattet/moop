import type { RPCSchema } from "electrobun/bun";

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
	effort : number,
}
export type ProcessImageTask = {
	path: string,
	quality?: number,
	effort?: number,
}
export type AppRPCSchema = {
	bun: RPCSchema<{
		requests: {
			revealInFileManager: {
				params: undefined,
				response: BaseResponseType
			},
			updateImage: {
				params: ProcessImageTask,
				response: UpdateImageResponseType,
			},
		}
	}>;
	webview: RPCSchema;
};

export type BaseResponseType = {
	severity : 'ERROR' | 'WARNING' | 'SUCCESS',
	message : string,
}

export type APIResponseType = BaseResponseType & {
	images : Array<Image>,
	inputFolderSize: number,
	outputFolderSize: number,
}

export type UpdateImageResponseType = BaseResponseType & {
	image: Image
}