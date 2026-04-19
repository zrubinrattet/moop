import { useContext, useEffect, useRef } from "react";
import { sharedContext } from "../../shared/shared-context";
import ImagesList from "./imagesList";
import ImagesCanvas from "./imagesCanvas";
import { electroview } from "../../shared/shared-electroview";
import toast from "react-hot-toast";


export default function ImagesEditor() {
	const appContext = useContext(sharedContext);
	const { images, setImages } = appContext;
	const pollInputsRef = useRef<NodeJS.Timeout>(null);

	useEffect(() => {
		async function pollInputs() {
			try {
				const res = await electroview.rpc?.request.pollInputs();
				
				if (res && res.inputPaths.length < images.length) {
					setImages((oldImages) =>
						oldImages.filter(oldImage => res.inputPaths.includes(oldImage.input))
					);
					toast('Image(s) missing from filesystem.', { className: 'hottoast' });
				}
				else {
					console.log('no images missing!')
				}
			} catch (error) {
				if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
					toast(error.message, { className: 'hottoast' });
				}
			}

		}
		try {
			pollInputsRef.current = setInterval(pollInputs, 3000);
		} catch {
			if (null !== pollInputsRef.current) {
				clearInterval(pollInputsRef.current);
			}
		}
		return () => {
			if (null !== pollInputsRef.current) {
				clearInterval(pollInputsRef.current);
			}
		};
	}, [images, setImages])

	return (
		<div className={'imageseditor' + (appContext.imagesLoading || Object.keys(appContext.images).length > 0 ? ' active' : '')}>
			<ImagesList />
			<ImagesCanvas />
		</div>
	);

}