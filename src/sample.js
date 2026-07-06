export const SAMPLE_MARKDOWN = `# Markdown Feature Atlas

A live editor and reader for Markdown. Type on the left; the rendered document
appears on the right. Markdown works best when the source stays readable first —
and it should still feel good once rendered.

## Quick scan

You can write **bold**, *italic*, ***bold italic***, ~~strikethrough~~, and
\`inline code\`. Use an [internal jump](#tables-and-data) or an
[external link](https://www.markdownguide.org). Automatic URL preview:
https://github.com

> Blockquotes are useful for setting a passage apart from the main text.

## Tables and data

| Syntax        | Example              | Status |
| ------------- | -------------------- | ------ |
| Inline math   | \`$E = mc^2$\`         | Ready  |
| GitHub tables | \`| cell |\`           | Ready  |
| Task lists    | \`- [ ] item\`         | Ready  |

## Task list

- [x] Set up the project
- [x] Render Markdown with GitHub Flavored extensions
- [ ] Bring your own source

## Code blocks

\`\`\`ts
function greet(name: string): string {
  return \`Hello, \${name}\`;
}

console.log(greet('world'));
\`\`\`

## Bring the source you already have

Upload a file, drag it onto the page, or paste Markdown directly into the editor.
Everything renders instantly and your work is kept in the browser between visits.

---

Built with React and MUI.
`;
