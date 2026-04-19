import { useContext } from "react";
import { sharedContext } from "../../shared/shared-context";
import ImagesListItem from "./imagesListItem";
import { electroview } from "../../shared/shared-electroview";

import { formatBytes } from "../../shared/shared-snippets";
import toast from "react-hot-toast";
import { t } from "../lang/lang";



export default function ImagesList() {
	const appContext = useContext(sharedContext);

	async function revealClickHandler(e: React.MouseEvent) {
		e.preventDefault();
		try {
			await electroview.rpc?.request.revealInFileManager();
		} catch (error) {
			let message = '';
			if(typeof error === 'object' && null !== error && 'message' in error ) {
			 	message = String(error.message) || '';
			}
			if (message) {
				toast(message, {
					className: 'hottoast',
				});
			}
		}
	}
	
	async function clearAllClickHandler(e: React.MouseEvent) {
		e.preventDefault();
		
		try {
			
			const res = await electroview.rpc?.request.clearAll();
			console.log(res)
			if (res?.severity === 'SUCCESS') {
				appContext.setImages([]);
			}
		} catch (error) {
			let message = '';
			if(typeof error === 'object' && null !== error && 'message' in error ) {
			 	message = String(error.message) || '';
			}
			if (message) {
				toast(message, {
					className: 'hottoast',
				});
			}
		}
	}
	
	return (
		<div className="imageslist">
			<div className="imageslist-header">
				<div className="imageslist-header-text">
					<span className="imageslist-header-text-item">{Object.keys(appContext.images).length} {t('imagesAt')} {formatBytes(appContext.inputFolderSize)} {t('to')} {formatBytes(appContext.outputFolderSize)}</span>
					<span className="imageslist-header-text-subitem">{ !appContext.outputFolderSize || !appContext.inputFolderSize ? 0 : (100 * (1 - appContext.outputFolderSize / appContext.inputFolderSize)).toFixed(2) }% {t('reduction')}</span>
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
