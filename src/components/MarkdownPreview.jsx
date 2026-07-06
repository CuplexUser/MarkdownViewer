import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { Box, useTheme } from '@mui/material';
import { fonts } from '../theme';

// Import highlight.js themes as raw strings so we can swap them at runtime.
import githubLight from 'highlight.js/styles/github.css?inline';
import githubDark from 'highlight.js/styles/github-dark.css?inline';

const HLJS_STYLE_ID = 'hljs-theme';

// Injects the correct highlight.js theme for the current color scheme.
function useHighlightTheme(scheme) {
  useEffect(() => {
    let el = document.getElementById(HLJS_STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = HLJS_STYLE_ID;
      document.head.appendChild(el);
    }
    el.textContent = scheme === 'dark' ? githubDark : githubLight;
  }, [scheme]);
}

export default function MarkdownPreview({ source }) {
  const theme = useTheme();
  const e = theme.editorial;
  useHighlightTheme(e.hljs);

  const glow = e.glow ? { textShadow: `0 0 10px ${theme.palette.primary.main}66` } : {};

  return (
    <Box
      sx={{
        px: { xs: 3, sm: 5 },
        py: { xs: 3, sm: 5 },
        maxWidth: 760,
        mx: 'auto',
        color: e.readerText,
        fontFamily: e.readerFont,
        fontSize: 17,
        lineHeight: 1.75,
        wordWrap: 'break-word',
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          fontFamily: e.displayFont,
          color: e.heading,
          fontWeight: 600,
          lineHeight: 1.25,
          mt: 4,
          mb: 1.5,
          ...glow,
        },
        '& h1': { fontSize: '2.1rem', mt: 1, letterSpacing: '-0.01em' },
        '& h2': {
          fontSize: '1.55rem',
          borderBottom: `1px solid ${e.line}`,
          pb: 0.75,
        },
        '& h3': { fontSize: '1.25rem' },
        '& h4': { fontSize: '1.05rem' },
        '& p': { my: 2 },
        '& a': {
          color: theme.palette.primary.main,
          textDecoration: 'none',
          borderBottom: `1px solid ${theme.palette.primary.main}55`,
        },
        '& a:hover': { borderBottomColor: theme.palette.primary.main },
        '& ul, & ol': { pl: 3.5, my: 2 },
        '& li': { my: 0.75 },
        '& li::marker': { color: e.muted },
        '& li input[type="checkbox"]': { mr: 1, accentColor: theme.palette.primary.main },
        '& blockquote': {
          borderLeft: `3px solid ${theme.palette.primary.main}`,
          m: '20px 0',
          pl: 2.5,
          py: 0.25,
          color: e.muted,
          fontStyle: e.readerFont === fonts.mono ? 'normal' : 'italic',
        },
        '& code': {
          fontFamily: fonts.mono,
          fontSize: '0.85em',
          bgcolor: e.codeBg,
          px: 0.75,
          py: 0.25,
          borderRadius: 1.5,
        },
        '& pre': {
          bgcolor: e.preBg,
          border: `1px solid ${e.line}`,
          borderRadius: 3,
          p: 2.25,
          overflow: 'auto',
          my: 2.5,
          fontFamily: fonts.mono,
        },
        '& pre code': { bgcolor: 'transparent', p: 0, fontSize: '0.82rem', lineHeight: 1.6 },
        '& img': { maxWidth: '100%', borderRadius: 2 },
        '& hr': { border: 'none', borderTop: `1px solid ${e.line}`, my: 4 },
        '& table': {
          borderCollapse: 'collapse',
          width: '100%',
          my: 2.5,
          fontFamily: e.readerFont === fonts.serif ? fonts.sans : e.readerFont,
          fontSize: '0.95rem',
          display: 'block',
          overflowX: 'auto',
        },
        '& th, & td': { border: `1px solid ${e.line}`, px: 1.75, py: 1 },
        '& th': {
          bgcolor: e.codeBg,
          fontWeight: 600,
          textAlign: 'left',
          color: e.heading,
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeHighlight, { detect: true, ignoreMissing: true }]]}
      >
        {source}
      </ReactMarkdown>
    </Box>
  );
}
