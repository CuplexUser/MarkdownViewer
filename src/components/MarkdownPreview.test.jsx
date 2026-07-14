import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';
import MarkdownPreview from './MarkdownPreview';

const renderPreview = (source, themeId = 'primer') =>
  render(
    <ThemeProvider theme={getTheme(themeId)}>
      <MarkdownPreview source={source} />
    </ThemeProvider>
  );

describe('MarkdownPreview', () => {
  it('renders basic markdown structure', () => {
    renderPreview('# Hello\n\nSome *emphasis* and a [link](https://example.com).');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello');
    expect(screen.getByRole('link', { name: 'link' })).toHaveAttribute(
      'href',
      'https://example.com'
    );
  });

  describe('GFM (remark-gfm)', () => {
    it('renders tables', () => {
      renderPreview('| a | b |\n| - | - |\n| 1 | 2 |');
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'a' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: '2' })).toBeInTheDocument();
    });

    it('renders task lists as checkboxes', () => {
      renderPreview('- [x] done\n- [ ] todo');
      const boxes = screen.getAllByRole('checkbox');
      expect(boxes).toHaveLength(2);
      expect(boxes[0]).toBeChecked();
      expect(boxes[1]).not.toBeChecked();
    });

    it('renders strikethrough', () => {
      const { container } = renderPreview('~~gone~~');
      expect(container.querySelector('del')).toHaveTextContent('gone');
    });
  });

  it('passes raw HTML through (rehype-raw)', () => {
    const { container } = renderPreview('before\n\n<div data-testid="raw"><b>bold</b></div>');
    expect(screen.getByTestId('raw')).toBeInTheDocument();
    expect(container.querySelector('b')).toHaveTextContent('bold');
  });

  it('syntax-highlights fenced code blocks (rehype-highlight)', () => {
    const { container } = renderPreview("```js\nconst x = 'y';\n```");
    const code = container.querySelector('pre code');
    expect(code.className).toContain('language-js');
    expect(code.querySelector('.hljs-keyword')).toHaveTextContent('const');
  });

  it('injects the highlight.js stylesheet matching the theme scheme', () => {
    renderPreview('x', 'primer');
    const styleEl = () => document.getElementById('hljs-theme');
    expect(styleEl()).not.toBeNull();
    const lightCss = styleEl().textContent;

    renderPreview('x', 'graphite');
    const darkCss = styleEl().textContent;
    expect(darkCss).not.toBe(lightCss);
    // Still a single swapped <style> tag, not one per render.
    expect(document.querySelectorAll('#hljs-theme')).toHaveLength(1);
  });
});
