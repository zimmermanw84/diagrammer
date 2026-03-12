/** Pixels per inch at 100% zoom. */
export const PPI = 96;

export function toPixels(inches: number): number {
  return inches * PPI;
}

export function toInches(px: number): number {
  return px / PPI;
}
