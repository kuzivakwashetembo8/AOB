import "@testing-library/jest-dom/vitest";

// Node 24+ exposes a separate experimental global localStorage that may be
// unavailable without --localstorage-file. Bind the test global explicitly
// to jsdom's origin-scoped Storage implementation instead.
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  writable: true,
  value: window.localStorage,
});

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
