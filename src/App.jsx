import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Button,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
  CssBaseline,
  Menu,
  MenuItem,
  ListSubheader,
  ListItemIcon,
  CircularProgress,
  useMediaQuery,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import UploadFileIcon from '@mui/icons-material/UploadFileOutlined';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import PaletteIcon from '@mui/icons-material/PaletteOutlined';
import CheckIcon from '@mui/icons-material/CheckOutlined';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebarOutlined';
import CodeIcon from '@mui/icons-material/CodeOutlined';
import SearchIcon from '@mui/icons-material/SearchOutlined';

import { getTheme, THEME_LIST, defaultThemeId } from './theme';
import { SAMPLE_MARKDOWN } from './sample';
import { buildSearchPattern, findMatches, replaceMatch, replaceAll, replacementText } from './search';
import Editor from './components/Editor';
import Sidebar from './components/Sidebar';
import FindPanel from './components/FindPanel';

// Lazy-loaded so react-markdown + highlight.js land in a deferred chunk and
// don't block the initial shell from painting.
const MarkdownPreview = lazy(() => import('./components/MarkdownPreview'));

const DOCS_KEY = 'markdown-viewer:docs';
const ACTIVE_KEY = 'markdown-viewer:active';
const THEME_KEY = 'markdown-viewer:theme';
const SPLIT_KEY = 'markdown-viewer:split';
const HL_KEY = 'markdown-viewer:highlight';
const LEGACY_KEY = 'markdown-viewer:content';

// Editor's share of the split view. Clamped so neither pane drops below 20%.
const MIN_SPLIT = 0.2;
const clampSplit = (r) => Math.min(1 - MIN_SPLIT, Math.max(MIN_SPLIT, r));

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function loadInitialDocs() {
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    /* fall through to seed */
  }
  const legacy = localStorage.getItem(LEGACY_KEY);
  return [{ id: uid(), name: 'Welcome', content: legacy ?? SAMPLE_MARKDOWN }];
}

const baseName = (fileName) => fileName.replace(/\.(md|markdown|txt)$/i, '') || fileName;
const safeFile = (name) => name.replace(/[^\w.-]+/g, '_') || 'document';

// True only for drags carrying OS files — lets internal drags (doc reordering)
// pass through without triggering the file-drop overlay.
const dragHasFiles = (ev) => Array.from(ev.dataTransfer?.types || []).includes('Files');

export default function App() {
  const isSmall = useMediaQuery('(max-width:900px)');

  const [themeId, setThemeId] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    // First visit: follow the browser's color-scheme preference.
    return defaultThemeId();
  });
  const [docs, setDocs] = useState(loadInitialDocs);
  const [activeId, setActiveId] = useState(() => {
    const stored = localStorage.getItem(ACTIVE_KEY);
    return stored || null;
  });
  const [view, setView] = useState('split');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [snack, setSnack] = useState('');
  const [themeAnchor, setThemeAnchor] = useState(null);
  const [splitRatio, setSplitRatio] = useState(() => {
    const stored = parseFloat(localStorage.getItem(SPLIT_KEY));
    return Number.isFinite(stored) ? clampSplit(stored) : 0.5;
  });
  const [highlight, setHighlight] = useState(() => localStorage.getItem(HL_KEY) === 'true');
  // ---- Find/replace state ----
  const [findOpen, setFindOpen] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [query, setQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [findOpts, setFindOpts] = useState({
    matchCase: false,
    wholeWord: false,
    regex: false,
    allDocs: false,
  });
  const [matchCursor, setMatchCursor] = useState(0);
  // Bumped on explicit navigation (open, query change, step); tells the
  // editor to select/scroll the current match. Deliberately NOT tied to the
  // match object itself, which is re-derived on every edit.
  const [revealKey, setRevealKey] = useState(0);
  const fileInputRef = useRef(null);
  const splitRef = useRef(null);
  const draggingRef = useRef(false);
  const editorRef = useRef(null);
  const findInputRef = useRef(null);

  const theme = useMemo(() => getTheme(themeId), [themeId]);
  const e = theme.editorial;

  // Falls back to the first doc when activeId is stale (e.g. the active doc was
  // deleted), so no separate effect is needed to reconcile activeId.
  const activeDoc = docs.find((d) => d.id === activeId) || docs[0];

  useEffect(() => {
    localStorage.setItem(THEME_KEY, themeId);
  }, [themeId]);

  useEffect(() => {
    if (activeDoc) localStorage.setItem(ACTIVE_KEY, activeDoc.id);
  }, [activeDoc]);

  useEffect(() => {
    const id = setTimeout(() => localStorage.setItem(DOCS_KEY, JSON.stringify(docs)), 400);
    return () => clearTimeout(id);
  }, [docs]);

  useEffect(() => {
    localStorage.setItem(SPLIT_KEY, String(splitRatio));
  }, [splitRatio]);

  useEffect(() => {
    localStorage.setItem(HL_KEY, String(highlight));
  }, [highlight]);

  const effectiveView = isSmall && view === 'split' ? 'preview' : view;
  const showSidebar = sidebarOpen && !isSmall;

  // ---- Split divider drag ----
  const startDividerDrag = useCallback((ev) => {
    ev.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMove = (ev) => {
      if (!draggingRef.current || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      if (rect.width) setSplitRatio(clampSplit((ev.clientX - rect.left) / rect.width));
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  // ---- Document operations ----
  const updateActiveContent = useCallback(
    (content) => {
      setDocs((prev) => prev.map((d) => (d.id === activeDoc?.id ? { ...d, content } : d)));
    },
    [activeDoc?.id]
  );

  const addDoc = useCallback((name, content) => {
    const doc = { id: uid(), name, content };
    setDocs((prev) => [...prev, doc]);
    setActiveId(doc.id);
    return doc;
  }, []);

  const renameDoc = useCallback((id, name) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, name } : d)));
  }, []);

  const deleteDoc = useCallback(
    (id) => {
      setDocs((prev) => {
        if (prev.length <= 1) return prev;
        return prev.filter((d) => d.id !== id);
      });
    },
    []
  );

  // Move the dragged doc to the hovered doc's position (live reorder).
  const reorderDoc = useCallback((dragId, overId) => {
    if (dragId === overId) return;
    setDocs((prev) => {
      const from = prev.findIndex((d) => d.id === dragId);
      const to = prev.findIndex((d) => d.id === overId);
      if (from < 0 || to < 0 || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const loadFile = useCallback(
    (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        addDoc(baseName(file.name), String(ev.target.result));
        setSnack(`Opened "${file.name}"`);
      };
      reader.onerror = () => setSnack('Could not read that file');
      reader.readAsText(file);
    },
    [addDoc]
  );

  const handleFileInput = (ev) => {
    Array.from(ev.target.files || []).forEach(loadFile);
    ev.target.value = '';
  };

  const handleDrop = useCallback(
    (ev) => {
      if (!dragHasFiles(ev)) return; // internal drag (doc reorder) — leave to Sidebar
      ev.preventDefault();
      setDragOver(false);
      Array.from(ev.dataTransfer.files || []).forEach(loadFile);
    },
    [loadFile]
  );

  const handleDownload = () => {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeFile(activeDoc.name)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setSnack(`Downloaded ${safeFile(activeDoc.name)}.md`);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeDoc?.content ?? '');
      setSnack('Copied Markdown to clipboard');
    } catch {
      setSnack('Copy failed — clipboard unavailable');
    }
  };

  const markdown = activeDoc?.content ?? '';
  const stats = useMemo(() => {
    const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
    return { words, chars: markdown.length };
  }, [markdown]);

  // ---- Find/replace ----
  const pattern = useMemo(() => buildSearchPattern(query, findOpts), [query, findOpts]);

  // Matches are derived, never stored: re-deriving from `docs` on every
  // change means edits, deletes, and doc switches can't leave stale results.
  const search = useMemo(() => {
    if (!findOpen || !pattern.source) return { list: [], capped: false };
    const scope = findOpts.allDocs ? docs : activeDoc ? [activeDoc] : [];
    let capped = false;
    const list = scope.flatMap((d) => {
      const r = findMatches(d.content, pattern.source, pattern.flags);
      if (r.capped) capped = true;
      return r.matches.map((m) => ({ ...m, docId: d.id }));
    });
    return { list, capped };
  }, [findOpen, pattern, docs, activeDoc, findOpts.allDocs]);

  const cursor = search.list.length ? Math.min(matchCursor, search.list.length - 1) : 0;
  const currentMatch = search.list[cursor] || null;
  const editorMatches = useMemo(
    () => search.list.filter((m) => m.docId === activeDoc?.id),
    [search, activeDoc]
  );

  // Highlights and the current-match selection live in the editor — force it
  // on screen when a find action needs to show something (opening, stepping,
  // replacing from preview-only view).
  const ensureEditorVisible = useCallback(() => {
    if (effectiveView === 'preview') setView(isSmall ? 'edit' : 'split');
  }, [effectiveView, isSmall]);

  const openFind = useCallback(
    (withReplace) => {
      const sel = editorRef.current?.getSelection();
      // Seed from the editor selection, but only when it actually changes the
      // query — otherwise Ctrl+H after stepping (which selects the current
      // match) would reset the cursor back to the first match.
      if (sel && !sel.includes('\n') && sel !== query) {
        setQuery(sel);
        setMatchCursor(0);
      }
      if (withReplace) setShowReplace(true);
      setFindOpen(true);
      ensureEditorVisible();
      setRevealKey((k) => k + 1);
      // Covers re-invocation while already open; the panel focuses itself on
      // first mount.
      requestAnimationFrame(() => findInputRef.current?.select());
    },
    [ensureEditorVisible, query]
  );

  const closeFind = useCallback(() => {
    setFindOpen(false);
    editorRef.current?.focus();
  }, []);

  const handleQueryChange = useCallback((value) => {
    setQuery(value);
    setMatchCursor(0);
    setRevealKey((k) => k + 1);
  }, []);

  const handleOptionChange = useCallback((key, value) => {
    setFindOpts((prev) => ({ ...prev, [key]: value }));
    setMatchCursor(0);
    setRevealKey((k) => k + 1);
  }, []);

  const stepMatch = useCallback(
    (dir) => {
      const n = search.list.length;
      if (!n) return;
      const next = (((cursor + dir) % n) + n) % n;
      setMatchCursor(next);
      // Doc jumps happen here (an explicit step), not in an effect, so
      // manually switching docs mid-search never gets yanked back.
      const target = search.list[next];
      if (target.docId !== activeDoc?.id) setActiveId(target.docId);
      ensureEditorVisible();
      setRevealKey((k) => k + 1);
    },
    [search.list, cursor, activeDoc, ensureEditorVisible]
  );

  const handleReplace = useCallback(() => {
    if (!currentMatch || !activeDoc || !pattern.source) return;
    if (currentMatch.docId !== activeDoc.id || effectiveView === 'preview') {
      // The match isn't on screen — bring it into view instead of editing
      // blind (the editor must also be mounted for the undo-friendly path).
      setActiveId(currentMatch.docId);
      ensureEditorVisible();
      setRevealKey((k) => k + 1);
      return;
    }
    const text = replacementText(
      activeDoc.content, currentMatch, pattern.source, pattern.flags, replaceText, findOpts.regex
    );
    // execCommand path keeps the textarea's native undo stack intact.
    const ok = editorRef.current?.replaceSelection(currentMatch.start, currentMatch.end, text);
    if (!ok) {
      updateActiveContent(
        replaceMatch(activeDoc.content, currentMatch, pattern.source, pattern.flags, replaceText, findOpts.regex)
      );
    }
    // Cursor stays put — the next match slides into the same index.
    setRevealKey((k) => k + 1);
    findInputRef.current?.focus();
  }, [currentMatch, activeDoc, pattern, replaceText, findOpts.regex, updateActiveContent, effectiveView, ensureEditorVisible]);

  const handleReplaceAll = useCallback(() => {
    if (!search.list.length || !pattern.source) return;
    const scopeIds = new Set((findOpts.allDocs ? docs : [activeDoc]).filter(Boolean).map((d) => d.id));
    const count = search.list.length;
    const docCount = new Set(search.list.map((m) => m.docId)).size;
    setDocs((prev) =>
      prev.map((d) =>
        scopeIds.has(d.id)
          ? { ...d, content: replaceAll(d.content, pattern.source, pattern.flags, replaceText, findOpts.regex) }
          : d
      )
    );
    setSnack(
      `Replaced ${count}${search.capped ? '+' : ''} occurrence${count === 1 ? '' : 's'}` +
        (docCount > 1 ? ` across ${docCount} documents` : '')
    );
  }, [search, pattern, docs, activeDoc, replaceText, findOpts]);

  useEffect(() => {
    const onKey = (ev) => {
      const mod = ev.ctrlKey || ev.metaKey;
      if (mod && !ev.altKey && ev.key.toLowerCase() === 'f') {
        ev.preventDefault();
        openFind(false);
      } else if (mod && !ev.altKey && ev.key.toLowerCase() === 'h') {
        ev.preventDefault();
        openFind(true);
      } else if (ev.key === 'F3' && findOpen) {
        ev.preventDefault();
        stepMatch(ev.shiftKey ? -1 : 1);
      } else if (ev.key === 'Escape' && findOpen) {
        closeFind();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openFind, closeFind, stepMatch, findOpen]);

  const showEditor = effectiveView === 'edit' || effectiveView === 'split';
  const showPreview = effectiveView === 'preview' || effectiveView === 'split';
  const isSplit = showEditor && showPreview;

  const cardSx = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    border: `1px solid ${e.line}`,
    borderRadius: '18px',
    overflow: 'hidden',
    boxShadow: e.shadow,
    backdropFilter: 'blur(6px)',
  };

  const cardHeaderSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    px: 2.25,
    py: 1,
    borderBottom: `1px solid ${e.line}`,
    color: 'text.secondary',
    fontSize: 12,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  };

  const lightThemes = THEME_LIST.filter((t) => t.group === 'Light');
  const darkThemes = THEME_LIST.filter((t) => t.group === 'Dark');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: e.bgGradient,
        }}
        onDragOver={(ev) => {
          if (!dragHasFiles(ev)) return; // ignore internal doc-reorder drags
          ev.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(ev) => {
          if (ev.currentTarget === ev.target) setDragOver(false);
        }}
        onDrop={handleDrop}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          gap={1.5}
          sx={{ px: { xs: 2, sm: 3 }, py: 1.75 }}
        >
          {!isSmall && (
            <Tooltip title={sidebarOpen ? 'Hide documents' : 'Show documents'}>
              <IconButton size="small" onClick={() => setSidebarOpen((o) => !o)} sx={iconBtnSx(e)}>
                <ViewSidebarIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Typography
            sx={{
              fontFamily: e.displayFont,
              fontSize: '1.4rem',
              fontWeight: 600,
              color: 'text.primary',
              letterSpacing: '-0.01em',
              mr: 1,
            }}
          >
            Markdown Viewer
          </Typography>

          <ToggleButtonGroup
            size="small"
            exclusive
            value={effectiveView}
            onChange={(_, v) => v && setView(v)}
            sx={{ bgcolor: e.cardBg, borderRadius: 999, p: 0.4 }}
          >
            <ToggleButton value="edit" sx={{ px: 1.75, py: 0.4, border: 0 }}>
              Editor
            </ToggleButton>
            {!isSmall && (
              <ToggleButton value="split" sx={{ px: 1.75, py: 0.4, border: 0 }}>
                Split
              </ToggleButton>
            )}
            <ToggleButton value="preview" sx={{ px: 1.75, py: 0.4, border: 0 }}>
              Preview
            </ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ flexGrow: 1 }} />

          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt,text/markdown"
            hidden
            multiple
            onChange={handleFileInput}
          />

          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
            <Tooltip title={highlight ? 'Turn off syntax highlighting' : 'Turn on syntax highlighting'}>
              <ToggleButton
                value="highlight"
                selected={highlight}
                onChange={() => setHighlight((v) => !v)}
                size="small"
                sx={{
                  borderRadius: 999,
                  px: 1.5,
                  py: 0.5,
                  gap: 0.5,
                  fontSize: 13,
                  fontWeight: 500,
                  bgcolor: highlight ? undefined : e.cardBg,
                }}
              >
                <CodeIcon fontSize="small" />
                Syntax highlight
              </ToggleButton>
            </Tooltip>
            <ActionButton
              icon={<UploadFileIcon fontSize="small" />}
              label="File"
              onClick={() => fileInputRef.current?.click()}
              e={e}
            />
            <ActionButton
              icon={<DescriptionIcon fontSize="small" />}
              label="Sample"
              onClick={() => addDoc('Feature Atlas', SAMPLE_MARKDOWN)}
              e={e}
            />
            <ActionButton
              icon={<ContentCopyIcon fontSize="small" />}
              label="Copy"
              onClick={handleCopy}
              e={e}
            />
            <ActionButton
              icon={<DownloadIcon fontSize="small" />}
              label="Download"
              onClick={handleDownload}
              e={e}
            />
            <Tooltip title="Clear this document">
              <IconButton size="small" onClick={() => updateActiveContent('')} sx={iconBtnSx(e)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Find (Ctrl+F)">
              <IconButton size="small" onClick={() => openFind(false)} sx={iconBtnSx(e)}>
                <SearchIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Theme">
              <IconButton
                size="small"
                onClick={(ev) => setThemeAnchor(ev.currentTarget)}
                sx={iconBtnSx(e)}
              >
                <PaletteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Body */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            gap: 2,
            minHeight: 0,
            position: 'relative',
            px: { xs: 2, sm: 3 },
            pb: 2.5,
          }}
        >
          <FindPanel
            open={findOpen}
            showReplace={showReplace}
            onToggleReplace={() => setShowReplace((v) => !v)}
            query={query}
            onQueryChange={handleQueryChange}
            replaceText={replaceText}
            onReplaceChange={setReplaceText}
            options={findOpts}
            onOptionChange={handleOptionChange}
            matchInfo={{
              current: search.list.length ? cursor + 1 : 0,
              total: search.list.length,
              capped: search.capped,
              error: pattern.error,
            }}
            onNext={() => stepMatch(1)}
            onPrev={() => stepMatch(-1)}
            onReplace={handleReplace}
            onReplaceAll={handleReplaceAll}
            onClose={closeFind}
            inputRef={findInputRef}
          />

          {showSidebar && (
            <Sidebar
              docs={docs}
              activeId={activeDoc?.id}
              onSelect={setActiveId}
              onNew={() => addDoc('Untitled', '')}
              onRename={renameDoc}
              onDelete={deleteDoc}
              onReorder={reorderDoc}
            />
          )}

          <Box
            ref={splitRef}
            sx={{ flex: 1, display: 'flex', minWidth: 0, minHeight: 0, gap: isSplit ? 0 : 2 }}
          >
            {showEditor && (
              <Box
                sx={{
                  ...cardSx,
                  bgcolor: e.cardBg,
                  ...(isSplit && {
                    flex: 'none',
                    flexBasis: `${splitRatio * 100}%`,
                  }),
                }}
              >
                <Box sx={cardHeaderSx}>
                  <Typography noWrap sx={{ fontSize: 12, letterSpacing: '0.08em', maxWidth: '60%' }}>
                    {activeDoc?.name || 'Editor'}
                  </Typography>
                  <span>
                    {stats.words} words · {stats.chars} chars
                  </span>
                </Box>
                <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
                  <Editor
                    ref={editorRef}
                    value={markdown}
                    onChange={updateActiveContent}
                    highlight={highlight}
                    matches={editorMatches}
                    currentMatch={currentMatch?.docId === activeDoc?.id ? currentMatch : null}
                    revealKey={revealKey}
                  />
                </Box>
              </Box>
            )}

            {isSplit && (
              <Box
                role="separator"
                aria-orientation="vertical"
                onPointerDown={startDividerDrag}
                onDoubleClick={() => setSplitRatio(0.5)}
                title="Drag to resize · double-click to reset"
                sx={{
                  flex: 'none',
                  width: '10px',
                  mx: 0.75,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'col-resize',
                  touchAction: 'none',
                  '&:hover .grip, &:active .grip': { bgcolor: 'primary.main' },
                }}
              >
                <Box
                  className="grip"
                  sx={{
                    width: '3px',
                    height: 44,
                    borderRadius: 999,
                    bgcolor: e.line,
                    transition: 'background-color .15s',
                  }}
                />
              </Box>
            )}

            {showPreview && (
              <Box sx={{ ...cardSx, bgcolor: e.readerBg }}>
                <Box sx={cardHeaderSx}>
                  <span>Preview</span>
                </Box>
                <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                  <Suspense
                    fallback={
                      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
                        <CircularProgress size={22} />
                      </Box>
                    }
                  >
                    <MarkdownPreview source={markdown} />
                  </Suspense>
                </Box>
              </Box>
            )}
          </Box>

          {dragOver && (
            <Box
              sx={{
                position: 'absolute',
                inset: theme.spacing(0, 3),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${theme.palette.primary.main}1f`,
                border: `2px dashed ${theme.palette.primary.main}`,
                borderRadius: '18px',
                pointerEvents: 'none',
                zIndex: 5,
              }}
            >
              <Typography
                sx={{
                  fontFamily: e.displayFont,
                  fontSize: '1.4rem',
                  color: 'primary.main',
                  fontWeight: 600,
                }}
              >
                Drop Markdown files to open
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Theme menu */}
      <Menu
        anchorEl={themeAnchor}
        open={Boolean(themeAnchor)}
        onClose={() => setThemeAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '30px', fontSize: 11, letterSpacing: '0.1em' }}>
          LIGHT
        </ListSubheader>
        {lightThemes.map((t) => (
          <ThemeMenuItem key={t.id} t={t} active={t.id === themeId} onSelect={setThemeId} close={() => setThemeAnchor(null)} />
        ))}
        <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '30px', fontSize: 11, letterSpacing: '0.1em' }}>
          DARK
        </ListSubheader>
        {darkThemes.map((t) => (
          <ThemeMenuItem key={t.id} t={t} active={t.id === themeId} onSelect={setThemeId} close={() => setThemeAnchor(null)} />
        ))}
      </Menu>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={2500}
        onClose={() => setSnack('')}
        message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </ThemeProvider>
  );
}

function ThemeMenuItem({ t, active, onSelect, close }) {
  return (
    <MenuItem
      selected={active}
      onClick={() => {
        onSelect(t.id);
        close();
      }}
      sx={{ minWidth: 190 }}
    >
      <ListItemIcon sx={{ minWidth: 30 }}>
        {active && <CheckIcon fontSize="small" color="primary" />}
      </ListItemIcon>
      {t.label}
    </MenuItem>
  );
}

function iconBtnSx(e) {
  return {
    color: 'text.secondary',
    border: `1px solid ${e.line}`,
    bgcolor: e.cardBg,
    borderRadius: 999,
    '&:hover': { bgcolor: e.readerBg, color: 'text.primary' },
  };
}

function ActionButton({ icon, label, onClick, e }) {
  return (
    <Button
      onClick={onClick}
      startIcon={icon}
      size="small"
      sx={{
        color: 'text.secondary',
        bgcolor: e.cardBg,
        border: `1px solid ${e.line}`,
        px: 1.5,
        '&:hover': { bgcolor: e.readerBg, color: 'text.primary' },
      }}
    >
      {label}
    </Button>
  );
}
