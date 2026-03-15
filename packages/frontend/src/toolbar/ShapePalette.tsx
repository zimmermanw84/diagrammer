import { useEffect, useRef, useState } from "react";
import type { ShapeType } from "@diagrammer/shared";
import { toInches, clientToSvgCoords } from "../canvas/units.js";
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT } from "../canvas/canvasConstants.js";
import { THEME } from "../theme.js";

// ---------------------------------------------------------------------------
// Library data
// ---------------------------------------------------------------------------

export interface ShapeTemplate {
  type: ShapeType;
  label: string;
  tooltip?: string;
}

export interface ShapeLibrary {
  name: string;
  shapes: ShapeTemplate[];
}

export const LIBRARIES: ShapeLibrary[] = [
  {
    name: "Basic Shapes",
    shapes: [
      { type: "rectangle", label: "Rectangle" },
      { type: "ellipse", label: "Ellipse" },
      { type: "diamond", label: "Diamond" },
      { type: "rounded_rectangle", label: "Rounded", tooltip: "Rounded Rectangle" },
      { type: "triangle", label: "Triangle" },
      { type: "parallelogram", label: "Parallel", tooltip: "Parallelogram" },
    ],
  },
  {
    name: "Flowchart",
    shapes: [
      { type: "rectangle", label: "Process" },
      { type: "diamond", label: "Decision" },
      { type: "rounded_rectangle", label: "Terminator" },
      { type: "parallelogram", label: "Data" },
      { type: "ellipse", label: "Start/End" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Shape preview SVG
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Drag state
// ---------------------------------------------------------------------------

interface DragState {
  type: ShapeType;
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// ShapePalette
// ---------------------------------------------------------------------------

interface ShapePaletteProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  transform: { scale: number; x: number; y: number };
  onAddShape: (type: ShapeType, x: number, y: number) => void;
}

export function ShapePalette({ svgRef, transform, onAddShape }: ShapePaletteProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;

  // All libraries start expanded
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleLibrary = (name: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

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
        const { x: svgX, y: svgY } = clientToSvgCoords(e.clientX, e.clientY, rect, transform);
        const inchX = toInches(svgX) - DEFAULT_SHAPE_WIDTH / 2;
        const inchY = toInches(svgY) - DEFAULT_SHAPE_HEIGHT / 2;

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
      {LIBRARIES.map((lib) => {
        const isCollapsed = collapsed.has(lib.name);
        return (
          <div key={lib.name} style={styles.library}>
            <button
              style={styles.libraryHeader}
              onClick={() => toggleLibrary(lib.name)}
              aria-expanded={!isCollapsed}
              aria-label={lib.name}
            >
              <span style={styles.libraryName}>{lib.name}</span>
              <span style={styles.chevron}>{isCollapsed ? "▶" : "▼"}</span>
            </button>
            {!isCollapsed && (
              <div style={styles.grid}>
                {lib.shapes.map(({ type, label, tooltip }) => (
                  <div
                    key={label}
                    style={styles.tile}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setDrag({ type, x: e.clientX, y: e.clientY });
                    }}
                    title={tooltip ?? label}
                  >
                    <svg viewBox="0 0 40 30" style={styles.preview}>
                      <ShapePreview type={type} />
                    </svg>
                    <span style={styles.tileLabel}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

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
    gap: "4px",
    userSelect: "none",
    overflowY: "auto",
  },
  library: {
    display: "flex",
    flexDirection: "column",
  },
  libraryHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    background: "transparent",
    border: "none",
    borderRadius: "4px",
    padding: "4px 2px",
    cursor: "pointer",
    color: THEME.overlay2,
  },
  libraryName: {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  chevron: {
    fontSize: "8px",
    color: THEME.overlay2,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
    marginTop: "4px",
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
