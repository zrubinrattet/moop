import { useContext } from "react";
import { sharedContext } from "../../shared/shared-context";
import ImagesList from "./imagesList";
import ImagesCanvas from "./imagesCanvas";

export default function ImagesEditor(){
	const appContext = useContext(sharedContext);
	if( Object.keys(appContext.images).length > 0 ){
		return (
			<div className="imageseditor">
				<ImagesList />
				<ImagesCanvas />
			</div>
		);
	}
}