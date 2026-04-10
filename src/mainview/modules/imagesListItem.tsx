import { useContext } from "react";
import { Tooltip } from "react-tooltip";
import { sharedContext, appContextDefaults } from "../../shared/shared-context";
import { electroview } from "../../shared/shared-electroview";

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
		console.log('Open the modal!');
		const res = await electroview.rpc?.request.deleteImage({ path: props.input });

		if (typeof res !== 'undefined' && 'image' in res && 'input' in res.image) {
			appContext.setImages((images) => {
				return images.filter((image) => {
					return image.input !== res.image.input;
				});
			});
		}
	}
	async function revealItemClickHandler(e: React.MouseEvent) {
		e.preventDefault();
		console.log('Open in finder!');
		await electroview.rpc?.request.revealInFileManager({ path: props.input });
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
			<span className="imageslist-list-item-filename">{props.input.split('/').pop()}</span>
			<a href="#" onClick={imageClickHandler} className="imageslist-list-item-image" style={{ backgroundImage: "url('" + props.output + "')" }}>&nbsp;</a>
			<Tooltip
				id="delete-image"
				place="top"
				content="Delete image"
				className="tooltip"

			/>
			<Tooltip
				id="reveal-image"
				place="top"
				content="Reveal image in file manager"
				className="tooltip"
			/>
		</div>
	);
}
