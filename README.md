# moop

![moop](icon.iconset/icon_128x128.png)

A desktop app for batch image optimization, built with Electrobun (Bun + React).

## What It Does
- Drag/drop or upload local images
- Batch processing with quality/effort and output format controls
- Output management in app-specific input/output folders
- Persisted application settings
- Multi-language UI support

## Architecture
- `src/bun`: runtime process, RPC handlers, routes, processing queue
- `src/mainview`: React UI
- `src/shared`: contracts shared by runtime and UI
- `src/bun/shared`: runtime-only shared helpers
- `src/mainview/shared`: UI-only shared helpers
- `src/lang`: localization dictionaries and locale helpers

## Getting Started
```bash
bun install
bun run dev
```

## Build
```bash
bun run build:dev
bun run build:canary
bun run build:stable
```

## Tests
```bash
bun test
```

Run targeted suites:

```bash
bun test tests/utility
bun test tests/rpc
```
