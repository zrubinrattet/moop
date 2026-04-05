import { useContext } from "react";
import { sharedContext } from "../../shared/shared-context";
import { formatBytes } from "../../shared/shared-snippets";
import Cropper from 'react-easy-crop'

export default function ImagesCanvas() {
	const appContext = useContext(sharedContext);
	
	const inputHandler = (e: React.InputEvent) => {
		if (e.target instanceof HTMLInputElement && e.target.nextElementSibling instanceof HTMLElement) {
			e.target.nextElementSibling.innerHTML = e.target.value;
		}
	}
	const mouseUpHandler = (e: React.MouseEvent) => {
		// send request to server
		console.log(e)
	}

	return (
		<div className="imagescanvas">
			<div className="imagescanvas-col">
				<div className="imagescanvas-col-header">Input</div>
				<div className="imagescanvas-col-bg">
					<Cropper
						image={appContext.activeImage.input}
						crop={appContext.crop}
						zoom={appContext.zoom}
						maxZoom={10}
						onCropChange={appContext.setCrop}
						onZoomChange={appContext.setZoom}
					/>
				</div>
				<div className="imagescanvas-col-footer">{formatBytes(appContext.activeImage.inputSizeBytes)}</div>
			</div>
			<div className="imagescanvas-col">
				<div className="imagescanvas-col-header">Output</div>
				<div className="imagescanvas-col-bg">
					<Cropper
						image={appContext.activeImage.output}
						crop={appContext.crop}
						zoom={appContext.zoom}
						maxZoom={10}
						onCropChange={appContext.setCrop}
						onZoomChange={appContext.setZoom}
					/>
				</div>
				<div className="imagescanvas-col-footer">{formatBytes(appContext.activeImage.outputSizeBytes)}</div>
			</div>
			<div className="imagescanvas-sliders">
				<label className="imagescanvas-sliders-slider">
					<span className="imagescanvas-sliders-slider-label">Quality</span>
					<input onInput={inputHandler} onMouseUp={mouseUpHandler} className="imagescanvas-sliders-slider-input" type="range" min="0" max="100" defaultValue="75" />
					<div className="imagescanvas-sliders-slider-inputvalue">75</div>
				</label>
				<label className="imagescanvas-sliders-slider">
					<span className="imagescanvas-sliders-slider-label">Effort</span>
					<input onInput={inputHandler} onMouseUp={mouseUpHandler} className="imagescanvas-sliders-slider-input" type="range" min="0" max="6" defaultValue="3" />
					<div className="imagescanvas-sliders-slider-inputvalue">3</div>
				</label>
			</div>
		</div>
	);
}
