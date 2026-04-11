import MainBG from './modules/mainbg';
import DragDrop from './modules/dragdrop';
import ImagesEditor from './modules/imagesEditor';
import SettingsPane from './modules/settings';
import { sharedContext, appContextDefaults } from '../shared/shared-context';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

export default function Moop() {
	const [images, setImages] = useState(appContextDefaults.images);
	const [outputFolderSize, setOutputFolderSize] = useState(appContextDefaults.outputFolderSize);
	const [inputFolderSize, setInputFolderSize] = useState(appContextDefaults.inputFolderSize);
	const [imagesLoading, setImagesLoading] = useState(appContextDefaults.imagesLoading);
	const [crop, setCrop] = useState(appContextDefaults.crop);
	const [zoom, setZoom] = useState(appContextDefaults.zoom);
	const [quality, setQuality] = useState(appContextDefaults.quality);
	const [effort, setEffort] = useState(appContextDefaults.effort);

	return (
		<sharedContext.Provider value={{
			...appContextDefaults,
			images: images,
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
			quality: quality,
			setQuality: setQuality,
			effort: effort,
			setEffort: setEffort,
		}}>
			<Toaster />
			<SettingsPane />
			<DragDrop />
			<ImagesEditor />
			<MainBG />
		</sharedContext.Provider>
	);
}
