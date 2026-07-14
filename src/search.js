// Pure find/replace logic shared by App and the find panel. No React here.

// Per-document cap so a one-letter query in a huge doc can't flood the
// overlay; the counter shows "2000+" when hit.
export const MAX_MATCHES = 2000;

export const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Builds { source, flags } for a search, or { source: null } for an empty
// query, or { error } for an invalid regex. Returns pattern pieces rather
// than a live RegExp so a shared lastIndex can never leak between callers.
export function buildSearchPattern(query, { matchCase, wholeWord, regex }) {
  if (!query) return { source: null };
  let source = regex ? query : escapeRegex(query);
  if (wholeWord) {
    // Conditional boundaries: \b next to a non-word char never matches, so
    // only anchor the ends of the query that are word characters (lets
    // "foo(" or "-x" still work in whole-word mode).
    if (/^\w/.test(query)) source = `\\b${source}`;
    if (/\w$/.test(query)) source = `${source}\\b`;
  }
  const flags = matchCase ? 'gm' : 'gmi';
  try {
    new RegExp(source, flags);
  } catch (err) {
    return { error: err.message };
  }
  return { source, flags };
}

// All matches of the pattern in text, as [{ start, end }].
export function findMatches(text, source, flags) {
  const re = new RegExp(source, flags);
  const matches = [];
  let m;
  while (matches.length < MAX_MATCHES && (m = re.exec(text)) !== null) {
    if (m[0].length === 0) {
      // Zero-length match (a*, ^, lookaround): skip it and force progress
      // so the loop can't spin forever.
      re.lastIndex += 1;
      continue;
    }
    matches.push({ start: m.index, end: m.index + m[0].length });
  }
  return { matches, capped: matches.length >= MAX_MATCHES };
}

// In literal mode "$" in the replacement must stay literal, so escape it for
// String.replace ($$); in regex mode $1/$& etc. pass through.
const replacementFor = (replacement, regexMode) =>
  regexMode ? replacement : replacement.replace(/\$/g, '$$$$');

// The text a single Replace inserts for one match — honors $1/$& in regex
// mode by re-running the pattern against just the matched segment. Exposed
// separately so App can route the edit through the textarea (execCommand)
// and keep native undo working.
export function replacementText(content, { start, end }, source, flags, replacement, regexMode) {
  return content
    .slice(start, end)
    .replace(new RegExp(source, flags.replace('g', '')), replacementFor(replacement, regexMode));
}

// Replaces a single known match.
export function replaceMatch(content, match, source, flags, replacement, regexMode) {
  const replaced = replacementText(content, match, source, flags, replacement, regexMode);
  return content.slice(0, match.start) + replaced + content.slice(match.end);
}

// Replaces every match in content (not capped — Replace All means all).
export function replaceAll(content, source, flags, replacement, regexMode) {
  return content.replace(new RegExp(source, flags), replacementFor(replacement, regexMode));
}
