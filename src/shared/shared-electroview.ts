import { Electroview } from "electrobun/view";
import type { AppRPCSchema } from "./shared-types";
import { eventBus } from "./shared-eventbus";
const rpc = Electroview.defineRPC<AppRPCSchema>({
	maxRequestTime: 6000,
	handlers: {
		requests: {},
		messages: {
			openSettings: () => {
				eventBus.dispatchEvent(new CustomEvent('openSettings'));
			}
		},
	},
});

export const electroview = new Electroview({ rpc });
