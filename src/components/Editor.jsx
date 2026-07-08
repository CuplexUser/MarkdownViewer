import { useMemo, useRef } from 'react';
import { Box, useTheme } from '@mui/material';
import Prism from 'prismjs';
// Grammar order matters: each language augments the shared Prism singleton, and
// dependents must load after their base (clike → js → ts; markup → markdown).
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markdown';
import { fonts } from '../theme';

// Per-language token colours for fenced code, tuned per light/dark so they stay
// legible across all six editorial themes. Markdown's own structure (headings,
// links, emphasis) is coloured from the editorial tokens instead.
const codePalette = (dark) =>
  dark
    ? {
        keyword: '#c792ea',
        string: '#c3e88d',
        number: '#f78c6c',
        type: '#82aaff',
        func: '#82aaff',
        tag: '#f07178',
        attr: '#ffcb6b',
        prop: '#89ddff',
      }
    : {
        keyword: '#a626a4',
        string: '#50a14f',
        number: '#b76b01',
        type: '#4078f2',
        func: '#4078f2',
        tag: '#e45649',
        attr: '#986801',
        prop: '#0184bc',
      };

// Text metrics shared byte-for-byte between the textarea and the highlight
// layer behind it — any mismatch would drift the coloured text off the caret.
const textStyles = {
  m: 0,
  p: { xs: 2.5, sm: 3.5 },
  border: 'none',
  fontFamily: fonts.mono,
  fontSize: 14,
  lineHeight: 1.75,
  letterSpacing: 0,
  tabSize: 2,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
};

export default function Editor({ value, onChange, highlight = true }) {
  const theme = useTheme();
  const e = theme.editorial;
  const dark = theme.palette.mode === 'dark';
  const preRef = useRef(null);

  // Trailing newline keeps the highlight layer from collapsing the final blank
  // line, so it never comes up short against the textarea. Skipped entirely
  // when highlighting is off.
  const html = useMemo(
    () => (highlight ? Prism.highlight(value + '\n', Prism.languages.markdown, 'markdown') : ''),
    [value, highlight]
  );

  const tokenColors = useMemo(() => {
    const c = codePalette(dark);
    return {
      // Code (embedded language grammars)
      '& .token.comment, & .token.prolog, & .token.doctype, & .token.cdata': {
        color: e.muted,
        fontStyle: 'italic',
      },
      '& .token.keyword, & .token.builtin, & .token.atrule, & .token.important': {
        color: c.keyword,
      },
      '& .token.string, & .token.char, & .token.attr-value, & .token.regex, & .token.url-link':
        { color: c.string },
      '& .token.number, & .token.boolean, & .token.constant, & .token.symbol': {
        color: c.number,
      },
      '& .token.function, & .token.class-name': { color: c.func },
      '& .token.tag, & .token.doctype .token.name': { color: c.tag },
      '& .token.attr-name': { color: c.attr },
      '& .token.property, & .token.selector': { color: c.prop },
      '& .token.builtin, & .token.namespace': { color: c.type },
      '& .token.operator, & .token.punctuation, & .token.entity': { color: e.muted },
      // Markdown structure (editorial tokens)
      '& .token.title, & .token.title .token.punctuation': {
        color: e.heading,
        fontWeight: 700,
      },
      '& .token.bold': { fontWeight: 700 },
      '& .token.italic': { fontStyle: 'italic' },
      '& .token.strike': { textDecoration: 'line-through' },
      '& .token.url, & .token.url .token.content': {
        color: e.accent,
        textDecoration: 'underline',
      },
      '& .token.blockquote.punctuation, & .token.hr.punctuation, & .token.list.punctuation':
        { color: e.accent },
      '& .token.code, & .token.code-snippet': { color: c.type },
      '& .token.code-language': { color: e.muted },
    };
  }, [dark, e]);

  const syncScroll = (ev) => {
    const pre = preRef.current;
    if (!pre) return;
    pre.scrollTop = ev.target.scrollTop;
    pre.scrollLeft = ev.target.scrollLeft;
  };

  return (
    <Box sx={{ position: 'relative', flex: 1, minWidth: 0, height: '100%', overflow: 'hidden' }}>
      {highlight && (
        <Box
          ref={preRef}
          component="pre"
          aria-hidden
          sx={{
            ...textStyles,
            ...tokenColors,
            position: 'absolute',
            inset: 0,
            overflow: 'auto',
            pointerEvents: 'none',
            color: e.readerText,
            bgcolor: 'transparent',
          }}
        >
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </Box>
      )}
      <Box
        component="textarea"
        value={value}
        onChange={(ev) => onChange(ev.target.value)}
        onScroll={highlight ? syncScroll : undefined}
        spellCheck={false}
        placeholder="Write or paste Markdown here…"
        sx={{
          ...textStyles,
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          outline: 'none',
          resize: 'none',
          overflow: 'auto',
          bgcolor: 'transparent',
          // Transparent text lets the highlight layer show through; when
          // highlighting is off the textarea paints its own text.
          color: highlight ? 'transparent' : e.readerText,
          caretColor: e.readerText,
          '&::placeholder': { color: theme.palette.text.secondary, opacity: 0.7 },
          '&::selection': { background: `${theme.palette.primary.main}33` },
        }}
      />
    </Box>
  );
}
