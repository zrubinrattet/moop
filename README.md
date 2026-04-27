# moop

![moop](icon.iconset/icon_128x128.png)

A desktop app for batch image optimization, built with Electrobun (Bun + React).

## What It Does
- Drag/drop local images
- Batch processing with quality/effort and output format controls
- Output management in app-specific input/output folders
- Max width/height support
- Multi-language UI support
- Animated image support

## Supported File Types
- Input: `jpeg/jpg`, `png`, `webp`, `tiff/tif`, `gif`, `svg/svgz`, `avif`
- Output: `webp`, `png`, `jpeg`

## Developer

### Architecture
- `src/bun`: runtime process, RPC handlers, routes, processing queue
- `src/mainview`: React UI
- `src/shared`: contracts shared by runtime and UI
- `src/bun/shared`: runtime-only shared helpers
- `src/mainview/shared`: UI-only shared helpers
- `src/lang`: localization dictionaries and locale helpers

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
```
