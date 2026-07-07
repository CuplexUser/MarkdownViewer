import { useEffect, useRef, useState } from 'react';
import { Box, Stack, Typography, IconButton, Tooltip, InputBase, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/AddOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import CloseIcon from '@mui/icons-material/CloseOutlined';

export default function Sidebar({ docs, activeId, onSelect, onNew, onRename, onDelete, onReorder }) {
  const theme = useTheme();
  const e = theme.editorial;
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const [dragId, setDragId] = useState(null);
  const inputRef = useRef(null);
  const lastOverRef = useRef(null);

  useEffect(() => {
    if (editingId && inputRef.current) inputRef.current.select();
  }, [editingId]);

  const startRename = (doc) => {
    setEditingId(doc.id);
    setDraft(doc.name);
  };

  const commit = () => {
    if (editingId) onRename(editingId, draft.trim() || 'Untitled');
    setEditingId(null);
  };

  return (
    <Box
      sx={{
        width: 244,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${e.line}`,
        borderRadius: '18px',
        bgcolor: e.cardBg,
        boxShadow: e.shadow,
        backdropFilter: 'blur(6px)',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1,
          borderBottom: `1px solid ${e.line}`,
          color: 'text.secondary',
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <span>Documents</span>
        <Tooltip title="New document">
          <IconButton
            size="small"
            onClick={onNew}
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 1 }}>
        {docs.map((doc) => {
          const active = doc.id === activeId;
          return (
            <Stack
              key={doc.id}
              direction="row"
              alignItems="center"
              gap={1}
              draggable={editingId !== doc.id}
              onClick={() => onSelect(doc.id)}
              onDoubleClick={() => startRename(doc)}
              onDragStart={(ev) => {
                setDragId(doc.id);
                lastOverRef.current = doc.id;
                ev.dataTransfer.effectAllowed = 'move';
                ev.dataTransfer.setData('text/plain', doc.id);
              }}
              onDragEnter={() => {
                if (dragId && dragId !== doc.id && lastOverRef.current !== doc.id) {
                  lastOverRef.current = doc.id;
                  onReorder(dragId, doc.id);
                }
              }}
              onDragOver={(ev) => ev.preventDefault()}
              onDragEnd={() => {
                setDragId(null);
                lastOverRef.current = null;
              }}
              onDrop={(ev) => {
                ev.preventDefault();
                setDragId(null);
                lastOverRef.current = null;
              }}
              sx={{
                px: 1.25,
                py: 0.9,
                mb: 0.5,
                borderRadius: '12px',
                cursor: 'pointer',
                opacity: dragId === doc.id ? 0.4 : 1,
                color: active ? 'primary.main' : 'text.primary',
                bgcolor: active ? `${theme.palette.primary.main}1f` : 'transparent',
                border: `1px solid ${active ? `${theme.palette.primary.main}3d` : 'transparent'}`,
                transition: 'background-color 120ms ease, opacity 120ms ease',
                '&:hover': { bgcolor: active ? `${theme.palette.primary.main}26` : e.codeBg },
                '&:hover .doc-close': { opacity: 1 },
              }}
            >
              <DescriptionIcon
                fontSize="small"
                sx={{ opacity: 0.6, flexShrink: 0, fontSize: 18 }}
              />
              {editingId === doc.id ? (
                <InputBase
                  inputRef={inputRef}
                  value={draft}
                  autoFocus
                  onChange={(ev) => setDraft(ev.target.value)}
                  onBlur={commit}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter') commit();
                    if (ev.key === 'Escape') setEditingId(null);
                  }}
                  onClick={(ev) => ev.stopPropagation()}
                  sx={{
                    flex: 1,
                    fontSize: 13.5,
                    color: 'text.primary',
                    fontFamily: e.uiFont,
                    '& input': { p: 0 },
                  }}
                />
              ) : (
                <Typography
                  noWrap
                  title={`${doc.name} — double-click to rename`}
                  sx={{ flex: 1, fontSize: 13.5, fontWeight: active ? 600 : 400 }}
                >
                  {doc.name}
                </Typography>
              )}
              {docs.length > 1 && (
                <IconButton
                  className="doc-close"
                  size="small"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onDelete(doc.id);
                  }}
                  sx={{
                    p: 0.25,
                    opacity: 0,
                    color: 'text.secondary',
                    transition: 'opacity 120ms ease',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Stack>
          );
        })}
      </Box>
    </Box>
  );
}
