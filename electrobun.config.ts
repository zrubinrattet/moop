import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "moop",
		identifier: "com.moop.moop",
		version: "0.0.1",
	},
	build: {
		views: {
			mainview: {
				entrypoint: "src/mainview/index.tsx"
			},
		},
		copy: {
			"src/mainview/index.html": "views/mainview/index.html",
			"src/mainview/index.css": "views/mainview/index.css",
			"src/mainview/index.css.map": "views/mainview/index.css.map",
			"src/mainview/fonts/MadimiOne-Regular.woff2": "views/mainview/fonts/MadimiOne-Regular.woff2",
			"src/mainview/fonts/FuturaLT.woff2": "views/mainview/fonts/FuturaLT.woff2",
			"src/mainview/fonts/FuturaLT-Bold.woff2": "views/mainview/fonts/FuturaLT-Bold.woff2"
		},
		mac: {
			bundleCEF: false,
		},
		linux: {
			bundleCEF: false,
			icon: "icon.iconset/icon_256x256.png",
		},
		win: {
			bundleCEF: false,
			icon: "icon.iconset/icon_256x256.png",
		},
	},
} satisfies ElectrobunConfig;
