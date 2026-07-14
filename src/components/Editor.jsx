import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
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

// Text metrics shared byte-for-byte between the textarea and the overlay
// layers behind it — any mismatch would drift the painted layers off the caret.
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

const Editor = forwardRef(function Editor(
  { value, onChange, highlight = true, matches = [], currentMatch = null, revealKey = 0 },
  ref
) {
  const theme = useTheme();
  const e = theme.editorial;
  const dark = theme.palette.mode === 'dark';
  const preRef = useRef(null);
  const searchRef = useRef(null);
  const taRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => taRef.current?.focus(),
    getSelection: () => {
      const t = taRef.current;
      return t ? t.value.slice(t.selectionStart, t.selectionEnd) : '';
    },
    // Replaces [start, end) via execCommand so the textarea's native undo
    // stack survives. Returns false if unsupported — caller falls back to a
    // plain state update.
    replaceSelection: (start, end, text) => {
      const t = taRef.current;
      if (!t || typeof document.execCommand !== 'function') return false;
      t.focus();
      t.setSelectionRange(start, end);
      return document.execCommand('insertText', false, text);
    },
  }));

  // Trailing newline keeps the highlight layer from collapsing the final blank
  // line, so it never comes up short against the textarea. Skipped entirely
  // when highlighting is off.
  const html = useMemo(
    () => (highlight ? Prism.highlight(value + '\n', Prism.languages.markdown, 'markdown') : ''),
    [value, highlight]
  );

  // Search-match overlay content: plain text segments interleaved with <mark>
  // spans. Built from React elements (auto-escaped), so no HTML injection.
  const searchSegments = useMemo(() => {
    if (!matches.length) return null;
    const out = [];
    let pos = 0;
    matches.forEach((m, i) => {
      if (m.start > pos) out.push(value.slice(pos, m.start));
      const isCurrent =
        currentMatch && m.start === currentMatch.start && m.end === currentMatch.end;
      out.push(
        <Box
          component="mark"
          key={i}
          data-current={isCurrent ? 'true' : undefined}
          sx={{
            color: 'transparent',
            borderRadius: '2px',
            bgcolor: `${theme.palette.primary.main}${isCurrent ? '66' : '2e'}`,
            ...(isCurrent && { outline: `1px solid ${theme.palette.primary.main}` }),
          }}
        >
          {value.slice(m.start, m.end)}
        </Box>
      );
      pos = m.end;
    });
    out.push(value.slice(pos) + '\n');
    return out;
  }, [value, matches, currentMatch, theme.palette.primary.main]);

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
    for (const layer of [preRef.current, searchRef.current]) {
      if (!layer) continue;
      layer.scrollTop = ev.target.scrollTop;
      layer.scrollLeft = ev.target.scrollLeft;
    }
  };

  const hasMarks = Boolean(searchSegments);

  // A freshly mounted overlay starts at scroll 0 — snap it to the textarea.
  useLayoutEffect(() => {
    if (hasMarks && taRef.current) syncScroll({ target: taRef.current });
  }, [hasMarks]);

  // Reveal the current match: select it in the textarea (without stealing
  // focus) and scroll it into view. The overlay's own <mark> is the
  // measurement — no mirror element needed. Keyed on revealKey — bumped by
  // App only on explicit navigation — rather than on currentMatch, whose
  // identity changes on every edit (revealing then would move the caret
  // while the user types).
  const currentMatchRef = useRef(null);
  currentMatchRef.current = currentMatch;

  useLayoutEffect(() => {
    const t = taRef.current;
    const cm = currentMatchRef.current;
    if (!revealKey || !cm || !t) return;
    t.setSelectionRange(cm.start, cm.end);
    const mark = searchRef.current?.querySelector('[data-current]');
    if (!mark) return;
    const top = mark.offsetTop;
    if (top < t.scrollTop + 40 || top > t.scrollTop + t.clientHeight - 60) {
      t.scrollTop = Math.max(0, top - t.clientHeight / 2);
      syncScroll({ target: t });
    }
  }, [revealKey]);

  return (
    <Box sx={{ position: 'relative', flex: 1, minWidth: 0, height: '100%', overflow: 'hidden' }}>
      {hasMarks && (
        <Box
          ref={searchRef}
          component="pre"
          aria-hidden
          sx={{
            ...textStyles,
            position: 'absolute',
            inset: 0,
            overflow: 'auto',
            pointerEvents: 'none',
            color: 'transparent',
            bgcolor: 'transparent',
          }}
        >
          {searchSegments}
        </Box>
      )}
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
        ref={taRef}
        value={value}
        onChange={(ev) => onChange(ev.target.value)}
        onScroll={syncScroll}
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
});

export default Editor;
