import { useContext } from "react";
import { sharedContext } from "../../shared/shared-context";
import ImagesList from "./imagesList";
import ImagesCanvas from "./imagesCanvas";

export default function ImagesEditor(){
	const appContext = useContext(sharedContext);
	return (
		<div className={'imageseditor' + (appContext.imagesLoading || Object.keys(appContext.images).length > 0 ? ' active' : '')}>
			<ImagesList />
			<ImagesCanvas />
		</div>
	);
	
}