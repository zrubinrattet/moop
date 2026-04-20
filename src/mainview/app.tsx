import MainBG from './components/mainbg';
import DragDrop from './components/dragdrop';
import ImagesEditor from './components/imagesEditor';
import SettingsPane from './components/settings';
import { sharedContext, appContextDefaults } from '../shared/shared-context';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { setLocale } from './lang/lang';

export default function Moop() {
	const [settings, setSettings] = useState(appContextDefaults.settings);
	const [images, setImages] = useState(appContextDefaults.images);
	const [outputFolderSize, setOutputFolderSize] = useState(appContextDefaults.outputFolderSize);
	const [inputFolderSize, setInputFolderSize] = useState(appContextDefaults.inputFolderSize);
	const [imagesLoading, setImagesLoading] = useState(appContextDefaults.imagesLoading);
	const [imagesProcessing, setImagesProcessing] = useState(appContextDefaults.imagesProcessing);
	const [crop, setCrop] = useState(appContextDefaults.crop);
	const [zoom, setZoom] = useState(appContextDefaults.zoom);
	const [quality, setQuality] = useState(appContextDefaults.quality);
	const [effort, setEffort] = useState(appContextDefaults.effort);

	// run on app load and whenever settings.language or settings.theme change
	useEffect(() => {
		// set theme on app load
		setLocale(settings.language);
		// remove theme body classes
		['auto', 'light', 'dark'].forEach(name => document.body.classList.remove(`theme-${name}`));
		// add the appropriate theme class
		document.body.classList.add(`theme-${settings.theme}`);
	}, [settings.language, settings.theme]);

	return (
		<sharedContext.Provider value={{
			...appContextDefaults,
			settings,
			setSettings,
			images,
			setImages,
			outputFolderSize,
			setOutputFolderSize,
			inputFolderSize,
			setInputFolderSize,
			imagesLoading,
			setImagesLoading,
			imagesProcessing,
			setImagesProcessing,
			crop,
			setCrop,
			zoom,
			setZoom,
			quality,
			setQuality,
			effort,
			setEffort,
		}}>
			<Toaster />
			<SettingsPane />
			<DragDrop />
			<ImagesEditor />
			<MainBG />
		</sharedContext.Provider>
	);
}
