import '@testing-library/jest-dom/vitest';

// Node 22+ ships an experimental `localStorage` global that is undefined
// unless node runs with --localstorage-file; under Vitest it shadows jsdom's
// implementation (window.localStorage comes back undefined while
// sessionStorage works). Install a plain in-memory Storage instead — the app
// only ever calls getItem/setItem/removeItem/clear.
class MemoryStorage {
  #map = new Map();
  getItem(key) {
    return this.#map.has(key) ? this.#map.get(key) : null;
  }
  setItem(key, value) {
    this.#map.set(String(key), String(value));
  }
  removeItem(key) {
    this.#map.delete(key);
  }
  clear() {
    this.#map.clear();
  }
  key(i) {
    return [...this.#map.keys()][i] ?? null;
  }
  get length() {
    return this.#map.size;
  }
}

// One shared instance — window.localStorage and bare `localStorage` must be
// the same store.
const memoryStorage = new MemoryStorage();
for (const target of [globalThis, window]) {
  Object.defineProperty(target, 'localStorage', {
    value: memoryStorage,
    writable: true,
    configurable: true,
  });
}

// jsdom has no matchMedia; MUI's useMediaQuery and theme.js's defaultThemeId
// both call it. Default stub matches nothing (desktop layout, light scheme);
// individual tests override window.matchMedia to simulate other environments.
export const matchMediaStub = (matches = false) => (query) => ({
  matches: typeof matches === 'function' ? matches(query) : matches,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});

beforeEach(() => {
  window.matchMedia = matchMediaStub();
  localStorage.clear();
});
