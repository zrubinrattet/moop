import { sharedContext, } from "../../shared/shared-context";
import { useContext, useEffect, useRef, useState } from "react";
import { formatBytes } from "../../shared/shared-snippets";
import Cropper from 'react-easy-crop'
import { electroview } from "../../shared/shared-electroview";
import { Tooltip } from "react-tooltip";
import toast from "react-hot-toast";
import { t } from "../lang/lang";
import { handleRPCRequestCatch } from "../../shared/shared-utils";
import Select from "react-select";
import type { AvailableOutputFormats } from "../../shared/shared-types";

export default function ImagesCanvas() {
	const appContext = useContext(sharedContext);
	const mouseUpDebounceRef = useRef<NodeJS.Timeout>(null);
	const mouseDownFieldValues = useRef({ outputFormat: appContext.settings.outputFormat, quality: 0, effort: 0 });

	const activeImage = appContext.images.find(image => image.isActive);

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

	const updateImage = async (targetInput: string, quality: number, effort: number, outputFormat: AvailableOutputFormats) => {
		try {
			const updateImageProps = {
				path: targetInput,
				quality,
				effort,
				outputFormat: outputFormat
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
		mouseDownFieldValues.current = { quality: appContext.quality, effort: appContext.effort, outputFormat: activeImage.outputFormat };
	}

	const mouseUpHandler = (outputFormat?: AvailableOutputFormats) => {
		const targetInput = activeImage.input;
		const quality = appContext.quality;
		const effort = appContext.effort;

		// bail if fields hasn't changed
		if (
			quality === mouseDownFieldValues.current.quality
			&&
			effort === mouseDownFieldValues.current.effort
			&&
			outputFormat === mouseDownFieldValues.current.outputFormat
		) {
			return;
		}

		if (mouseUpDebounceRef.current) {
			clearTimeout(mouseUpDebounceRef.current);
		}
		mouseUpDebounceRef.current = setTimeout(() => {
			updateImage(targetInput, quality, effort, outputFormat || activeImage.outputFormat);
		}, 500);
	}

	const outputFormatOptions: Array<{ value: AvailableOutputFormats; label: string }> = [
		{ value: 'webp', label: 'WebP' },
		{ value: 'png', label: 'PNG' },
		{ value: 'jpeg', label: 'JPEG' },
	];

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
			<div className="imagescanvas-fields">
				<div className={"imagescanvas-fields-loading " + (appContext.imagesProcessing.filter(input => activeImage.input === input).length ? 'active' : '')}>
					<div className={"imagescanvas-fields-loading-icon " + (appContext.imagesProcessing.filter(input => activeImage.input === input).length ? 'active' : '')}></div>
				</div>
				<label className="imagescanvas-fields-slider">
					<div className="imagescanvas-fields-slider-label">
						<span className="imagescanvas-fields-slider-label-span" data-tooltip-id="quality">{t('quality')}</span>
					</div>
					<input onChange={(e) => inputHandler('quality', e)} onMouseDown={mouseDownHandler} onMouseUp={mouseUpHandler} className="imagescanvas-fields-slider-input" type="range" min="1" max="100" value={appContext.quality} />
					<div className="imagescanvas-fields-slider-inputvalue">{appContext.quality}</div>
				</label>
				{['webp', 'png'].filter(format => activeImage.outputFormat === format).length ? <label className="imagescanvas-fields-slider">
					<div className="imagescanvas-fields-slider-label">
						<span className="imagescanvas-fields-slider-label-span" data-tooltip-id="effort">{t('effort')}</span>
					</div>
					<input onChange={(e) => inputHandler('effort', e)} onMouseDown={mouseDownHandler} onMouseUp={mouseUpHandler} className="imagescanvas-fields-slider-input" type="range" min={activeImage.outputFormat === 'webp' ? 0 : 1} max={activeImage.outputFormat === 'webp' ? 6 : 10} value={appContext.effort} />
					<div className="imagescanvas-fields-slider-inputvalue">{appContext.effort}</div>
				</label> : ''}
				<label className="imagescanvas-fields-select">
					<div className="imagescanvas-fields-select-label">
						<span className="imagescanvas-fields-select-label-span" data-tooltip-id="format">{t('format')}</span>
					</div>
					<Select
						inputId="outputFormat"
						name="outputFormat"
						className="imagescanvas-fields-select-select"
						options={outputFormatOptions}
						value={outputFormatOptions.find(option => option.value === activeImage.outputFormat)}
						onChange={(option) => mouseUpHandler(option?.value)}
						onMenuOpen={mouseDownHandler}
						menuPlacement="top"
					/>
				</label>
			</div>
			<Tooltip
				id="format"
				place="top"
				content={t('formatTooltip')}
				className="tooltip"
			/>
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
