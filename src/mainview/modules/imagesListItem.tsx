import { useContext } from "react";
import { sharedContext, appContextDefaults } from "../../shared/shared-context";

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
	function itemDeleteClickHandler(e: React.MouseEvent) {
		e.preventDefault();
		console.log('Open the modal!');
	}
	return (
		<div className={"imageslist-list-item" + (activeImage?.input === props.input ? ' active' : '')}>
			<a href="#" onClick={itemDeleteClickHandler} className="imageslist-list-item-close">&times;</a>
			<a href="#" onClick={imageClickHandler} className="imageslist-list-item-image" style={{ backgroundImage: "url('" + props.output + "')" }}>&nbsp;</a>
		</div>
	);
}
