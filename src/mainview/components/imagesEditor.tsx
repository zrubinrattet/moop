import { useContext, useEffect, useRef } from "react";
import { sharedContext } from "../shared/context";
import ImagesList from "./imagesList";
import ImagesCanvas from "./imagesCanvas";
import { electroview } from "../shared/electroview";
import toast from "react-hot-toast";
import { t } from "../../lang/lang";
import { handleRPCRequestCatch } from "../shared/utils";
import { eventBus } from "../shared/eventbus";


export default function ImagesEditor() {
	const appContext = useContext(sharedContext);
	const { images, setImages } = appContext;
	const pollInputsRef = useRef<NodeJS.Timeout>(null);
	const isClearing = useRef<boolean>(false);

	// update imageseditor UI if images go missing from the filesystem
	useEffect(() => {
		async function pollInputs() {
			if (isClearing.current) {
				return;
			}
			try {
				const res = await electroview.rpc?.request.pollInputs();
				if (res && res.inputPaths.length < images.length && images.length) {
					setImages((oldImages) =>
						oldImages.filter(oldImage => res.inputPaths.includes(oldImage.input))
					);
					toast(t('imagesMissing'), { className: 'hottoast' });
				}
			} catch (error) {
				handleRPCRequestCatch(error)
			}

		}
		const pollSpeed = 3000;
		try {
			pollInputsRef.current = setInterval(pollInputs, pollSpeed);
		} catch {
			if (null !== pollInputsRef.current) {
				clearInterval(pollInputsRef.current);
			}
		}
		const startPolling = () => {
			isClearing.current = false;
		}
		const clearPolling = () => {
			isClearing.current = true;
		}
		
		eventBus.addEventListener('clearAllStart', clearPolling);
		eventBus.addEventListener('clearAllDone', startPolling);

		return () => {
			eventBus.removeEventListener('clearAllStart', clearPolling);
			eventBus.removeEventListener('clearAllDone', startPolling)
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