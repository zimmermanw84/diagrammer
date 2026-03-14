import type { DiagramShape } from "@diagrammer/shared";
import { THEME } from "../theme.js";

interface AlignmentToolbarProps {
  shapes: DiagramShape[];
  onAlign: (moves: { id: string; x: number; y: number }[]) => void;
}

function distributeAlongAxis(
  shapes: DiagramShape[],
  axis: "x" | "y",
  size: "width" | "height"
): { id: string; x: number; y: number }[] {
  const sorted = [...shapes].sort((a, b) => a[axis] - b[axis]);
  const totalSize = sorted.reduce((sum, s) => sum + s[size], 0);
  const last = sorted[sorted.length - 1]!;
  const span = last[axis] + last[size] - sorted[0]![axis];
  const gap = (span - totalSize) / (sorted.length - 1);
  let cursor = sorted[0]![axis];
  return sorted.map((s) => {
    const pos = cursor;
    cursor += s[size] + gap;
    return axis === "x"
      ? { id: s.id, x: pos, y: s.y }
      : { id: s.id, x: s.x, y: pos };
  });
}

function computeMoves(
  shapes: DiagramShape[],
  op: "left" | "centerH" | "right" | "top" | "middleV" | "bottom" | "distributeH" | "distributeV"
): { id: string; x: number; y: number }[] {
  if (shapes.length < 2) return [];

  switch (op) {
    case "left": {
      const minX = Math.min(...shapes.map((s) => s.x));
      return shapes.map((s) => ({ id: s.id, x: minX, y: s.y }));
    }
    case "centerH": {
      const avgCx = shapes.reduce((sum, s) => sum + s.x + s.width / 2, 0) / shapes.length;
      return shapes.map((s) => ({ id: s.id, x: avgCx - s.width / 2, y: s.y }));
    }
    case "right": {
      const maxRight = Math.max(...shapes.map((s) => s.x + s.width));
      return shapes.map((s) => ({ id: s.id, x: maxRight - s.width, y: s.y }));
    }
    case "top": {
      const minY = Math.min(...shapes.map((s) => s.y));
      return shapes.map((s) => ({ id: s.id, x: s.x, y: minY }));
    }
    case "middleV": {
      const avgCy = shapes.reduce((sum, s) => sum + s.y + s.height / 2, 0) / shapes.length;
      return shapes.map((s) => ({ id: s.id, x: s.x, y: avgCy - s.height / 2 }));
    }
    case "bottom": {
      const maxBottom = Math.max(...shapes.map((s) => s.y + s.height));
      return shapes.map((s) => ({ id: s.id, x: s.x, y: maxBottom - s.height }));
    }
    case "distributeH":
      return distributeAlongAxis(shapes, "x", "width");
    case "distributeV":
      return distributeAlongAxis(shapes, "y", "height");
  }
}

const BUTTONS: { op: Parameters<typeof computeMoves>[1]; title: string; label: string }[] = [
  { op: "left",        title: "Align left",           label: "⬅" },
  { op: "centerH",     title: "Align center (H)",     label: "↔" },
  { op: "right",       title: "Align right",          label: "➡" },
  { op: "top",         title: "Align top",            label: "⬆" },
  { op: "middleV",     title: "Align middle (V)",     label: "↕" },
  { op: "bottom",      title: "Align bottom",         label: "⬇" },
  { op: "distributeH", title: "Distribute horizontally", label: "⇔" },
  { op: "distributeV", title: "Distribute vertically",   label: "⇕" },
];

export function AlignmentToolbar({ shapes, onAlign }: AlignmentToolbarProps) {
  return (
    <div style={containerStyle} aria-label="Alignment toolbar">
      {BUTTONS.map(({ op, title, label }) => (
        <button
          key={op}
          title={title}
          aria-label={title}
          style={btnStyle}
          onClick={() => onAlign(computeMoves(shapes, op))}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: "absolute",
  top: 8,
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  gap: 2,
  background: THEME.base,
  border: `1px solid ${THEME.surface1}`,
  borderRadius: 6,
  padding: "4px 6px",
  zIndex: 10,
  pointerEvents: "all",
};

const btnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: THEME.text,
  cursor: "pointer",
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: 14,
};

export { computeMoves, distributeAlongAxis };
