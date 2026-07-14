// vitest/config re-exports Vite's defineConfig with the `test` field typed in.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the build works from any path — a user/org page
  // (https://user.github.io/) or a project page (https://user.github.io/repo/).
  base: './',
  build: {
    rollupOptions: {
      output: {
        // Split heavy dependencies into cacheable, parallel-loaded chunks.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('highlight.js') || id.includes('lowlight')) return 'highlight';
          if (id.includes('@mui') || id.includes('@emotion')) return 'mui';
          // Match the whole markdown/unified ecosystem (packages are hyphenated,
          // e.g. remark-gfm, micromark-util-*, mdast-util-*), so [^\\/]* lets a
          // prefix match the rest of the package-name segment.
          if (
            /[\\/](react-markdown|remark|rehype|micromark|mdast|hast|unist|unified|vfile|property-information|parse-entities|character-entities|character-reference|decode-named-character-reference|markdown-table|devlop|trough|bail|zwitch|longest-streak|ccount|escape-string-regexp|trim-lines|web-namespaces|html-void-elements|space-separated-tokens|comma-separated-tokens|stringify-entities|estree|is-plain-obj|mdurl)[^\\/]*[\\/]/.test(
              id
            )
          ) {
            return 'markdown';
          }
          if (/[\\/](react|react-dom|react-is|scheduler)[\\/]/.test(id)) return 'react';
          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  test: {
    environment: 'jsdom',
    globals: true, // describe/it/expect without imports; also enables RTL auto-cleanup
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.test.{js,jsx}'],
    // Process CSS for real so the highlight.js `?inline` theme imports carry
    // their actual stylesheet text instead of Vitest's empty-string stub.
    css: true,
  },
});
