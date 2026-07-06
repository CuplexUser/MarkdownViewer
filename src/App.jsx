import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { getTheme, THEME_LIST, DEFAULT_THEME } from './theme';
import { SAMPLE_MARKDOWN } from './sample';
import Editor from './components/Editor';
import MarkdownPreview from './components/MarkdownPreview';
import Sidebar from './components/Sidebar';

const DOCS_KEY = 'markdown-viewer:docs';
const ACTIVE_KEY = 'markdown-viewer:active';
const THEME_KEY = 'markdown-viewer:theme';
const LEGACY_KEY = 'markdown-viewer:content';

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

export default function App() {
  const isSmall = useMediaQuery('(max-width:900px)');

  const [themeId, setThemeId] = useState(
    () => localStorage.getItem(THEME_KEY) || DEFAULT_THEME
  );
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
  const fileInputRef = useRef(null);

  const theme = useMemo(() => getTheme(themeId), [themeId]);
  const e = theme.editorial;

  const activeDoc = docs.find((d) => d.id === activeId) || docs[0];

  // Keep activeId valid and persisted.
  useEffect(() => {
    if (!docs.find((d) => d.id === activeId) && docs[0]) setActiveId(docs[0].id);
  }, [docs, activeId]);

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

  const effectiveView = isSmall && view === 'split' ? 'preview' : view;
  const showSidebar = sidebarOpen && !isSmall;

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

  const showEditor = effectiveView === 'edit' || effectiveView === 'split';
  const showPreview = effectiveView === 'preview' || effectiveView === 'split';

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
          {showSidebar && (
            <Sidebar
              docs={docs}
              activeId={activeDoc?.id}
              onSelect={setActiveId}
              onNew={() => addDoc('Untitled', '')}
              onRename={renameDoc}
              onDelete={deleteDoc}
            />
          )}

          {showEditor && (
            <Box sx={{ ...cardSx, bgcolor: e.cardBg }}>
              <Box sx={cardHeaderSx}>
                <Typography noWrap sx={{ fontSize: 12, letterSpacing: '0.08em', maxWidth: '60%' }}>
                  {activeDoc?.name || 'Editor'}
                </Typography>
                <span>
                  {stats.words} words · {stats.chars} chars
                </span>
              </Box>
              <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
                <Editor value={markdown} onChange={updateActiveContent} />
              </Box>
            </Box>
          )}

          {showPreview && (
            <Box sx={{ ...cardSx, bgcolor: e.readerBg }}>
              <Box sx={cardHeaderSx}>
                <span>Preview</span>
              </Box>
              <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <MarkdownPreview source={markdown} />
              </Box>
            </Box>
          )}

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
