# Markdown Viewer

A web-based Markdown **viewer and editor** built with React, Vite, and MUI.
Edit Markdown directly in the browser and see a live preview, or upload / drag &
drop `.md` files to view them.

## Features

- **Live editing** with an instant split-pane preview
- **Upload** or **drag & drop** `.md` / `.markdown` / `.txt` files
- **Download** and **copy** your document
- **GitHub Flavored Markdown** — tables, task lists, strikethrough, autolinks
- **Syntax-highlighted** code blocks (highlight.js)
- **Light / dark** theme, with your content auto-saved to the browser
- Three view modes: editor only, split, or preview only
- Warm, editorial "paper" aesthetic with serif reading typography

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
