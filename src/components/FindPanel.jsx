import { useEffect } from 'react';
import { Box, Stack, Typography, IconButton, Button, Tooltip, ToggleButton, InputBase, useTheme } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUpOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRightOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreOutlined';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooksOutlined';
import CloseIcon from '@mui/icons-material/CloseOutlined';
import { fonts } from '../theme';

// Compact toggle for a search option (Aa / ab / .*), VS Code style.
function OptionToggle({ label, title, selected, onToggle }) {
  return (
    <Tooltip title={title}>
      <ToggleButton
        value={label}
        selected={selected}
        onChange={onToggle}
        size="small"
        sx={{
          border: 0,
          borderRadius: '6px',
          px: 0.75,
          py: 0.25,
          fontFamily: fonts.mono,
          fontSize: 12,
          lineHeight: 1.4,
          textTransform: 'none',
        }}
      >
        {label}
      </ToggleButton>
    </Tooltip>
  );
}

export default function FindPanel({
  open,
  showReplace,
  onToggleReplace,
  query,
  onQueryChange,
  replaceText,
  onReplaceChange,
  options,
  onOptionChange,
  matchInfo,
  onNext,
  onPrev,
  onReplace,
  onReplaceAll,
  onClose,
  inputRef,
}) {
  const theme = useTheme();
  const e = theme.editorial;

  // Focus the search field whenever the panel opens.
  useEffect(() => {
    if (open) inputRef?.current?.select();
  }, [open, inputRef]);

  if (!open) return null;

  const { current, total, capped, error } = matchInfo;
  const counter = error
    ? 'Bad regex'
    : !query
      ? ''
      : total === 0
        ? 'No results'
        : `${current}/${total}${capped ? '+' : ''}`;

  const inputSx = (invalid) => ({
    flex: 1,
    minWidth: 0,
    px: 1,
    py: 0.25,
    fontSize: 13,
    fontFamily: e.uiFont,
    color: 'text.primary',
    bgcolor: e.readerBg,
    border: `1px solid ${invalid ? theme.palette.error.main : e.line}`,
    borderRadius: '8px',
    '&.Mui-focused': {
      borderColor: invalid ? theme.palette.error.main : theme.palette.primary.main,
    },
  });

  const smallBtnSx = {
    color: 'text.secondary',
    bgcolor: e.cardBg,
    border: `1px solid ${e.line}`,
    px: 1.25,
    fontSize: 12,
    whiteSpace: 'nowrap',
    '&:hover': { bgcolor: e.readerBg, color: 'text.primary' },
    '&.Mui-disabled': { border: `1px solid ${e.line}` },
  };

  const onSearchKeyDown = (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      if (ev.shiftKey) onPrev();
      else onNext();
    } else if (ev.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        right: 18,
        zIndex: 6,
        width: 'min(480px, calc(100% - 32px))',
        p: 1,
        bgcolor: e.cardBg,
        border: `1px solid ${e.line}`,
        borderRadius: '12px',
        boxShadow: e.shadow,
        backdropFilter: 'blur(6px)',
      }}
    >
      <Stack direction="row" gap={0.5} alignItems="center">
        <Tooltip title={showReplace ? 'Hide replace' : 'Show replace'}>
          <IconButton size="small" onClick={onToggleReplace} sx={{ color: 'text.secondary' }}>
            {showReplace ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Tooltip title={error || ''} placement="bottom-start">
          <InputBase
            inputRef={inputRef}
            value={query}
            onChange={(ev) => onQueryChange(ev.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Find"
            sx={inputSx(Boolean(error))}
          />
        </Tooltip>

        <OptionToggle
          label="Aa"
          title="Match case"
          selected={options.matchCase}
          onToggle={() => onOptionChange('matchCase', !options.matchCase)}
        />
        <OptionToggle
          label="ab"
          title="Whole word"
          selected={options.wholeWord}
          onToggle={() => onOptionChange('wholeWord', !options.wholeWord)}
        />
        <OptionToggle
          label=".*"
          title="Regular expression"
          selected={options.regex}
          onToggle={() => onOptionChange('regex', !options.regex)}
        />

        <Typography
          sx={{
            fontSize: 12,
            color: error ? 'error.main' : e.muted,
            minWidth: 56,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          {counter}
        </Typography>

        <Tooltip title="Previous match (Shift+Enter)">
          <span>
            <IconButton size="small" onClick={onPrev} disabled={total === 0} sx={{ color: 'text.secondary' }}>
              <KeyboardArrowUpIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Next match (Enter)">
          <span>
            <IconButton size="small" onClick={onNext} disabled={total === 0} sx={{ color: 'text.secondary' }}>
              <KeyboardArrowDownIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={options.allDocs ? 'Search current document only' : 'Search all documents'}>
          <ToggleButton
            value="allDocs"
            selected={options.allDocs}
            onChange={() => onOptionChange('allDocs', !options.allDocs)}
            size="small"
            sx={{ border: 0, borderRadius: '6px', p: 0.5 }}
          >
            <LibraryBooksIcon sx={{ fontSize: 16 }} />
          </ToggleButton>
        </Tooltip>

        <Tooltip title="Close (Esc)">
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {showReplace && (
        <Stack direction="row" gap={0.5} alignItems="center" sx={{ mt: 0.75, pl: '34px' }}>
          <InputBase
            value={replaceText}
            onChange={(ev) => onReplaceChange(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter') {
                ev.preventDefault();
                onReplace();
              } else if (ev.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="Replace"
            sx={inputSx(false)}
          />
          <Button size="small" onClick={onReplace} disabled={total === 0} sx={smallBtnSx}>
            Replace
          </Button>
          <Tooltip title={options.allDocs ? 'Replace all matches in all documents' : 'Replace all matches in this document'}>
            <span>
              <Button size="small" onClick={onReplaceAll} disabled={total === 0} sx={smallBtnSx}>
                All
              </Button>
            </span>
          </Tooltip>
        </Stack>
      )}
    </Box>
  );
}
