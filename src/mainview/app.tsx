import MainBG from './modules/mainbg';
import DragDrop from './modules/dragdrop';
import ImagesEditor from './modules/imagesEditor';
import { sharedContext, appContextDefaults } from '../shared/shared-context';
import { useState } from 'react';

export default function Moop() {
	const [images, setImages] = useState(appContextDefaults.images);
	const [activeImage, setActiveImage] = useState(appContextDefaults.activeImage);
	const [outputFolderSize, setOutputFolderSize] = useState(appContextDefaults.outputFolderSize);
	const [inputFolderSize, setInputFolderSize] = useState(appContextDefaults.inputFolderSize);
	const [imagesLoading, setImagesLoading] = useState(appContextDefaults.imagesLoading);
	const [crop, setCrop] = useState(appContextDefaults.crop);
	const [zoom, setZoom] = useState(appContextDefaults.zoom);

	return (
		<sharedContext.Provider value={{
			...appContextDefaults,
			images: images,
			activeImage: activeImage,
			setActiveImage: setActiveImage,
			setImages: setImages,
			outputFolderSize: outputFolderSize,
			setOutputFolderSize: setOutputFolderSize,
			inputFolderSize: inputFolderSize,
			setInputFolderSize: setInputFolderSize,
			imagesLoading: imagesLoading,
			setImagesLoading: setImagesLoading,
			crop: crop,
			setCrop: setCrop,
			zoom: zoom,
			setZoom: setZoom,
		}}>
			<DragDrop />
			<ImagesEditor />
			<MainBG />
		</sharedContext.Provider>
	);
}
