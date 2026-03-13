import { useEffect, useRef, useState } from "react";
import type { ShapeType } from "@diagrammer/shared";
import { toInches } from "../canvas/units.js";
import { DEFAULT_SHAPE_SIZE } from "../canvas/canvasConstants.js";
import { THEME } from "../theme.js";

const SHAPES: { type: ShapeType; label: string }[] = [
  { type: "rectangle", label: "Rectangle" },
  { type: "ellipse", label: "Ellipse" },
  { type: "diamond", label: "Diamond" },
  { type: "rounded_rectangle", label: "Rounded" },
  { type: "triangle", label: "Triangle" },
  { type: "parallelogram", label: "Parallel" },
];

// Miniature SVG preview for each shape type — 40×30 viewBox
function ShapePreview({ type }: { type: ShapeType }) {
  const fill = THEME.surface0;
  const stroke = THEME.blue;
  const sw = 1.5;

  switch (type) {
    case "rectangle":
      return <rect x={4} y={4} width={32} height={22} fill={fill} stroke={stroke} strokeWidth={sw} />;
    case "ellipse":
      return <ellipse cx={20} cy={15} rx={16} ry={11} fill={fill} stroke={stroke} strokeWidth={sw} />;
    case "diamond":
      return <polygon points="20,3 36,15 20,27 4,15" fill={fill} stroke={stroke} strokeWidth={sw} />;
    case "rounded_rectangle":
      return <rect x={4} y={4} width={32} height={22} rx={6} fill={fill} stroke={stroke} strokeWidth={sw} />;
    case "triangle":
      return <polygon points="20,3 36,27 4,27" fill={fill} stroke={stroke} strokeWidth={sw} />;
    case "parallelogram":
      return <polygon points="10,27 4,3 30,3 36,27" fill={fill} stroke={stroke} strokeWidth={sw} />;
    default:
      return <rect x={4} y={4} width={32} height={22} fill={fill} stroke={stroke} strokeWidth={sw} />;
  }
}

interface DragState {
  type: ShapeType;
  x: number;
  y: number;
}

interface ShapePaletteProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  transform: { scale: number; x: number; y: number };
  onAddShape: (type: ShapeType, x: number, y: number) => void;
}

export function ShapePalette({ svgRef, transform, onAddShape }: ShapePaletteProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;

  useEffect(() => {
    if (!drag) return;

    const onMouseMove = (e: MouseEvent) => {
      setDrag((prev) => prev && { ...prev, x: e.clientX, y: e.clientY });
    };

    const onMouseUp = (e: MouseEvent) => {
      const current = dragRef.current;
      if (!current) return;

      const svg = svgRef.current;
      if (svg) {
        const rect = svg.getBoundingClientRect();
        const svgX = (e.clientX - rect.left - transform.x) / transform.scale;
        const svgY = (e.clientY - rect.top - transform.y) / transform.scale;
        const inchX = toInches(svgX) - DEFAULT_SHAPE_SIZE / 2;
        const inchY = toInches(svgY) - DEFAULT_SHAPE_SIZE / 2;

        // Only place if the drop landed inside the SVG bounds
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          onAddShape(current.type, inchX, inchY);
        }
      }

      setDrag(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [drag, svgRef, transform, onAddShape]);

  return (
    <div style={styles.palette}>
      <div style={styles.heading}>Shapes</div>
      <div style={styles.grid}>
        {SHAPES.map(({ type, label }) => (
          <div
            key={type}
            style={styles.tile}
            onMouseDown={(e) => {
              e.preventDefault();
              setDrag({ type, x: e.clientX, y: e.clientY });
            }}
            title={label}
          >
            <svg viewBox="0 0 40 30" style={styles.preview}>
              <ShapePreview type={type} />
            </svg>
            <span style={styles.tileLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* Drag ghost */}
      {drag && (
        <div
          style={{
            ...styles.ghost,
            left: drag.x - 30,
            top: drag.y - 22,
          }}
        >
          <svg viewBox="0 0 40 30" style={styles.ghostSvg}>
            <ShapePreview type={drag.type} />
          </svg>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  palette: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    userSelect: "none",
  },
  heading: {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: THEME.overlay2,
    marginBottom: "4px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
  },
  tile: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    padding: "8px 4px",
    borderRadius: "6px",
    background: THEME.mantle,
    border: `1px solid ${THEME.surface0}`,
    cursor: "grab",
    transition: "border-color 0.1s, background 0.1s",
  },
  preview: {
    width: "40px",
    height: "30px",
    display: "block",
  },
  tileLabel: {
    fontSize: "10px",
    color: THEME.subtext0,
  },
  ghost: {
    position: "fixed",
    pointerEvents: "none",
    opacity: 0.7,
    zIndex: 9999,
  },
  ghostSvg: {
    width: "60px",
    height: "44px",
    display: "block",
  },
};
