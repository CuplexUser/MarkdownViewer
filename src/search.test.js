import {
  MAX_MATCHES,
  escapeRegex,
  buildSearchPattern,
  findMatches,
  replacementText,
  replaceMatch,
  replaceAll,
} from './search';

const OPTS = { matchCase: false, wholeWord: false, regex: false };

// Convenience: build a pattern and run it over text in one go.
const search = (text, query, opts = {}) => {
  const p = buildSearchPattern(query, { ...OPTS, ...opts });
  if (!p.source) throw new Error(`pattern did not build: ${p.error ?? 'empty query'}`);
  return findMatches(text, p.source, p.flags);
};

describe('escapeRegex', () => {
  it('escapes every regex metacharacter', () => {
    const raw = '.*+?^${}()|[]\\';
    const re = new RegExp(escapeRegex(raw));
    expect(re.test(raw)).toBe(true);
    expect(re.test('anything-else')).toBe(false);
  });

  it('leaves plain text untouched', () => {
    expect(escapeRegex('hello world_123')).toBe('hello world_123');
  });
});

describe('buildSearchPattern', () => {
  it('returns a null source for an empty query', () => {
    expect(buildSearchPattern('', OPTS)).toEqual({ source: null });
  });

  it('escapes literal queries so metacharacters match themselves', () => {
    const { matches } = search('price is $5 (approx)', '$5 (approx)');
    expect(matches).toEqual([{ start: 9, end: 20 }]);
  });

  it('is case-insensitive by default and case-sensitive with matchCase', () => {
    expect(search('Foo foo FOO', 'foo').matches).toHaveLength(3);
    expect(search('Foo foo FOO', 'foo', { matchCase: true }).matches).toHaveLength(1);
  });

  it('passes raw regex through in regex mode', () => {
    const { matches } = search('cat cot cut', 'c[ao]t', { regex: true });
    expect(matches).toEqual([
      { start: 0, end: 3 },
      { start: 4, end: 7 },
    ]);
  });

  it('reports invalid regex as an error instead of throwing', () => {
    const result = buildSearchPattern('([', { ...OPTS, regex: true });
    expect(result.source).toBeUndefined();
    expect(result.error).toEqual(expect.any(String));
  });

  describe('whole word', () => {
    it('anchors both ends of a word query', () => {
      const { matches } = search('cat concatenate cat', 'cat', { wholeWord: true });
      expect(matches).toEqual([
        { start: 0, end: 3 },
        { start: 16, end: 19 },
      ]);
    });

    // \b beside a non-word char never matches, so only word-char ends are
    // anchored — "foo(" and "-x" must still be findable in whole-word mode.
    it('skips the boundary next to a non-word edge', () => {
      expect(search('call foo(1)', 'foo(', { wholeWord: true }).matches).toHaveLength(1);
      expect(search('flag -x here', '-x', { wholeWord: true }).matches).toHaveLength(1);
      // ...but the word-char edge still anchors: "sfoo(" must not match.
      expect(search('call sfoo(1)', 'foo(', { wholeWord: true }).matches).toHaveLength(0);
    });
  });
});

describe('findMatches', () => {
  it('finds all non-overlapping matches with correct offsets', () => {
    const { matches, capped } = search('ab ab ab', 'ab');
    expect(matches).toEqual([
      { start: 0, end: 2 },
      { start: 3, end: 5 },
      { start: 6, end: 8 },
    ]);
    expect(capped).toBe(false);
  });

  it('matches across lines with the m flag', () => {
    const { matches } = search('one\ntwo\nthree', '^t', { regex: true });
    expect(matches).toEqual([
      { start: 4, end: 5 },
      { start: 8, end: 9 },
    ]);
  });

  it('skips zero-length matches without looping forever', () => {
    // "a*" matches "" at every position; only the non-empty runs may be kept.
    const { matches } = search('baab', 'a*', { regex: true });
    expect(matches).toEqual([{ start: 1, end: 3 }]);
  });

  it('caps runaway match counts and reports it', () => {
    const { matches, capped } = search('x'.repeat(MAX_MATCHES + 100), 'x');
    expect(matches).toHaveLength(MAX_MATCHES);
    expect(capped).toBe(true);
  });
});

describe('replace', () => {
  const match = (text, query, opts = {}) => {
    const p = buildSearchPattern(query, { ...OPTS, ...opts });
    const { matches } = findMatches(text, p.source, p.flags);
    return { p, matches };
  };

  it('replaces a single known match in place', () => {
    const text = 'red fish blue fish';
    const { p, matches } = match(text, 'fish');
    expect(replaceMatch(text, matches[0], p.source, p.flags, 'cat', false)).toBe(
      'red cat blue fish'
    );
    expect(replaceMatch(text, matches[1], p.source, p.flags, 'cat', false)).toBe(
      'red fish blue cat'
    );
  });

  it('keeps $ literal in the replacement outside regex mode', () => {
    const text = 'cost: X';
    const { p, matches } = match(text, 'X');
    expect(replaceMatch(text, matches[0], p.source, p.flags, '$1.50', false)).toBe('cost: $1.50');
    expect(replaceMatch(text, matches[0], p.source, p.flags, '$&$&', false)).toBe('cost: $&$&');
  });

  it('honors $1 and $& group references in regex mode', () => {
    const text = 'hello world';
    const { p, matches } = match(text, '(hello) (world)', { regex: true });
    expect(replaceMatch(text, matches[0], p.source, p.flags, '$2 $1', true)).toBe('world hello');
    expect(replacementText(text, matches[0], p.source, p.flags, '[$&]', true)).toBe(
      '[hello world]'
    );
  });

  it('replacementText resolves group refs against just the matched segment', () => {
    const text = 'aaa item-42 bbb';
    const { p, matches } = match(text, String.raw`item-(\d+)`, { regex: true });
    expect(replacementText(text, matches[0], p.source, p.flags, 'id:$1', true)).toBe('id:42');
  });

  it('replaceAll replaces every occurrence, past the display cap', () => {
    const text = 'x '.repeat(MAX_MATCHES + 100);
    const p = buildSearchPattern('x', OPTS);
    expect(replaceAll(text, p.source, p.flags, 'y', false)).toBe('y '.repeat(MAX_MATCHES + 100));
  });

  it('replaceAll respects case sensitivity from the flags', () => {
    const p = buildSearchPattern('foo', { ...OPTS, matchCase: true });
    expect(replaceAll('foo Foo FOO', p.source, p.flags, 'bar', false)).toBe('bar Foo FOO');
  });
});
