import { useContext, useEffect, useRef } from "react";
import { sharedContext, } from "../../shared/shared-context";
import { formatBytes } from "../../shared/shared-snippets";
import Cropper from 'react-easy-crop'
import { electroview } from "../../shared/shared-electroview";
import { Tooltip } from "react-tooltip";
import toast from "react-hot-toast";
import { t } from "../lang/lang";
import { handleRPCRequestCatch } from "../../shared/shared-utils";

export default function ImagesCanvas() {
	const appContext = useContext(sharedContext);
	const mouseUpDebounceRef = useRef<NodeJS.Timeout>(null);
	const mouseDownQualityEffort = useRef({ quality: 0, effort: 0 });

	const activeImage = appContext.images.find(image => image.isActive);
	useEffect(() => {
		console.log("activeimage:", activeImage);
	}, [activeImage]);


	useEffect(() => {
		return () => {
			if (mouseUpDebounceRef.current) {
				clearTimeout(mouseUpDebounceRef.current);
			}
		};
	}, []);

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

	const updateImage = async (targetInput: string, quality: number, effort: number) => {
		try {
			const updateImageProps = {
				path: targetInput,
				quality,
				effort,
			};
			console.log('updateImageProps: ', updateImageProps)
			appContext.setImagesProcessing((oldImages) => {
				return [...new Set([...oldImages, targetInput])];
			});
			const res = await electroview.rpc?.request.updateImage(updateImageProps);
			if (typeof res !== 'undefined') {
				console.log(res)
				appContext.setImages((images) =>
					images.map((image) => {
						if (image.input === targetInput) {
							// Keep current selection state in case user selected another image while this request was in flight.
							return { ...res.image, isActive: image.isActive };
						} else {
							return image;
						}
					})
				);
			}
			else {
				toast(t('unableToUpdateImage'), {
					className: 'hottoast',
				});
			}
		}
		catch (error) {
			console.log('updateImageprops error: ', typeof error);
			handleRPCRequestCatch(error);
		}
		finally {
			appContext.setImagesProcessing((oldImages) => {
				return oldImages.filter(oldImage => oldImage !== targetInput);
			});
		}
	}

	const mouseDownHandler = () => {
		mouseDownQualityEffort.current = { quality: appContext.quality, effort: appContext.effort };
	}

	const mouseUpHandler = () => {
		const targetInput = activeImage.input;
		const quality = appContext.quality;
		const effort = appContext.effort;

		// bail if quality and effort hasn't changed
		if (quality === mouseDownQualityEffort.current.quality && effort === mouseDownQualityEffort.current.effort) {
			return;
		}

		if (mouseUpDebounceRef.current) {
			clearTimeout(mouseUpDebounceRef.current);
		}
		mouseUpDebounceRef.current = setTimeout(() => {
			updateImage(targetInput, quality, effort);
		}, 500);
	}

	return (
		<div className="imagescanvas">
			<div className="imagescanvas-col">
				<div className="imagescanvas-col-header">{t('input')}</div>
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
				<div className="imagescanvas-col-header">{t('output')}</div>
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
				<div className={"imagescanvas-sliders-loading " + (appContext.imagesProcessing.filter(input => activeImage.input === input).length ? 'active' : '')}>
					<div className={"imagescanvas-sliders-loading-icon " + (appContext.imagesProcessing.filter(input => activeImage.input === input).length ? 'active' : '')}></div>
				</div>
				<label className="imagescanvas-sliders-slider">
					<div className="imagescanvas-sliders-slider-label">
						<span className="imagescanvas-sliders-slider-label-span" data-tooltip-id="quality">{t('quality')}</span>
					</div>
					<input onChange={(e) => inputHandler('quality', e)} onMouseDown={mouseDownHandler} onMouseUp={mouseUpHandler} className="imagescanvas-sliders-slider-input" type="range" min="1" max="100" value={appContext.quality} />
					<div className="imagescanvas-sliders-slider-inputvalue">{appContext.quality}</div>
				</label>
				<label className="imagescanvas-sliders-slider">
					<div className="imagescanvas-sliders-slider-label">
						<span className="imagescanvas-sliders-slider-label-span" data-tooltip-id="effort">{t('effort')}</span>
					</div>
					<input onChange={(e) => inputHandler('effort', e)} onMouseDown={mouseDownHandler} onMouseUp={mouseUpHandler} className="imagescanvas-sliders-slider-input" type="range" min="0" max="6" value={appContext.effort} />
					<div className="imagescanvas-sliders-slider-inputvalue">{appContext.effort}</div>
				</label>
			</div>
			<Tooltip
				id="quality"
				place="top"
				content={t('qualityTooltip')}
				className="tooltip"
			/>
			<Tooltip
				id="effort"
				place="top"
				content={t('effortTooltip')}
				className="tooltip"
			/>
		</div>
	);

}
