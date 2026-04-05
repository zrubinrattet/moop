import { useContext } from "react";
import { sharedContext, appContextDefaults } from "../../shared/shared-context";

type ImagesListItemProps = {
	index: number,
	output: string,
	input: string,
}
export default function ImagesListItem(props: ImagesListItemProps) {
	const appContext = useContext(sharedContext);
	function imageClickHandler(e: React.MouseEvent) {
		e.preventDefault();
		if (e.target instanceof HTMLElement) {
			document.querySelectorAll('.imageslist-list-item')?.forEach((el) => {
				el.classList.remove('active')
			});

			const parent = e.target.closest('.imageslist-list-item');
			if (parent instanceof HTMLElement) {
				parent.classList.add('active');
				const elIndex = props.index;

				appContext.setActiveImage(appContext.images[elIndex]);
				appContext.setZoom(appContextDefaults.zoom);
				appContext.setCrop(appContextDefaults.crop);
			}

		}
	}
	function itemDeleteClickHandler(e: React.MouseEvent) {
		e.preventDefault();
		console.log('Open the modal!');
	}
	return (
		<div className={"imageslist-list-item" + (props.index === 0 ? ' active' : '')}>
			<a href="#" onClick={itemDeleteClickHandler} className="imageslist-list-item-close">&times;</a>
			<a href="#" onClick={imageClickHandler} className="imageslist-list-item-image" style={{ backgroundImage: "url('" + props.output + "')" }}>&nbsp;</a>
		</div>
	);
}
