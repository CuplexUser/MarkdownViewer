import { Box, useTheme } from '@mui/material';
import { fonts } from '../theme';

export default function Editor({ value, onChange }) {
  const theme = useTheme();
  return (
    <Box
      component="textarea"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      placeholder="Write or paste Markdown here…"
      sx={{
        width: '100%',
        height: '100%',
        border: 'none',
        outline: 'none',
        resize: 'none',
        p: { xs: 2.5, sm: 3.5 },
        bgcolor: 'transparent',
        color: theme.editorial.readerText,
        fontFamily: fonts.mono,
        fontSize: 14,
        lineHeight: 1.75,
        tabSize: 2,
        '&::placeholder': { color: theme.palette.text.secondary, opacity: 0.7 },
        '&::selection': { background: `${theme.palette.primary.main}33` },
      }}
    />
  );
}
