import { useContext } from "react";
import { sharedContext } from "../../shared/shared-context";
import ImagesListItem from "./imagesListItem";
import { Electroview } from "electrobun/view";
import type { AppRPCSchema } from "../../shared/shared-types";

import { formatBytes } from "../../shared/shared-snippets";

const rpc = Electroview.defineRPC<AppRPCSchema>({
	handlers: {
		requests: {},
		messages: {},
	},
});

const electroview = new Electroview({ rpc });

export default function ImagesList() {
	const appContext = useContext(sharedContext);

	async function revealClickHandler(e: React.MouseEvent) {
		e.preventDefault();
		await electroview.rpc?.request.revealInFileManager();
	}

	function clearAllClickHandler(e: React.MouseEvent) {
		e.preventDefault();

		// show confirmation modal
		console.log('Show confirmation modal!');
	}

	return (
		<div className="imageslist">
			<div className="imageslist-header">
				<span className="imageslist-header-item">{Object.keys(appContext.images).length} images at {formatBytes(appContext.inputFolderSize)} to {formatBytes(appContext.outputFolderSize)}</span>
				<span className="imageslist-header-subitem">{(100 * (1 - appContext.outputFolderSize / appContext.inputFolderSize)).toFixed(2)}% reduction</span>
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
				{Object.keys(appContext.images).length > 0 ? <a onClick={clearAllClickHandler} href="#" className="imageslist-list-clearall">Clear all</a> : ''}
			</div>
			<a href="#" onClick={revealClickHandler} className="imageslist-revealbutton">Reveal in file manager</a>
		</div>
	);
}
