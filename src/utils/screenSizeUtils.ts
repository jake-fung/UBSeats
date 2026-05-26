/**
 * Returns the current viewport width in pixels.
 * Uses `window.innerWidth` which accounts for scrollbars.
 */
export function getScreenWidth(): number {
  return window.innerWidth;
}

/**
 * Returns the current viewport height in pixels.
 * Uses `window.innerHeight` which accounts for browser chrome (address bar, etc.).
 */
export function getScreenHeight(): number {
  return window.innerHeight;
}

/**
 * Returns both viewport dimensions as an object.
 */
export function getScreenSize(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Common Tailwind breakpoints in pixels.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

/**
 * Returns true if the viewport width is below the given Tailwind breakpoint.
 * e.g. isMobile() → true when width < 768 (below `md`)
 */
export function isMobile(): boolean {
  return window.innerWidth < BREAKPOINTS.md;
}

/**
 * Returns true if the viewport width is at or above the given Tailwind breakpoint.
 */
export function isAtLeast(breakpoint: keyof typeof BREAKPOINTS): boolean {
  return window.innerWidth >= BREAKPOINTS[breakpoint];
}
