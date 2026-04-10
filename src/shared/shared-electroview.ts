import { Electroview } from "electrobun/view";
import type { AppRPCSchema } from "./shared-types";

const rpc = Electroview.defineRPC<AppRPCSchema>({
	maxRequestTime: 30000,
	handlers: {
		requests: {},
		messages: {},
	},
});

export const electroview = new Electroview({ rpc });
