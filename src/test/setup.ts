import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement ResizeObserver (used by the shared `useCanvas` hook) or a real canvas 2D
// context. Stub both so plot components can be rendered in component tests: the observer becomes a
// no-op and `getContext` returns null, which the plots already guard against (they simply skip the
// canvas draw and still render their DOM — figure, caption, aria-label).
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

HTMLCanvasElement.prototype.getContext = function getContext() {
  return null;
} as HTMLCanvasElement['getContext'];
