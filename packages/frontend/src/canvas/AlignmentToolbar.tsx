import type { DiagramShape } from "@diagrammer/shared";
import { THEME } from "../theme.js";

interface AlignmentToolbarProps {
  shapes: DiagramShape[];
  onAlign: (moves: { id: string; x: number; y: number }[]) => void;
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
    case "distributeH": {
      const sorted = [...shapes].sort((a, b) => a.x - b.x);
      const totalWidth = sorted.reduce((sum, s) => sum + s.width, 0);
      const span = sorted[sorted.length - 1]!.x + sorted[sorted.length - 1]!.width - sorted[0]!.x;
      const gap = (span - totalWidth) / (sorted.length - 1);
      let cursor = sorted[0]!.x;
      return sorted.map((s) => {
        const x = cursor;
        cursor += s.width + gap;
        return { id: s.id, x, y: s.y };
      });
    }
    case "distributeV": {
      const sorted = [...shapes].sort((a, b) => a.y - b.y);
      const totalHeight = sorted.reduce((sum, s) => sum + s.height, 0);
      const span = sorted[sorted.length - 1]!.y + sorted[sorted.length - 1]!.height - sorted[0]!.y;
      const gap = (span - totalHeight) / (sorted.length - 1);
      let cursor = sorted[0]!.y;
      return sorted.map((s) => {
        const y = cursor;
        cursor += s.height + gap;
        return { id: s.id, x: s.x, y };
      });
    }
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

export { computeMoves };
