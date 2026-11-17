import "@testing-library/jest-dom/vitest";

// Node 25+ may expose a native localStorage global that evaluates to
// undefined unless --localstorage-file is configured. Vitest's jsdom global
// population skips keys that already exist on Node's global, so the working
// jsdom Storage objects must be read from the underlying JSDOM instance.
const jsdomWindow = (
  globalThis as typeof globalThis & { jsdom?: { window: Window } }
).jsdom?.window;

if (jsdomWindow) {
  for (const key of ["localStorage", "sessionStorage"] as const) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: jsdomWindow[key],
    });
  }
}

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
