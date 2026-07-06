import { createTheme } from '@mui/material/styles';

export const fonts = {
  sans: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
  serif:
    '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, "Times New Roman", serif',
  mono: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
};

// Each theme carries an MUI mode plus a set of "editorial" design tokens the
// app and preview read directly. `hljs` picks the highlight.js color scheme.
const THEMES = {
  // ---------- Light ----------
  primer: {
    label: 'Primer',
    group: 'Light',
    mode: 'light',
    hljs: 'light',
    uiFont: fonts.sans,
    displayFont: fonts.sans,
    readerFont: fonts.sans,
    tokens: {
      bgGradient: 'linear-gradient(180deg, #f6f8fa 0%, #eef1f4 100%)',
      background: { default: '#f6f8fa', paper: '#ffffff' },
      accent: '#0969da',
      accentInk: '#ffffff',
      ink: '#1f2328',
      muted: '#656d76',
      line: 'rgba(31,35,40,0.13)',
      cardBg: '#ffffff',
      readerBg: '#ffffff',
      readerText: '#1f2328',
      heading: '#1f2328',
      codeBg: 'rgba(110,119,129,0.18)',
      preBg: '#f6f8fa',
      shadow: '0 1px 3px rgba(31,35,40,0.12), 0 8px 24px -16px rgba(31,35,40,0.3)',
    },
  },
  manuscript: {
    label: 'Manuscript',
    group: 'Light',
    mode: 'light',
    hljs: 'light',
    uiFont: fonts.sans,
    displayFont: fonts.serif,
    readerFont: fonts.serif,
    tokens: {
      bgGradient: 'linear-gradient(160deg, #f6f1e8 0%, #ebe1d0 100%)',
      background: { default: '#f2eee6', paper: '#fffaf2' },
      accent: '#d25b31',
      accentInk: '#fff7f0',
      ink: '#17171a',
      muted: '#5b5b62',
      line: 'rgba(23,23,26,0.11)',
      cardBg: 'rgba(255,255,255,0.72)',
      readerBg: 'rgba(255,255,255,0.96)',
      readerText: '#2c2f35',
      heading: '#18181c',
      codeBg: 'rgba(23,23,26,0.05)',
      preBg: '#faf6ef',
      shadow: '0 18px 40px -24px rgba(52,40,20,0.45)',
    },
  },
  porcelain: {
    label: 'Porcelain',
    group: 'Light',
    mode: 'light',
    hljs: 'light',
    uiFont: fonts.sans,
    displayFont: fonts.sans,
    readerFont: fonts.sans,
    tokens: {
      bgGradient: 'linear-gradient(160deg, #eef1f5 0%, #e2e8ef 100%)',
      background: { default: '#eaeef3', paper: '#ffffff' },
      accent: '#3f7d8c',
      accentInk: '#ffffff',
      ink: '#232a31',
      muted: '#6b7580',
      line: 'rgba(35,42,49,0.10)',
      cardBg: 'rgba(255,255,255,0.78)',
      readerBg: 'rgba(255,255,255,0.97)',
      readerText: '#2a333b',
      heading: '#1c232a',
      codeBg: 'rgba(35,42,49,0.06)',
      preBg: '#f1f5f8',
      shadow: '0 16px 38px -26px rgba(30,45,60,0.5)',
    },
  },
  // ---------- Dark ----------
  graphite: {
    label: 'Graphite',
    group: 'Dark',
    mode: 'dark',
    hljs: 'dark',
    uiFont: fonts.sans,
    displayFont: fonts.sans,
    readerFont: fonts.sans,
    tokens: {
      bgGradient: 'linear-gradient(160deg, #21252b 0%, #16181c 100%)',
      background: { default: '#1a1d22', paper: '#21252b' },
      accent: '#8ab4f8',
      accentInk: '#12151a',
      ink: '#e6e9ee',
      muted: '#9aa2ad',
      line: 'rgba(255,255,255,0.09)',
      cardBg: 'rgba(255,255,255,0.04)',
      readerBg: 'rgba(33,37,43,0.92)',
      readerText: '#d5dae1',
      heading: '#f0f2f5',
      codeBg: 'rgba(255,255,255,0.07)',
      preBg: '#15171b',
      shadow: '0 18px 40px -24px rgba(0,0,0,0.7)',
    },
  },
  night: {
    label: 'Night',
    group: 'Dark',
    mode: 'dark',
    hljs: 'dark',
    uiFont: fonts.sans,
    displayFont: fonts.sans,
    readerFont: fonts.sans,
    tokens: {
      bgGradient: 'linear-gradient(160deg, #101a30 0%, #0a0f1c 100%)',
      background: { default: '#0c1220', paper: '#121a2e' },
      accent: '#7c9cff',
      accentInk: '#0a0f1c',
      ink: '#dfe6f5',
      muted: '#8b97b5',
      line: 'rgba(255,255,255,0.08)',
      cardBg: 'rgba(40,54,90,0.32)',
      readerBg: 'rgba(16,24,48,0.92)',
      readerText: '#cdd6ee',
      heading: '#eef2ff',
      codeBg: 'rgba(255,255,255,0.07)',
      preBg: '#0a1122',
      shadow: '0 18px 44px -22px rgba(0,6,25,0.85)',
    },
  },
  terminal: {
    label: 'Terminal',
    group: 'Dark',
    mode: 'dark',
    hljs: 'dark',
    uiFont: fonts.mono,
    displayFont: fonts.mono,
    readerFont: fonts.mono,
    glow: true,
    tokens: {
      bgGradient: 'radial-gradient(120% 120% at 50% 0%, #2a0716 0%, #05010a 70%)',
      background: { default: '#05010a', paper: '#12040d' },
      accent: '#ff2d6f',
      accentInk: '#1a0008',
      ink: '#f0f2f5',
      muted: '#b58aa0',
      line: 'rgba(255,45,111,0.22)',
      cardBg: 'rgba(30,7,20,0.6)',
      readerBg: 'rgba(15,4,11,0.92)',
      readerText: '#f0f2f5',
      heading: '#ffdcea',
      codeBg: 'rgba(255,45,111,0.12)',
      preBg: '#0c0208',
      shadow: '0 0 0 1px rgba(255,45,111,0.15), 0 18px 44px -26px rgba(60,0,25,0.9)',
    },
  },
};

export const DEFAULT_THEME = 'manuscript';

export const THEME_LIST = Object.entries(THEMES).map(([id, t]) => ({
  id,
  label: t.label,
  group: t.group,
}));

export const getTheme = (id) => {
  const def = THEMES[id] || THEMES[DEFAULT_THEME];
  const p = def.tokens;
  const theme = createTheme({
    palette: {
      mode: def.mode,
      primary: { main: p.accent, contrastText: p.accentInk },
      background: { default: p.background.default, paper: p.background.paper },
      text: { primary: p.ink, secondary: p.muted },
      divider: p.line,
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: def.uiFont,
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 999 } },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            border: `1px solid ${p.line}`,
            color: p.muted,
            '&.Mui-selected': {
              backgroundColor: p.accent,
              color: p.accentInk,
              '&:hover': { backgroundColor: p.accent },
            },
          },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: { grouped: { borderRadius: 999, margin: 0 } },
      },
    },
  });
  theme.editorial = {
    ...p,
    id,
    hljs: def.hljs,
    glow: Boolean(def.glow),
    uiFont: def.uiFont,
    displayFont: def.displayFont,
    readerFont: def.readerFont,
  };
  return theme;
};
