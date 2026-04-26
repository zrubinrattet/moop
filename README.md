# moop

![moop](icon.iconset/icon_128x128.png)

A simple desktop image optimizer for the web.


## Getting Started

1. Install dependencies:
   ```bash
   bun install
   ```

2. Run in development mode:
   ```bash
   bun run dev
   ```

3. Build for production:
   ```bash
   bun run build:stable
   ```

## Project Structure

```
src/
├── bun/
│   └── index.ts      # Main process - creates and manages windows
└── mainview/
    ├── index.html    # Entry point HTML
    ├── index.css     # Styles
    └── index.ts      # View logic
```
