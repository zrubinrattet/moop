import type { RPCSchema } from "electrobun/bun";

export type Image = {
	input: string,
	output: string,
	inputSizeBytes: number,
	outputSizeBytes: number,
}

export type AppRPCSchema = {
	bun: RPCSchema<{
		requests: {
			revealInFileManager: {
				params: undefined,
				response: BaseResponseType
			}
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