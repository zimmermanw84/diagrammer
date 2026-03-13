import { useRef, useState } from "react";
import type { DiagramShape, ShapeStyle } from "@diagrammer/shared";
import { toPixels } from "../units.js";
import { ShapeGeometry } from "./ShapeGeometry.js";
import { toSvgStyle } from "./shapeStyle.js";
import { ConnectionHandles } from "./ConnectionHandles.js";
import type { ConnectionPoint } from "./ConnectionHandles.js";

interface ShapeElementProps {
  shape: DiagramShape;
  isSelected: boolean;
  onSelect: (id: string, multi?: boolean) => void;
  onMove: (id: string, dx: number, dy: number) => void;
  onLabelChange: (id: string, label: string) => void;
  onStartConnect: (shapeId: string, point: ConnectionPoint) => void;
}

export function ShapeElement({
  shape,
  isSelected,
  onSelect,
  onMove,
  onLabelChange,
  onStartConnect,
}: ShapeElementProps) {
  const x = toPixels(shape.x);
  const y = toPixels(shape.y);
  const w = toPixels(shape.width);
  const h = toPixels(shape.height);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(shape.label);
  const [hovered, setHovered] = useState(false);
  const dragOrigin = useRef<{ mx: number; my: number; sx: number; sy: number } | null>(null);

  const svgStyle = toSvgStyle(shape.style);

  // ── drag ────────────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    if (editing) return;
    e.stopPropagation();
    onSelect(shape.id, e.shiftKey);
    dragOrigin.current = { mx: e.clientX, my: e.clientY, sx: shape.x, sy: shape.y };

    const onMouseMove = (me: MouseEvent) => {
      if (!dragOrigin.current) return;
      const dx = (me.clientX - dragOrigin.current.mx) / toPixels(1);
      const dy = (me.clientY - dragOrigin.current.my) / toPixels(1);
      onMove(shape.id, dx, dy);
      dragOrigin.current = { ...dragOrigin.current, mx: me.clientX, my: me.clientY };
    };

    const onMouseUp = () => {
      dragOrigin.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // ── inline label edit ───────────────────────────────────────────────────
  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(shape.label);
    setEditing(true);
  };

  const commitEdit = () => {
    setEditing(false);
    onLabelChange(shape.id, draft);
  };

  // ── label style ─────────────────────────────────────────────────────────
  const { fontFamily, fontSize, fontColor, bold, italic, textAlign } = shape.style as ShapeStyle;
  const fontWeight = bold ? "bold" : "normal";
  const fontStyle = italic ? "italic" : "normal";

  const textAnchor = textAlign === "left" ? "start" : textAlign === "right" ? "end" : "middle";
  const labelX = textAlign === "left" ? 6 : textAlign === "right" ? w - 6 : w / 2;
  const labelY = h / 2;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{ cursor: editing ? "text" : "move" }}
      onMouseDown={onMouseDown}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <ShapeGeometry type={shape.type} width={w} height={h} style={svgStyle} />

      <ConnectionHandles
        width={w}
        height={h}
        visible={(hovered || isSelected) && !editing}
        onStartConnect={(pt) => onStartConnect(shape.id, pt)}
      />

      {/* label */}
      {editing ? (
        <foreignObject x={2} y={2} width={w - 4} height={h - 4}>
          <input
            // @ts-expect-error — xmlns required for SVG foreignObject
            xmlns="http://www.w3.org/1999/xhtml"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") { setEditing(false); setDraft(shape.label); }
            }}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              outline: "2px solid #4f8ef7",
              borderRadius: 2,
              padding: "2px 4px",
              fontFamily,
              fontSize,
              fontWeight,
              fontStyle,
              textAlign,
              background: "rgba(255,255,255,0.9)",
              boxSizing: "border-box",
            }}
          />
        </foreignObject>
      ) : (
        shape.label && (
          <text
            x={labelX}
            y={labelY}
            dominantBaseline="middle"
            textAnchor={textAnchor}
            fontFamily={fontFamily}
            fontSize={fontSize}
            fill={fontColor}
            fontWeight={fontWeight}
            fontStyle={fontStyle}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {shape.label}
          </text>
        )
      )}
    </g>
  );
}
