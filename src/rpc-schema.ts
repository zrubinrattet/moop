import type { RPCSchema } from "electrobun/bun";

export type AppRPCSchema = {
	bun: RPCSchema<{
		requests: {
			uploadImages: {
				params: Array<{
					path: string,
					name: string,
					size: number,
					type: string,
					bytes: Uint8Array,
				}>,
				response: object
			}
		}
	}>;
	webview: RPCSchema;
};
