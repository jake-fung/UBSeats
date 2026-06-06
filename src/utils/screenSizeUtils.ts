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
 * Common Tailwind breakpoints in pixels.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;
