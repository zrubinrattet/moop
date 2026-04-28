import { useContext } from "react";
import { Tooltip } from "react-tooltip";
import { sharedContext } from "../shared/context";
import { electroview } from "../shared/electroview";
import toast from "react-hot-toast";
import { t } from "../../lang/lang";
import { handleRPCRequestCatch } from "../shared/utils";
import { BaseResponseType, ProcessImageResponseType } from "../../shared/types";
import { appContextDefaults } from "../../shared/context";

type ImagesListItemProps = {
	index: number,
	output: string,
	input: string,
}
export default function ImagesListItem(props: ImagesListItemProps) {
	const appContext = useContext(sharedContext);

	const activeImage = appContext.images.find(image => image.isActive);

	function imageClickHandler(e: React.MouseEvent) {
		e.preventDefault();
		if (e.target instanceof HTMLElement) {
			appContext.setImages((images) => {
				return images.map((image) => ({
					...image,
					isActive: image === appContext.images[props.index],
				}))
			});
			appContext.setZoom(appContextDefaults.zoom);
			appContext.setCrop(appContextDefaults.crop);
			appContext.setQuality(appContext.images[props.index].quality)
			appContext.setEffort(appContext.images[props.index].effort)
		}
	}
	async function itemDeleteClickHandler(e: React.MouseEvent) {
		e.preventDefault();
		try {
			
			const res: BaseResponseType | ProcessImageResponseType | undefined = await electroview.rpc?.request.deleteImage({ path: props.input });

			if (res && 'image' in res && 'input' in res.image) {
				appContext.setImages((images) => {
					// only use the image(s) that aren't from the response.
					// if the delete image was active, the prev image in the images array should be active
					let prevIndex = 0;
					return images.filter((image, index) => {
						if (image.input === res.image.input) {
							prevIndex = index - 1 || 0;
						}
						return image.input !== res.image.input;
					}).map((image) => {
						if (res.image.isActive && images[prevIndex] && image.input === images[prevIndex].input) {
							image.isActive = true;
						}
						else if (!images[prevIndex]) {
							image.isActive = true;
						}
						return image;
					});
				});
			}
			if (res) {
				toast(res.message, {
					className: 'hottoast'
				});
			}
		} catch (error) {
			handleRPCRequestCatch(error);
		}
	}
	async function revealItemClickHandler(e: React.MouseEvent) {
		e.preventDefault();
		try {
			
			const res: BaseResponseType | undefined = await electroview.rpc?.request.revealInFileManager({ path: props.input });
			if (res && res.severity === 'ERROR') {
				toast(res.message, {
					className: 'hottoast'
				})
			}
		} catch (error) {
			handleRPCRequestCatch(error);
		}
	}
	return (
		<div className={"imageslist-list-item" + (activeImage?.input === props.input ? ' active' : '')}>
			<a
				href="#"
				onClick={itemDeleteClickHandler}
				className="imageslist-list-item-close"
				data-tooltip-id="delete-image"
				data-tooltip-delay-show={500}
			>
				&times;
			</a>
			<a
				href="#"
				onClick={revealItemClickHandler}
				className="imageslist-list-item-reveal"
				data-tooltip-id="reveal-image"
				data-tooltip-delay-show={500}
			>
				&nbsp;
			</a>
			<div className={"imageslist-list-item-loading " + (appContext.imagesProcessing.filter(input => input === props.input).length ? 'active' : '')}></div>
			<span className="imageslist-list-item-filename">{props.input.split('/').pop()}</span>
			<a href="#" onClick={imageClickHandler} className="imageslist-list-item-image" style={{ backgroundImage: "url('" + props.output + "')" }}>&nbsp;</a>
			<Tooltip
				id="delete-image"
				place="top"
				content={t('deleteImage')}
				className="tooltip"
			/>
			<Tooltip
				id="reveal-image"
				place="top"
				content={t('revealImage')}
				className="tooltip"
			/>
		</div>
	);
}
