import { matchMediaStub } from './test/setup';
import { getTheme, defaultThemeId, THEME_LIST, fonts } from './theme';

describe('defaultThemeId', () => {
  it('picks graphite when the browser prefers dark', () => {
    window.matchMedia = matchMediaStub((q) => q.includes('prefers-color-scheme: dark'));
    expect(defaultThemeId()).toBe('graphite');
  });

  it('picks primer otherwise', () => {
    expect(defaultThemeId()).toBe('primer');
  });
});

describe('THEME_LIST', () => {
  it('exposes all six themes split into Light and Dark groups', () => {
    expect(THEME_LIST).toHaveLength(6);
    expect(THEME_LIST.filter((t) => t.group === 'Light')).toHaveLength(3);
    expect(THEME_LIST.filter((t) => t.group === 'Dark')).toHaveLength(3);
  });
});

describe('getTheme', () => {
  it.each(THEME_LIST.map((t) => [t.id]))(
    '%s carries the editorial tokens components read from',
    (id) => {
      const e = getTheme(id).editorial;
      expect(e.id).toBe(id);
      // Every field components pull via useTheme().editorial must exist.
      for (const key of [
        'bgGradient',
        'accent',
        'accentInk',
        'ink',
        'muted',
        'line',
        'cardBg',
        'readerBg',
        'readerText',
        'heading',
        'codeBg',
        'preBg',
        'shadow',
        'uiFont',
        'displayFont',
        'readerFont',
      ]) {
        expect(e[key], `editorial.${key} of ${id}`).toBeTruthy();
      }
      expect(['light', 'dark']).toContain(e.hljs);
      expect(typeof e.glow).toBe('boolean');
    }
  );

  it('mirrors the tokens into the MUI palette', () => {
    const theme = getTheme('graphite');
    expect(theme.palette.mode).toBe('dark');
    expect(theme.palette.primary.main).toBe(theme.editorial.accent);
    expect(theme.palette.text.primary).toBe(theme.editorial.ink);
  });

  it('falls back to the preference-based default for an unknown stored id', () => {
    expect(getTheme('no-such-theme').editorial.id).toBe('no-such-theme'); // id echoes input...
    // ...but the tokens are the fallback theme's (primer under the light stub).
    expect(getTheme('no-such-theme').editorial.accent).toBe(getTheme('primer').editorial.accent);

    window.matchMedia = matchMediaStub((q) => q.includes('prefers-color-scheme: dark'));
    expect(getTheme('no-such-theme').editorial.accent).toBe(
      getTheme('graphite').editorial.accent
    );
  });

  it('only Terminal glows, with mono fonts throughout', () => {
    const terminal = getTheme('terminal').editorial;
    expect(terminal.glow).toBe(true);
    expect(terminal.readerFont).toBe(fonts.mono);
    for (const { id } of THEME_LIST.filter((t) => t.id !== 'terminal')) {
      expect(getTheme(id).editorial.glow, `${id} must not glow`).toBe(false);
    }
  });
});
