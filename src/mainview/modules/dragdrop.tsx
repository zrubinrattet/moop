import { sharedContext } from "../../shared/shared-context";
import { useContext } from "react";
import { useDropzone } from "react-dropzone";


export default function DragDrop() {
	const appContext = useContext(sharedContext);
	const onDrop = async (acceptedFiles: Array<File>) => {
		const dateNow = Date.now();

		let firstPromiseResolved = false;
		
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
		promises.forEach(p => {
			p.then(val => {
				if (!firstPromiseResolved) {
					firstPromiseResolved = true;
					appContext.setActiveImage(val.data.images[0]);
				}
			});
		});

		// upload / set files/images
		const responses = await Promise.all(promises);
		console.log(`Upload complete in ${(Date.now() - dateNow) / 1000}s`, responses);
	};

	const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true })

	return (
		<div className={'dragdrop' + (isDragActive ? ' highlight' : '')} {...getRootProps()}>
			<input {...getInputProps()} />
		</div>
	)
}