import { sharedContext, appContextDefaults } from "../../shared/shared-context";
import { useContext } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { Image } from "../../shared/shared-types";
import toast from "react-hot-toast";
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
				const res = await fetch("http://127.0.0.1:3000/images", {
					method: "POST",
					body: formData,
				});
				const resJson = await res.json();

				if (Object.keys(resJson.data.images).length) {
					appContext.setImages((currentImages) => {

						// prevent dupes from being added
						const dupes: Image[] = [];

						currentImages.forEach((currentImage) => {
							resJson.data.images.forEach((resJsonImage: Image) => {
								if (currentImage.input.split('/').pop() === resJsonImage.input.split('/').pop()) {
									dupes.push(resJsonImage);
									toast(`${resJsonImage.input.split('/').pop()} is already in the list.`, {
										className: 'hottoast'
									});
								}
							})
						});

						let newImages;
						if (dupes.length) {
							newImages = resJson.data.images.filter((image: Image) => {
								const imageFileName = image.input.split('/').pop();
								return imageFileName && !dupes.map(dupe => dupe.input).indexOf(imageFileName);
							});
						}
						else {
							newImages = [...resJson.data.images];
						}
						return [
							...currentImages,
							...newImages,
						]
					});
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
					appContext.setImages((images) => {
						console.log(val)
						const temp: Image = val.data.images[0];
						temp.isActive = true;
						images[images.indexOf(val.data.images[0])] = temp;
						return images;
					});
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

	const dropRejectHandler = (rejections: FileRejection[]) => {
		rejections?.forEach((rejection) => {
			rejection.errors.forEach((error) => {
				toast(error.message, { className: 'hottoast' });
			});
		});
	}

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: dropHandler,
		onDropRejected: dropRejectHandler,
		noClick: true,
		accept: {
			'image/jpeg': ['.jpg', '.jpeg', '.jpe', '.jfif'],
			'image/png': ['.png'],
			'image/webp': ['.webp'],
			'image/tiff': ['.tif', '.tiff'],
			'image/gif': ['.gif'],
			'image/svg+xml': ['.svg', '.svgz'],
			'image/avif': ['.avif'],
		}
	})

	return (
		<div className={'dragdrop' + (isDragActive ? ' highlight' : '')} {...getRootProps()}>
			<input {...getInputProps()} />
		</div>
	)
}