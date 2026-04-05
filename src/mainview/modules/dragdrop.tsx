import { sharedContext, appContextDefaults } from "../../shared/shared-context";
import { useContext } from "react";
import { useDropzone } from "react-dropzone";


export default function DragDrop() {
	
	const appContext = useContext(sharedContext);

	const dropHandler = async (acceptedFiles: Array<File>) => {
		// we're loading images now!
		appContext.setImagesLoading(true);
		
		// keep track of date for performance measuring
		const dateNow = Date.now();

		// define upload connection
		const promises = acceptedFiles.map(async (droppedFile) => {
			try {
				const formData = new FormData();
				formData.append("image", droppedFile);
				const res = await fetch("http://127.0.0.1:3000/upload", {
					method: "POST",
					body: formData,
				});
				const resJson = await res.json();

				if (Object.keys(resJson.data.images).length) {
					appContext.setImages((currentImages) => ([
						...currentImages,
						...resJson.data.images,
					]));
					appContext.setInputFolderSize(resJson.data.inputFolderSize);
					appContext.setOutputFolderSize(resJson.data.outputFolderSize);
				}
				return resJson;
			} catch (error) {
				console.error("Upload failed:", error);
				return null;
			}
		})

		// set active image
		let firstPromiseResolved = false;
		promises.forEach(p => {
			p.then(val => {
				if (!firstPromiseResolved) {
					firstPromiseResolved = true;
					appContext.setActiveImage(val.data.images[0]);
					appContext.setZoom(appContextDefaults.zoom);
					appContext.setCrop(appContextDefaults.crop);
				}
			});
		});

		// upload / set files/images
		const responses = await Promise.all(promises);
		console.log(`Upload complete in ${(Date.now() - dateNow) / 1000}s`, responses);

		appContext.setImagesLoading(false);
	};

	const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop: dropHandler, noClick: true })

	return (
		<div className={'dragdrop' + (isDragActive ? ' highlight' : '')} {...getRootProps()}>
			<input {...getInputProps()} />
		</div>
	)
}