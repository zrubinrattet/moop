<h1 align="center">moop</h1>
<p align="center">
    <img src="icon.iconset/icon_128x128.png" align="center">
</p>
<p align="center">A desktop app for batch image optimization.</p>
<p align="center">
    <a href="https://github.com/zrubinrattet/moop/actions/workflows/tests.yml"><img src="https://github.com/zrubinrattet/moop/actions/workflows/tests.yml/badge.svg" alt="CI" /></a>
    <a href="https://github.com/zrubinrattet/moop/actions/workflows/release.yml"><img src="https://github.com/zrubinrattet/moop/actions/workflows/release.yml/badge.svg" alt="Release" /></a>
    <a href="https://github.com/zrubinrattet/moop/releases"><img src="https://img.shields.io/github/v/release/zrubinrattet/moop" alt="Latest Release" /></a>
    <a href="https://github.com/zrubinrattet/moop/blob/main/LICENSE"><img src="https://img.shields.io/github/license/zrubinrattet/moop" alt="License" /></a>
</p>

## What It Does

* Drag/drop local images
* Batch processing with quality/effort and output format controls
* Output management in app-specific input/output folders
* Max width/height support
* Multi-language UI support
* Animated image support (webp & gif)

## Supported File Types

* Input: `jpeg/jpg`,  `png`,  `webp`,  `tiff/tif`,  `gif`,  `svg/svgz`,  `avif`
* Output: `webp`,  `png`,  `jpeg`

## Available Languages

English, Chinese, Hindi, Spanish, Arabic, French, Bengali, Portuguese, Indonesian, Urdu, Russian, German, Japanese, Marathi, Vietnamese, Telugu, Swahili, Hausa, Turkish, Punjabi, Filipino, Tamil, Persian, Korean, Amharic, Thai, Javanese, Italian, Gujarati, Kannada, Yoruba, Bhojpuri, Malayalam.

## Developer

### Architecture

* `src/bun`: runtime process, RPC handlers, routes, processing queue, menus
* `src/mainview`: React UI
* `src/shared`: shared by runtime and UI
* `src/bun/shared`: runtime-only shared helpers
* `src/mainview/shared`: UI-only shared helpers
* `src/lang`: localization dictionaries and locale helpers

### Getting Started

```bash
bun install
bun run dev
```

### Build

```bash
bun run build:dev
bun run build:canary
bun run build:stable
```

### Tests

```bash
bun test
```

Run targeted suites:

```bash
bun test tests/utility
bun test tests/rpc
bun test tests/routes
```
