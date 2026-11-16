const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotionOverride: boolean | null = null;

export function isReducedMotion(): boolean {
  if (reducedMotionOverride !== null) return reducedMotionOverride;
  return mediaQuery.matches;
}

export function setReducedMotionOverride(val: boolean | null): void {
  reducedMotionOverride = val;
}
