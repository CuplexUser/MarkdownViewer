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

## Deploy to GitHub Pages

This repo ships with a GitHub Actions workflow
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) that builds the
app and publishes it to GitHub Pages on every push to `main`.

One-time setup:

1. Push the project to a GitHub repository:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

2. In the repository, go to **Settings → Pages** and set **Source** to
   **GitHub Actions**.

That's it — the workflow runs on push and deploys automatically. The site works
at both project pages (`https://<you>.github.io/<repo>/`) and user/org pages
because the build uses relative asset paths (`base: './'` in `vite.config.js`).
You can also trigger a deploy manually from the **Actions** tab.

## Tech stack

- [React 18](https://react.dev) + [Vite](https://vite.dev)
- [MUI](https://mui.com) for UI components and theming
- [react-markdown](https://github.com/remarkjs/react-markdown) with
  `remark-gfm`, `rehype-raw`, and `rehype-highlight`
