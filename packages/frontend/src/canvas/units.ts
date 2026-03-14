/** Pixels per inch at 100% zoom. */
export const PPI = 96;

export function toPixels(inches: number): number {
  return inches * PPI;
}

export function toInches(px: number): number {
  return px / PPI;
}

/**
 * Convert a client (viewport) coordinate to SVG canvas coordinates,
 * accounting for the canvas pan/zoom transform.
 */
export function clientToSvgCoords(
  clientX: number,
  clientY: number,
  svgRect: { left: number; top: number },
  transform: { x: number; y: number; scale: number }
): { x: number; y: number } {
  return {
    x: (clientX - svgRect.left - transform.x) / transform.scale,
    y: (clientY - svgRect.top - transform.y) / transform.scale,
  };
}
