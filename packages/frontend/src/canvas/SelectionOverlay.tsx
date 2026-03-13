import { useCallback, useRef, useState } from "react";
import type { DiagramShape } from "@diagrammer/shared";
import { toPixels, toInches } from "./units.js";
import { useWindowEvent } from "./useWindowEvent.js";

interface SelectionOverlayProps {
  shape: DiagramShape;
  onResize: (id: string, width: number, height: number) => void;
}

const HANDLE_SIZE = 6;
const MIN_INCHES = 0.25;

type HandlePosition = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface Handle {
  pos: HandlePosition;
  cx: number; // relative to shape top-left in px
  cy: number;
  cursor: string;
  resizeW: -1 | 0 | 1; // -1 shrinks left, 0 no change, 1 grows right
  resizeH: -1 | 0 | 1;
}

function getHandles(w: number, h: number): Handle[] {
  return [
    { pos: "nw", cx: 0,   cy: 0,   cursor: "nw-resize", resizeW: -1, resizeH: -1 },
    { pos: "n",  cx: w/2, cy: 0,   cursor: "n-resize",  resizeW:  0, resizeH: -1 },
    { pos: "ne", cx: w,   cy: 0,   cursor: "ne-resize", resizeW:  1, resizeH: -1 },
    { pos: "e",  cx: w,   cy: h/2, cursor: "e-resize",  resizeW:  1, resizeH:  0 },
    { pos: "se", cx: w,   cy: h,   cursor: "se-resize", resizeW:  1, resizeH:  1 },
    { pos: "s",  cx: w/2, cy: h,   cursor: "s-resize",  resizeW:  0, resizeH:  1 },
    { pos: "sw", cx: 0,   cy: h,   cursor: "sw-resize", resizeW: -1, resizeH:  1 },
    { pos: "w",  cx: 0,   cy: h/2, cursor: "w-resize",  resizeW: -1, resizeH:  0 },
  ];
}

export function SelectionOverlay({ shape, onResize }: SelectionOverlayProps) {
  const x = toPixels(shape.x);
  const y = toPixels(shape.y);
  const w = toPixels(shape.width);
  const h = toPixels(shape.height);
  const handles = getHandles(w, h);

  const [isDragging, setIsDragging] = useState(false);

  const dragState = useRef<{
    handle: Handle;
    startMx: number;
    startMy: number;
    startW: number;
    startH: number;
    shiftKey: boolean;
  } | null>(null);

  const onHandleMouseDown = (e: React.MouseEvent, handle: Handle) => {
    e.stopPropagation();
    e.preventDefault();
    dragState.current = {
      handle,
      startMx: e.clientX,
      startMy: e.clientY,
      startW: shape.width,
      startH: shape.height,
      shiftKey: e.shiftKey,
    };
    setIsDragging(true);
  };

  const onMouseMove = useCallback((me: MouseEvent) => {
    if (!dragState.current) return;
    const { handle: hdl, startMx, startMy, startW, startH, shiftKey } = dragState.current;
    const dpx = me.clientX - startMx;
    const dpy = me.clientY - startMy;
    const di = toInches(dpx);
    const dj = toInches(dpy);

    let newW = Math.max(MIN_INCHES, startW + di * hdl.resizeW);
    let newH = Math.max(MIN_INCHES, startH + dj * hdl.resizeH);

    // Maintain aspect ratio on corner handles when shift held
    if (shiftKey && hdl.resizeW !== 0 && hdl.resizeH !== 0) {
      const ratio = startW / startH;
      newH = newW / ratio;
    }

    onResize(shape.id, newW, newH);
  }, [shape.id, onResize]);

  const onMouseUp = useCallback(() => {
    dragState.current = null;
    setIsDragging(false);
  }, []);

  useWindowEvent("mousemove", onMouseMove, isDragging);
  useWindowEvent("mouseup", onMouseUp, isDragging);

  return (
    <g transform={`translate(${x}, ${y})`} data-selection-overlay>
      {/* Bounding box */}
      <rect
        x={0}
        y={0}
        width={w}
        height={h}
        fill="none"
        stroke="#4f8ef7"
        strokeWidth={1}
        strokeDasharray="4 2"
        style={{ pointerEvents: "none" }}
      />

      {/* Resize handles */}
      {handles.map((handle) => (
        <rect
          key={handle.pos}
          x={handle.cx - HANDLE_SIZE / 2}
          y={handle.cy - HANDLE_SIZE / 2}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
          fill="#4f8ef7"
          stroke="white"
          strokeWidth={1}
          style={{ cursor: handle.cursor }}
          onMouseDown={(e) => onHandleMouseDown(e, handle)}
        />
      ))}
    </g>
  );
}
