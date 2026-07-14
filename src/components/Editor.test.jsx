import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';
import Editor from './Editor';

const renderEditor = (props = {}) => {
  const ref = createRef();
  const onChange = vi.fn();
  const utils = render(
    <ThemeProvider theme={getTheme('primer')}>
      <Editor ref={ref} value="" onChange={onChange} {...props} />
    </ThemeProvider>
  );
  return { ref, onChange, ...utils };
};

const textarea = () => screen.getByPlaceholderText(/write or paste markdown/i);

describe('Editor', () => {
  it('renders the value in a native textarea and reports edits', () => {
    const { onChange } = renderEditor({ value: '# Title' });
    expect(textarea()).toHaveValue('# Title');
    fireEvent.change(textarea(), { target: { value: '# Title!' } });
    expect(onChange).toHaveBeenCalledWith('# Title!');
  });

  it('paints a Prism overlay when highlighting is on, and none when off', () => {
    const { container } = renderEditor({ value: '# Heading', highlight: true });
    const overlay = container.querySelector('pre code');
    // The overlay must carry the same text (plus the anti-collapse trailing
    // newline) or colours drift off the caret.
    expect(overlay).toHaveTextContent('# Heading');
    expect(overlay.querySelector('.token.title')).not.toBeNull();

    const { container: plain } = renderEditor({ value: '# Heading', highlight: false });
    expect(plain.querySelector('pre code')).toBeNull();
  });

  it('marks search matches and flags the current one', () => {
    const { container } = renderEditor({
      value: 'foo bar foo',
      matches: [
        { start: 0, end: 3 },
        { start: 8, end: 11 },
      ],
      currentMatch: { start: 8, end: 11 },
    });
    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(2);
    expect(marks[0]).not.toHaveAttribute('data-current');
    expect(marks[1]).toHaveAttribute('data-current', 'true');
  });

  it('renders match text into the overlay as text, not HTML', () => {
    const { container } = renderEditor({
      value: '<img src=x onerror=alert(1)>',
      highlight: false,
      matches: [{ start: 0, end: 28 }],
    });
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('mark')).toHaveTextContent('<img src=x onerror=alert(1)>');
  });

  describe('imperative handle', () => {
    it('getSelection returns the current textarea selection', () => {
      const { ref } = renderEditor({ value: 'hello world' });
      textarea().setSelectionRange(6, 11);
      expect(ref.current.getSelection()).toBe('world');
    });

    it('replaceSelection uses execCommand so native undo survives', () => {
      const { ref } = renderEditor({ value: 'hello world' });
      document.execCommand = vi.fn(() => true);
      try {
        expect(ref.current.replaceSelection(6, 11, 'there')).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('insertText', false, 'there');
        const t = textarea();
        expect([t.selectionStart, t.selectionEnd]).toEqual([6, 11]);
      } finally {
        delete document.execCommand;
      }
    });

    it('replaceSelection returns false when execCommand is unavailable', () => {
      // jsdom has no execCommand — this is the fallback path App relies on.
      const { ref } = renderEditor({ value: 'hello world' });
      expect(ref.current.replaceSelection(0, 5, 'bye')).toBe(false);
    });
  });
});
