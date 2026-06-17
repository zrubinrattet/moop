# Changelog

All notable changes to moop will be documented in this file.

## [1.1.0] - 2026-06-17

### Added
- Added AVIF output support, including animated AVIF output for animated inputs.
- Added APNG output support for animated PNG, GIF, WebP, and AVIF workflows.
- Added broader conversion test coverage across JPEG, PNG, WebP, AVIF, SVG, TIFF, GIF, APNG, and animated WebP inputs.
- Added server preflight and 404 route tests.

### Changed
- Made AVIF the default output format.
- Organized available output formats in the app UI and settings copy.

### Fixed
- Improved image deletion handling so removing a list item no longer triggers a missing output image error.

## [1.0.1] - 2026-05-13

### Added
- Improved error handling for large images.

## [1.0.0] - 2026-04-30

### Added
- First stable macOS release of moop.
- Batch drag-and-drop image optimization.
- Support for JPEG, PNG, WebP, TIFF, GIF, SVG, and AVIF input.
- WebP, PNG, and JPEG output formats.
- Quality, effort, and max width/height controls.
- Per-image output settings and app-managed input/output folders.
- Multi-language UI support.
- Animated GIF and WebP support.
- Project website favicon, manifest, social preview, and FAQ updates.

### Fixed
- Fixed the release update/download URL to resolve assets from the latest GitHub release.
