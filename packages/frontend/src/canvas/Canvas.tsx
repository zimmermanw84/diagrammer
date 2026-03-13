import { useCallback, useEffect, useRef, useState } from "react";
import { useWindowEvent } from "./useWindowEvent.js";
import type { DiagramPage } from "@diagrammer/shared";
import { CanvasBackground } from "./CanvasBackground";
import { toPixels, toInches } from "./units";

interface CanvasProps {
  page: DiagramPage;
  children?: React.ReactNode;
  onDeselect?: () => void;
  onRubberBandSelect?: (rect: { x: number; y: number; w: number; h: number }) => void;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  onTransformChange?: (t: Transform) => void;
}

interface Transform {
  scale: number;
  x: number;
  y: number;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 8;
const ZOOM_SENSITIVITY = 0.001;
const RUBBER_BAND_MIN_PX = 4;

export function Canvas({ page, children, onDeselect, onRubberBandSelect, svgRef: externalRef, onTransformChange }: CanvasProps) {
  const internalRef = useRef<SVGSVGElement>(null);
  const svgRef = externalRef ?? internalRef;
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });

  // Track space key for pan mode
  const spaceDown = useRef(false);
  // Track middle-mouse or space+drag
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // Rubber-band state
  const rbStart = useRef<{ clientX: number; clientY: number } | null>(null);
  const [rubberBand, setRubberBand] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const transformRef = useRef(transform);
  transformRef.current = transform;

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
      const next = {
        scale: nextScale,
        x: cx - ratio * (cx - prev.x),
        y: cy - ratio * (cy - prev.y),
      };
      onTransformChange?.(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  // Space key down/up
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space" && e.target === document.body) {
      e.preventDefault();
      spaceDown.current = true;
      if (svgRef.current) svgRef.current.style.cursor = "grab";
    }
  }, []);

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space") {
      spaceDown.current = false;
      if (!dragging.current && svgRef.current) {
        svgRef.current.style.cursor = "default";
      }
    }
  }, []);

  useWindowEvent("keydown", onKeyDown);
  useWindowEvent("keyup", onKeyUp);

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const isMiddle = e.button === 1;
    const isSpaceDrag = e.button === 0 && spaceDown.current;

    if (isMiddle || isSpaceDrag) {
      e.preventDefault();
      dragging.current = true;
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        tx: transformRef.current.x,
        ty: transformRef.current.y,
      };
      if (svgRef.current) svgRef.current.style.cursor = "grabbing";
      return;
    }

    // Left-click on background → start rubber-band
    if (e.button === 0) {
      rbStart.current = { clientX: e.clientX, clientY: e.clientY };
    }
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dragging.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setTransform((prev) => {
        const next = { ...prev, x: dragStart.current.tx + dx, y: dragStart.current.ty + dy };
        onTransformChange?.(next);
        return next;
      });
      return;
    }

    if (rbStart.current) {
      const dx = e.clientX - rbStart.current.clientX;
      const dy = e.clientY - rbStart.current.clientY;
      if (Math.abs(dx) > RUBBER_BAND_MIN_PX || Math.abs(dy) > RUBBER_BAND_MIN_PX) {
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const t = transformRef.current;
        const toSvgX = (cx: number) => (cx - rect.left - t.x) / t.scale;
        const toSvgY = (cy: number) => (cy - rect.top - t.y) / t.scale;
        const x1 = toSvgX(rbStart.current.clientX);
        const y1 = toSvgY(rbStart.current.clientY);
        const x2 = toSvgX(e.clientX);
        const y2 = toSvgY(e.clientY);
        setRubberBand({
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          w: Math.abs(x2 - x1),
          h: Math.abs(y2 - y1),
        });
      }
    }
  }, []);

  const onMouseUp = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dragging.current) {
      dragging.current = false;
      if (svgRef.current) {
        svgRef.current.style.cursor = spaceDown.current ? "grab" : "default";
      }
      return;
    }

    if (rbStart.current) {
      const dx = e.clientX - rbStart.current.clientX;
      const dy = e.clientY - rbStart.current.clientY;

      if (Math.abs(dx) > RUBBER_BAND_MIN_PX || Math.abs(dy) > RUBBER_BAND_MIN_PX) {
        // Rubber-band: emit selection rect in inches
        if (rubberBand) {
          onRubberBandSelect?.({
            x: toInches(rubberBand.x),
            y: toInches(rubberBand.y),
            w: toInches(rubberBand.w),
            h: toInches(rubberBand.h),
          });
        }
      } else {
        // Plain click on background → deselect
        onDeselect?.();
      }

      rbStart.current = null;
      setRubberBand(null);
    }
  }, [rubberBand, onDeselect, onRubberBandSelect]);

  const transformStr = `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`;

  return (
    <svg
      ref={svgRef}
      style={{ width: "100%", height: "100%", display: "block", background: "#e8e9ee" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <defs>
        <filter id="shape-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
      </defs>
      <g transform={transformStr}>
        {/* Page background */}
        <rect width={pageW} height={pageH} fill="#f8f8f2" />

        {/* Grid */}
        <CanvasBackground width={pageW} height={pageH} />

        {/* Shape / connector layers go here */}
        {children}

        {/* Rubber-band selection rect */}
        {rubberBand && (
          <rect
            x={rubberBand.x}
            y={rubberBand.y}
            width={rubberBand.w}
            height={rubberBand.h}
            fill="rgba(79,142,247,0.08)"
            stroke="#4f8ef7"
            strokeWidth={1}
            strokeDasharray="4 2"
            style={{ pointerEvents: "none" }}
          />
        )}
      </g>
    </svg>
  );
}
