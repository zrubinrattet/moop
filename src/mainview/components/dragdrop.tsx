import { sharedContext, appContextDefaults } from "../../shared/context";
import { useContext } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { Image } from "../../shared/types";
import toast from "react-hot-toast";
import { t } from "../../lang/lang";

export default function DragDrop() {

	const appContext = useContext(sharedContext);

	const dropHandler = async (acceptedFiles: Array<File>) => {
		// we're loading images now!
		appContext.setImagesLoading(true);

		// define upload connection
		const promises = acceptedFiles.map(async (droppedFile) => {
			try {
				const formData = new FormData();
				formData.append("image", droppedFile);
				const res = await fetch("http://localhost:43117/images", {
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
									toast(`${resJsonImage.input.split('/').pop()} ${t('isAlreadyInList')}.`, {
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
					if (!val.ok) {

						toast(t('updateImageError'), {
							className: 'hottoast'
						})
						return;
					}
					try {
						appContext.setImages((images) => {
							const temp: Image = val.data.images[0];
							temp.isActive = true;
							images[images.indexOf(val.data.images[0])] = temp;
							return images;
						});
						appContext.setZoom(appContextDefaults.zoom);
						appContext.setCrop(appContextDefaults.crop);
					} catch {
						toast(t('unknownError'), {
							className: 'hottoast'
						})
						return;
					}
				}
			});
		});

		// upload / set files/images
		await Promise.all(promises);

		appContext.setImagesLoading(false);
	};

	const dropRejectHandler = (rejections: FileRejection[]) => {
		rejections?.forEach((rejection) => {
			rejection.errors.forEach((error) => {
				toast(error.message.replace('File type must be one of', t('fileTypeOneOf')), { className: 'hottoast' });
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