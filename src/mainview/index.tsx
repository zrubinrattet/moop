import App from './app';
import { createRoot } from 'react-dom/client';

const rootEl = document.querySelector('body');

if (rootEl instanceof HTMLElement) {
	// mount react app
	const reactRoot = createRoot(rootEl);
	reactRoot.render(<App />);
	
	

	// over class that enables pointer-events: all so dragdrop el can recieve drag events.
	window.ondragenter = () => {
		const dragDrop = document.querySelector('.dragdrop');
		if( dragDrop instanceof HTMLElement ) {
			dragDrop.classList.add('over')
		}
	}
	window.ondragend = () => {
		const dragDrop = document.querySelector('.dragdrop');
		if( dragDrop instanceof HTMLElement ) {
			dragDrop.classList.remove('over')
		}
	}
}


