import { useContext } from "react";
import { sharedContext } from "../../shared/context";
import ImagesListItem from "./imagesListItem";
import { electroview } from "../shared/electroview";

import { formatBytes } from "../shared/snippets";
import toast from "react-hot-toast";
import { t } from "../../lang/lang";
import { BaseResponseType } from "../../shared/types";
import { handleRPCRequestCatch } from "../shared/utils";



export default function ImagesList() {
	const appContext = useContext(sharedContext);

	async function revealClickHandler(e: React.MouseEvent) {
		e.preventDefault();
		try {
			const res: BaseResponseType | undefined = await electroview.rpc?.request.revealInFileManager();
			if (typeof res !== 'undefined') {
				if (res.severity === 'ERROR') {
					toast(res.message, {
						className: 'hottoast',
					});
				}
			}
			else {
				toast(t('unknownError'), {
					className: 'hottoast',
				});
			}
		} catch (error) {
			handleRPCRequestCatch(error)
		}
	}

	async function clearAllClickHandler(e: React.MouseEvent) {
		e.preventDefault();

		try {

			const res: BaseResponseType | undefined = await electroview.rpc?.request.clearAll();
			
			if (res?.severity === 'SUCCESS') {
				appContext.setImages([]);
				if (res?.message) {
					toast(res.message, {
						className: 'hottoast',
					});
				}
			}
		} catch (error) {
			handleRPCRequestCatch(error)
		}
	}

	return (
		<div className="imageslist">
			<div className="imageslist-header">
				<div className="imageslist-header-text">
					<span className="imageslist-header-text-item">{Object.keys(appContext.images).length} {t('imagesAt')} {formatBytes(appContext.inputFolderSize)} {t('to')} {formatBytes(appContext.outputFolderSize)}</span>
					<span className="imageslist-header-text-subitem">{!appContext.outputFolderSize || !appContext.inputFolderSize ? 0 : (100 * (1 - appContext.outputFolderSize / appContext.inputFolderSize)).toFixed(2)}% {t('reduction')}</span>
				</div>
			</div>
			<div className="imageslist-list">
				{appContext.images.map((image, index) => (
					<ImagesListItem
						index={index}
						key={index}
						input={image.input}
						output={image.output}
					/>
				))}
				<div className={'imageslist-list-loading' + (appContext.imagesLoading ? ' active' : '')}></div>
				{Object.keys(appContext.images).length > 0 ? <a onClick={clearAllClickHandler} href="#" className="imageslist-list-clearall">{t('clearAll')}</a> : ''}
			</div>
			<a href="#" onClick={revealClickHandler} className="imageslist-revealbutton">{t('revealFolder')}</a>
		</div>
	);
}
