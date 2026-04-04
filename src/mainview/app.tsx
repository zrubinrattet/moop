import MainBG from './modules/mainbg';
import DragDrop from './modules/dragdrop';
import ImagesEditor from './modules/imagesEditor';
import { sharedContext, appContextDefaults } from '../shared/shared-context';
import { useState } from 'react';
import { Image } from '../shared/shared-types';

export default function Moop() {
	const [images, setImages] = useState<Image[]>([]);
	const [activeImage, setActiveImage] = useState({
		input: '',
		output: '',
		inputSizeBytes: 0,
		outputSizeBytes: 0,
	});
	const [outputFolderSize, setOutputFolderSize] = useState(0);
	const [inputFolderSize, setInputFolderSize] = useState(0);
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
			setInputFolderSize: setInputFolderSize
		}}>
			<DragDrop />
			<ImagesEditor />
			<MainBG />
		</sharedContext.Provider>
	);
}
