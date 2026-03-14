import { useCallback, useRef, useState } from "react";
import { toInches } from "./units.js";
import type { Transform } from "./usePanZoom.js";

const RUBBER_BAND_MIN_PX = 4;

export interface RubberBandRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function useRubberBandSelection(
  svgRef: React.RefObject<SVGSVGElement | null>,
  transformRef: React.RefObject<Transform>,
  isPanning: React.RefObject<boolean>,
  onDeselect?: () => void,
  onRubberBandSelect?: (rect: RubberBandRect) => void,
) {
  const rbStart = useRef<{ clientX: number; clientY: number } | null>(null);
  const [rubberBand, setRubberBand] = useState<RubberBandRect | null>(null);

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning.current || e.button !== 0) return;
    rbStart.current = { clientX: e.clientX, clientY: e.clientY };
  }, [isPanning]);

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!rbStart.current) return;
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
      setRubberBand({ x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) });
    }
  }, [svgRef, transformRef]);

  const onMouseUp = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!rbStart.current) return;
    const dx = e.clientX - rbStart.current.clientX;
    const dy = e.clientY - rbStart.current.clientY;
    if (Math.abs(dx) > RUBBER_BAND_MIN_PX || Math.abs(dy) > RUBBER_BAND_MIN_PX) {
      if (rubberBand) {
        onRubberBandSelect?.({
          x: toInches(rubberBand.x),
          y: toInches(rubberBand.y),
          w: toInches(rubberBand.w),
          h: toInches(rubberBand.h),
        });
      }
    } else {
      onDeselect?.();
    }
    rbStart.current = null;
    setRubberBand(null);
  }, [rubberBand, onDeselect, onRubberBandSelect]);

  return { rubberBand, onMouseDown, onMouseMove, onMouseUp };
}
