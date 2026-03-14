import { useCallback, useEffect, useRef, useState } from "react";
import { useWindowEvent } from "./useWindowEvent.js";

export interface Transform {
  scale: number;
  x: number;
  y: number;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 8;
const ZOOM_SENSITIVITY = 0.001;

export function usePanZoom(
  svgRef: React.RefObject<SVGSVGElement | null>,
  pageW: number,
  pageH: number,
  onTransformChange?: (t: Transform) => void,
) {
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const spaceDown = useRef(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // Center the page on first render
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width, height } = svg.getBoundingClientRect();
    setTransform({ scale: 1, x: (width - pageW) / 2, y: (height - pageH) / 2 });
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
      const next = { scale: nextScale, x: cx - ratio * (cx - prev.x), y: cy - ratio * (cy - prev.y) };
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

  // Space key for pan mode
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
      if (!isDragging.current && svgRef.current) svgRef.current.style.cursor = "default";
    }
  }, []);

  useWindowEvent("keydown", onKeyDown);
  useWindowEvent("keyup", onKeyUp);

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const isMiddle = e.button === 1;
    const isSpaceDrag = e.button === 0 && spaceDown.current;
    if (!isMiddle && !isSpaceDrag) return;
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, tx: transformRef.current.x, ty: transformRef.current.y };
    if (svgRef.current) svgRef.current.style.cursor = "grabbing";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTransform((prev) => {
      const next = { ...prev, x: dragStart.current.tx + dx, y: dragStart.current.ty + dy };
      onTransformChange?.(next);
      return next;
    });
  }, []);

  const onMouseUp = useCallback((_e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (svgRef.current) svgRef.current.style.cursor = spaceDown.current ? "grab" : "default";
  }, []);

  return { transform, transformRef, isDragging, onMouseDown, onMouseMove, onMouseUp };
}
