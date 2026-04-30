import type { ElectrobunConfig } from "electrobun";
import pkg from "./package.json" with { type: "json" };

export default {
	app: {
		name: pkg.name,
		identifier: "com.moop.moop",
		version: pkg.version,
	},
	build: {
		views: {
			mainview: {
				entrypoint: "src/mainview/index.tsx",
			},
		},
		bun: {
			entrypoint: "src/bun/index.ts",
		},
		copy: {
			"node_modules/@img/sharp-darwin-arm64": "bun/node_modules/@img/sharp-darwin-arm64",
			"node_modules/@img/sharp-libvips-darwin-arm64": "bun/node_modules/@img/sharp-libvips-darwin-arm64",
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
	runtime: {
		exitOnLastWindowClosed: true
	},
	release: {
		baseUrl: "https://github.com/zrubinrattet/moop/releases/latest/download"
	}
} satisfies ElectrobunConfig;
