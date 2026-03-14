import type { DiagramShape } from "@diagrammer/shared";
import { toPixels } from "./units.js";

export type Point = { x: number; y: number };

// Tolerance for ray-polygon intersection math
const RAY_EPS = 0.0001;
// Tolerance for treating a direction vector component as zero
const ZERO_EPS = 0.001;

/** Returns the center of a shape in pixels. */
export function shapeCenter(shape: DiagramShape): Point {
  return {
    x: toPixels(shape.x + shape.width / 2),
    y: toPixels(shape.y + shape.height / 2),
  };
}

/**
 * Find where a ray from (cx, cy) toward (towardX, towardY) first exits a
 * convex polygon defined by `vertices` (in order). Returns the intersection
 * point, or the center if none is found (degenerate case).
 */
export function rayPolygonEdge(
  cx: number, cy: number,
  towardX: number, towardY: number,
  vertices: Point[]
): Point {
  const dx = towardX - cx;
  const dy = towardY - cy;
  let bestT = Infinity;
  let best: Point = { x: cx, y: cy };

  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i]!;
    const b = vertices[(i + 1) % vertices.length]!;
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const cross = dx * aby - dy * abx;
    if (Math.abs(cross) < RAY_EPS) continue; // parallel
    const t = ((a.x - cx) * aby - (a.y - cy) * abx) / cross;
    const s = ((a.x - cx) * dy - (a.y - cy) * dx) / cross;
    if (t > RAY_EPS && s >= -RAY_EPS && s <= 1 + RAY_EPS && t < bestT) {
      bestT = t;
      best = { x: cx + dx * t, y: cy + dy * t };
    }
  }
  return best;
}

/**
 * Returns the point on the shape's actual visual border where a ray from the
 * shape center toward (towardX, towardY) exits — accounting for shape type.
 */
export function shapeEdgePoint(
  shape: DiagramShape,
  towardX: number,
  towardY: number
): Point {
  const { x: cx, y: cy } = shapeCenter(shape);
  const hw = toPixels(shape.width / 2);
  const hh = toPixels(shape.height / 2);
  const dx = towardX - cx;
  const dy = towardY - cy;

  if (Math.abs(dx) < ZERO_EPS && Math.abs(dy) < ZERO_EPS) return { x: cx, y: cy };

  switch (shape.type) {
    case "ellipse": {
      // Closed-form: point on ellipse at the angle toward target
      const angle = Math.atan2(dy, dx);
      return { x: cx + hw * Math.cos(angle), y: cy + hh * Math.sin(angle) };
    }

    case "diamond":
      return rayPolygonEdge(cx, cy, towardX, towardY, [
        { x: cx,      y: cy - hh },
        { x: cx + hw, y: cy      },
        { x: cx,      y: cy + hh },
        { x: cx - hw, y: cy      },
      ]);

    case "triangle":
      return rayPolygonEdge(cx, cy, towardX, towardY, [
        { x: cx,      y: cy - hh },
        { x: cx + hw, y: cy + hh },
        { x: cx - hw, y: cy + hh },
      ]);

    case "parallelogram": {
      // offset = shape.width * 0.2 in pixels = hw * 0.4
      const off = hw * 0.4;
      return rayPolygonEdge(cx, cy, towardX, towardY, [
        { x: cx - hw + off, y: cy - hh },
        { x: cx + hw,       y: cy - hh },
        { x: cx + hw - off, y: cy + hh },
        { x: cx - hw,       y: cy + hh },
      ]);
    }

    default:
      // rectangle, rounded_rectangle, image — bounding box intersection
      const tx = Math.abs(dx) > ZERO_EPS ? hw / Math.abs(dx) : Infinity;
      const ty = Math.abs(dy) > ZERO_EPS ? hh / Math.abs(dy) : Infinity;
      return { x: cx + dx * Math.min(tx, ty), y: cy + dy * Math.min(tx, ty) };
  }
}
