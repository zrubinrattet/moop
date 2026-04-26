/**
For FE shared funcs.
**/
import toast from "react-hot-toast";
import { t } from "../../lang/lang";

export function handleRPCRequestCatch(error: Error|unknown) {
	let message = '';
	if (error instanceof Error) {
		message = String(error.message) || '';
	}
	if (message && message.indexOf('RPC request timed out') === 0) {
		toast(message.replace('RPC request timed out.', t('rpcTimeout')), {
			className: 'hottoast',
		});
	}
	else {
		toast(t('unknownError'), {
			className: 'hottoast'
		});
	}
}