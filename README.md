# Markdown Viewer

A web-based Markdown **viewer and editor** built with React, Vite, and MUI.
Edit Markdown directly in the browser and see a live preview, or upload / drag &
drop `.md` files to view them.

## Features

- **Multi-document workspace** — keep several documents open, switch between
  them in the left sidebar, and rename (double-click) or close them
- **Live editing** with an instant split-pane preview
- **Upload** or **drag & drop** `.md` / `.markdown` / `.txt` files (each opens
  as its own document)
- **Download** and **copy** the active document
- **GitHub Flavored Markdown** — tables, task lists, strikethrough, autolinks
- **Syntax-highlighted** code blocks (highlight.js)
- **Six themes** — Light: *Primer*, *Manuscript*, *Porcelain* · Dark:
  *Graphite*, *Night*, *Terminal* (a green-phosphor CRT theme)
- Three view modes: editor only, split, or preview only
- Documents, active tab, and theme are all auto-saved to the browser

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (defaults to http://localhost:5173).

## Build for production

```bash
npm run build     # outputs to dist/
npm run preview   # serve the production build locally
```

## Tech stack

- [React 18](https://react.dev) + [Vite](https://vite.dev)
- [MUI](https://mui.com) for UI components and theming
- [react-markdown](https://github.com/remarkjs/react-markdown) with
  `remark-gfm`, `rehype-raw`, and `rehype-highlight`
```
