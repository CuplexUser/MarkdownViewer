import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { SAMPLE_MARKDOWN } from './sample';

// The lazy preview pulls in react-markdown + highlight.js; App's own behavior
// (docs, persistence, find/replace) doesn't need it, and MarkdownPreview has
// its own test file. A stub keeps these tests fast and Suspense synchronous.
vi.mock('./components/MarkdownPreview', () => ({
  default: ({ source }) => <div data-testid="preview">{source}</div>,
}));

const DOCS_KEY = 'markdown-viewer:docs';
const ACTIVE_KEY = 'markdown-viewer:active';
const LEGACY_KEY = 'markdown-viewer:content';

const editor = () => screen.getByPlaceholderText(/write or paste markdown/i);
const findInput = () => screen.getByPlaceholderText('Find');

const seedDocs = (docs, activeId) => {
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
  if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
};

const openFind = () => fireEvent.keyDown(window, { key: 'f', ctrlKey: true });
const openReplace = () => fireEvent.keyDown(window, { key: 'h', ctrlKey: true });

describe('document loading and persistence', () => {
  it('seeds a Welcome document with the sample on first visit', () => {
    render(<App />);
    expect(editor()).toHaveValue(SAMPLE_MARKDOWN);
    // Appears in the sidebar and as the editor card title.
    expect(screen.getAllByText('Welcome').length).toBeGreaterThan(0);
  });

  it('seeds from the legacy single-document key when present', () => {
    localStorage.setItem(LEGACY_KEY, 'legacy content');
    render(<App />);
    expect(editor()).toHaveValue('legacy content');
  });

  it('restores stored documents and the stored active tab', () => {
    seedDocs(
      [
        { id: 'd1', name: 'First', content: 'first doc' },
        { id: 'd2', name: 'Second', content: 'second doc' },
      ],
      'd2'
    );
    render(<App />);
    expect(editor()).toHaveValue('second doc');
  });

  it('falls back to the first document when the stored active id is stale', () => {
    seedDocs([{ id: 'd1', name: 'Only', content: 'only doc' }], 'deleted-id');
    render(<App />);
    expect(editor()).toHaveValue('only doc');
  });

  it('recovers from corrupt stored docs by reseeding', () => {
    localStorage.setItem(DOCS_KEY, '{not json[');
    render(<App />);
    expect(editor()).toHaveValue(SAMPLE_MARKDOWN);
  });

  it('persists edits to localStorage after the debounce', async () => {
    seedDocs([{ id: 'd1', name: 'Doc', content: 'before' }], 'd1');
    render(<App />);
    fireEvent.change(editor(), { target: { value: 'after' } });
    await waitFor(
      () => expect(JSON.parse(localStorage.getItem(DOCS_KEY))[0].content).toBe('after'),
      { timeout: 2000 }
    );
  });
});

describe('document operations', () => {
  it('adds the sample document and switches to it', () => {
    seedDocs([{ id: 'd1', name: 'Doc', content: 'mine' }], 'd1');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Sample' }));
    expect(editor()).toHaveValue(SAMPLE_MARKDOWN);
    // Both docs listed (the new one also becomes the editor card title).
    expect(screen.getByText('Doc')).toBeInTheDocument();
    expect(screen.getAllByText('Feature Atlas').length).toBeGreaterThan(0);
  });

  it('mirrors the editor into the preview pane', () => {
    seedDocs([{ id: 'd1', name: 'Doc', content: 'shown in preview' }], 'd1');
    render(<App />);
    expect(screen.getByTestId('preview')).toHaveTextContent('shown in preview');
  });

  it('shows word and character counts for the active doc', () => {
    seedDocs([{ id: 'd1', name: 'Doc', content: 'one two three' }], 'd1');
    render(<App />);
    expect(screen.getByText('3 words · 13 chars')).toBeInTheDocument();
  });
});

describe('find and replace', () => {
  it('opens with Ctrl+F, counts matches, and steps with Enter and F3', () => {
    seedDocs([{ id: 'd1', name: 'Doc', content: 'alpha beta alpha\nalpha' }], 'd1');
    render(<App />);
    openFind();
    fireEvent.change(findInput(), { target: { value: 'alpha' } });
    expect(screen.getByText('1/3')).toBeInTheDocument();

    fireEvent.keyDown(findInput(), { key: 'Enter' });
    expect(screen.getByText('2/3')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'F3' });
    expect(screen.getByText('3/3')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'F3' }); // wraps around
    expect(screen.getByText('1/3')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'F3', shiftKey: true }); // wraps backwards
    expect(screen.getByText('3/3')).toBeInTheDocument();
  });

  it('reports no results and survives an invalid regex', () => {
    seedDocs([{ id: 'd1', name: 'Doc', content: 'plain text' }], 'd1');
    render(<App />);
    openFind();
    fireEvent.change(findInput(), { target: { value: 'zzz' } });
    expect(screen.getByText('No results')).toBeInTheDocument();

    // MUI Tooltip exposes its title as the toggle's accessible name.
    fireEvent.click(screen.getByRole('button', { name: 'Regular expression' }));
    fireEvent.change(findInput(), { target: { value: '([' } });
    expect(screen.getByText('Bad regex')).toBeInTheDocument();
  });

  it('closes with Escape', () => {
    render(<App />);
    openFind();
    expect(findInput()).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByPlaceholderText('Find')).not.toBeInTheDocument();
  });

  it('replaces the current match and keeps the rest', () => {
    seedDocs([{ id: 'd1', name: 'Doc', content: 'alpha beta alpha' }], 'd1');
    render(<App />);
    openReplace();
    fireEvent.change(findInput(), { target: { value: 'alpha' } });
    fireEvent.change(screen.getByPlaceholderText('Replace'), { target: { value: 'omega' } });
    fireEvent.click(screen.getByRole('button', { name: 'Replace' }));
    expect(editor()).toHaveValue('omega beta alpha');
    // The remaining match slid into the cursor slot.
    expect(screen.getByText('1/1')).toBeInTheDocument();
  });

  it('replace-all rewrites the active document', () => {
    seedDocs([{ id: 'd1', name: 'Doc', content: 'alpha beta alpha\nalpha' }], 'd1');
    render(<App />);
    openReplace();
    fireEvent.change(findInput(), { target: { value: 'alpha' } });
    fireEvent.change(screen.getByPlaceholderText('Replace'), { target: { value: 'omega' } });
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(editor()).toHaveValue('omega beta omega\nomega');
    expect(screen.getByText('Replaced 3 occurrences')).toBeInTheDocument();
  });

  it('searches across documents and switches doc when stepping to a foreign match', () => {
    seedDocs(
      [
        { id: 'd1', name: 'One', content: 'match one' },
        { id: 'd2', name: 'Two', content: 'match two' },
      ],
      'd1'
    );
    const { container } = render(<App />);
    openFind();
    fireEvent.click(container.querySelector('button[value="allDocs"]'));
    fireEvent.change(findInput(), { target: { value: 'match' } });
    expect(screen.getByText('1/2')).toBeInTheDocument();

    fireEvent.keyDown(findInput(), { key: 'Enter' });
    expect(screen.getByText('2/2')).toBeInTheDocument();
    expect(editor()).toHaveValue('match two'); // active doc followed the match
  });

  it('replace-all in all-docs mode rewrites every document', () => {
    seedDocs(
      [
        { id: 'd1', name: 'One', content: 'match one' },
        { id: 'd2', name: 'Two', content: 'match two' },
      ],
      'd1'
    );
    const { container } = render(<App />);
    openReplace();
    fireEvent.click(container.querySelector('button[value="allDocs"]'));
    fireEvent.change(findInput(), { target: { value: 'match' } });
    fireEvent.change(screen.getByPlaceholderText('Replace'), { target: { value: 'hit' } });
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByText('Replaced 2 occurrences across 2 documents')).toBeInTheDocument();
    expect(editor()).toHaveValue('hit one');
    fireEvent.click(screen.getByText('Two'));
    expect(editor()).toHaveValue('hit two');
  });
});
