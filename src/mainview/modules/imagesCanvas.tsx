import { useContext, } from "react";
import { AppRPCSchema } from '../../shared/shared-types';
import { sharedContext, } from "../../shared/shared-context";
import { formatBytes } from "../../shared/shared-snippets";
import Cropper from 'react-easy-crop'
import { Electroview } from "electrobun/view";


const rpc = Electroview.defineRPC<AppRPCSchema>({
	maxRequestTime: 30000,
	handlers: {
		requests: {},
		messages: {},
	},
});

const electroview = new Electroview({ rpc });
export default function ImagesCanvas() {
	const appContext = useContext(sharedContext);
	// send request to server
	const activeImage = appContext.images.find(image => image.isActive);
	console.log('activeimage:', activeImage);

	const inputHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target instanceof HTMLInputElement && e.target.nextElementSibling instanceof HTMLElement) {
			if (e.target.previousElementSibling?.innerHTML === 'Quality') {
				appContext.setQuality(Number(e.target.value))
			}
			else if (e.target.previousElementSibling?.innerHTML === 'Effort') {
				appContext.setEffort(Number(e.target.value))
			}
		}
	}

	const mouseUpHandler = async () => {
		try {
			if ('undefined' === typeof activeImage) {
				return;
			}
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
	if (activeImage) {
		return (
			<div className="imagescanvas">
				<div className="imagescanvas-col">
					<div className="imagescanvas-col-header">Input</div>
					<div className="imagescanvas-col-bg">
						<Cropper
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
						<span className="imagescanvas-sliders-slider-label">Quality</span>
						<input onChange={inputHandler} onMouseUp={mouseUpHandler} className="imagescanvas-sliders-slider-input" type="range" min="1" max="100" value={appContext.quality} />
						<div className="imagescanvas-sliders-slider-inputvalue">{appContext.quality}</div>
					</label>
					<label className="imagescanvas-sliders-slider">
						<span className="imagescanvas-sliders-slider-label">Effort</span>
						<input onChange={inputHandler} onMouseUp={mouseUpHandler} className="imagescanvas-sliders-slider-input" type="range" min="0" max="6" value={appContext.effort} />
						<div className="imagescanvas-sliders-slider-inputvalue">{appContext.effort}</div>
					</label>
				</div>
			</div>
		);
	}
}
