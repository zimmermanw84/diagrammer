import { useCallback, useEffect, useRef, useState } from "react";
import type { DiagramPage } from "@diagrammer/shared";
import { CanvasBackground } from "./CanvasBackground";
import { toPixels } from "./units";

interface CanvasProps {
  page: DiagramPage;
  children?: React.ReactNode;
  onDeselect?: () => void;
}

interface Transform {
  scale: number;
  x: number;
  y: number;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 8;
const ZOOM_SENSITIVITY = 0.001;

export function Canvas({ page, children, onDeselect }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });

  // Track space key for pan mode
  const spaceDown = useRef(false);
  // Track middle-mouse or space+drag
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const pageW = toPixels(page.width);
  const pageH = toPixels(page.height);

  // Center the page on first render
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width, height } = svg.getBoundingClientRect();
    setTransform({
      scale: 1,
      x: (width - pageW) / 2,
      y: (height - pageH) / 2,
    });
  }, [pageW, pageH]);

  // Wheel → zoom around cursor
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    setTransform((prev) => {
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * (1 + delta)));
      const ratio = nextScale / prev.scale;
      return {
        scale: nextScale,
        x: cx - ratio * (cx - prev.x),
        y: cy - ratio * (cy - prev.y),
      };
    });
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  // Space key down/up
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        spaceDown.current = true;
        if (svgRef.current) svgRef.current.style.cursor = "grab";
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceDown.current = false;
        if (!dragging.current && svgRef.current) {
          svgRef.current.style.cursor = "default";
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const isMiddle = e.button === 1;
    const isSpaceDrag = e.button === 0 && spaceDown.current;
    if (!isMiddle && !isSpaceDrag) return;
    e.preventDefault();
    dragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      tx: transform.x,
      ty: transform.y,
    };
    if (svgRef.current) svgRef.current.style.cursor = "grabbing";
  }, [transform.x, transform.y]);

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTransform((prev) => ({ ...prev, x: dragStart.current.tx + dx, y: dragStart.current.ty + dy }));
  }, []);

  const onMouseUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    if (svgRef.current) {
      svgRef.current.style.cursor = spaceDown.current ? "grab" : "default";
    }
  }, []);

  const transformStr = `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`;

  return (
    <svg
      ref={svgRef}
      style={{ width: "100%", height: "100%", display: "block", background: "#e8e9ee" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={(e) => { if (e.target === e.currentTarget) onDeselect?.(); }}
    >
      <g transform={transformStr}>
        {/* Page background */}
        <rect width={pageW} height={pageH} fill="#f8f8f2" />

        {/* Grid */}
        <CanvasBackground width={pageW} height={pageH} />

        {/* Shape / connector layers go here */}
        {children}
      </g>
    </svg>
  );
}
