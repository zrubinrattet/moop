import './index.scss';
import App from './app';
import { createRoot } from 'react-dom/client';

const rootEl = document.querySelector('body');

if( rootEl instanceof HTMLElement ){
	const reactRoot = createRoot(rootEl);
	reactRoot.render(<App />);
	console.log("Hello Electrobun view loaded!");
}