import { useContext, useEffect } from "react";
import { sharedContext, } from "../../shared/shared-context";
import { formatBytes } from "../../shared/shared-snippets";
import Cropper from 'react-easy-crop'
import { electroview } from "../../shared/shared-electroview";
import { Tooltip } from "react-tooltip";

export default function ImagesCanvas() {
	const appContext = useContext(sharedContext);
	const activeImage = appContext.images.find(image => image.isActive);
	useEffect(() => {
		console.log("activeimage:", activeImage);
	}, [activeImage]);
	// bail if no activeImage
	if ('undefined' === typeof activeImage) {
		return;
	}
	const inputHandler = (field: 'quality' | 'effort', e: React.ChangeEvent<HTMLInputElement>) => {
		const value = Number(e.target.value);
		if (field === 'quality') {
			appContext.setQuality(value);
		}
		else {
			appContext.setEffort(value);
		}
	}

	const mouseUpHandler = async () => {
		try {
			const updateImageProps = {
				path: activeImage.input,
				quality: appContext.quality,
				effort: appContext.effort,
			};
			console.log('updateImageProps: ', updateImageProps)
			const res = await electroview.rpc?.request.updateImage(updateImageProps);
			if (typeof res !== 'undefined') {
				console.log(res)
				appContext.setImages((images) =>
					images.map((image) => {
						if (image.input === activeImage.input) {
							return { ...res.image, isActive: true };
						} else {
							return { ...image, isActive: false };
						}
					})
				);
			}
		} catch (error) {
			console.log(error)
		}
	}

	return (
		<div className="imagescanvas">
			<div className="imagescanvas-col">
				<div className="imagescanvas-col-header">Input</div>
				<div className="imagescanvas-col-bg">
					<Cropper
						key={activeImage.input}
						image={activeImage.input}
						crop={appContext.crop}
						zoom={appContext.zoom}
						maxZoom={10}
						onCropChange={appContext.setCrop}
						onZoomChange={appContext.setZoom}
					/>
				</div>
				<div className="imagescanvas-col-footer">
					<div className="imagescanvas-col-footer-bytes">
						{formatBytes(activeImage.inputSizeBytes)}
					</div>
					<div className="imagescanvas-col-footer-size">
						{activeImage.inputResolution.width + 'px x ' + activeImage.inputResolution.height + 'px'}
					</div>
				</div>
			</div>
			<div className="imagescanvas-col">
				<div className="imagescanvas-col-header">Output</div>
				<div className="imagescanvas-col-bg">
					<Cropper
						key={activeImage.output}
						image={activeImage.output}
						crop={appContext.crop}
						zoom={appContext.zoom}
						maxZoom={10}
						onCropChange={appContext.setCrop}
						onZoomChange={appContext.setZoom}
					/>
				</div>
				<div className="imagescanvas-col-footer">
					<div className="imagescanvas-col-footer-bytes">
						{formatBytes(activeImage.outputSizeBytes)}
					</div>
					<div className="imagescanvas-col-footer-size">
						{activeImage.outputResolution.width + 'px x ' + activeImage.outputResolution.height + 'px'}
					</div>
				</div>
			</div>
			<div className="imagescanvas-sliders">
				<label className="imagescanvas-sliders-slider">
					<div className="imagescanvas-sliders-slider-label">
						<span className="imagescanvas-sliders-slider-label-span" data-tooltip-id="quality">Quality</span>
					</div>
					<input onChange={(e) => inputHandler('quality', e)} onMouseUp={mouseUpHandler} className="imagescanvas-sliders-slider-input" type="range" min="1" max="100" value={appContext.quality} />
					<div className="imagescanvas-sliders-slider-inputvalue">{appContext.quality}</div>
				</label>
				<label className="imagescanvas-sliders-slider">
					<div className="imagescanvas-sliders-slider-label">
						<span className="imagescanvas-sliders-slider-label-span" data-tooltip-id="effort">Effort</span>
					</div>
					<input onChange={(e) => inputHandler('effort', e)} onMouseUp={mouseUpHandler} className="imagescanvas-sliders-slider-input" type="range" min="0" max="6" value={appContext.effort} />
					<div className="imagescanvas-sliders-slider-inputvalue">{appContext.effort}</div>
				</label>
			</div>
			<Tooltip
				id="quality"
				place="top"
				content="Compression quality from 1-100. Higher quality means less compression and larger files."
				className="tooltip"
			/>
			<Tooltip
				id="effort"
				place="top"
				content="Level of CPU effort to reduce file size from 0-6. Higher effort means processing will take longer but be better looking (usually)."
				className="tooltip"
			/>
		</div>
	);

}
