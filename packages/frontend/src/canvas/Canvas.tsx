import { useEffect, useRef } from "react";
import type { DiagramPage } from "@diagrammer/shared";
import { toPixels } from "./units.js";
import { CanvasBackground } from "./CanvasBackground.js";
import { usePanZoom } from "./usePanZoom.js";
import { useRubberBandSelection } from "./useRubberBandSelection.js";
import type { Transform } from "./usePanZoom.js";

export interface ZoomAPI {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToScreen: () => void;
}

interface CanvasProps {
  page: DiagramPage;
  children?: React.ReactNode;
  onDeselect?: () => void;
  onRubberBandSelect?: (rect: { x: number; y: number; w: number; h: number }) => void;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  onTransformChange?: (t: Transform) => void;
  onZoomReady?: (api: ZoomAPI) => void;
}

export type { Transform };

export function Canvas({ page, children, onDeselect, onRubberBandSelect, svgRef: externalRef, onTransformChange, onZoomReady }: CanvasProps) {
  const internalRef = useRef<SVGSVGElement>(null);
  const svgRef = externalRef ?? internalRef;

  const pageW = toPixels(page.width);
  const pageH = toPixels(page.height);

  const {
    transform,
    transformRef,
    isDragging: isPanning,
    onMouseDown: panDown,
    onMouseMove: panMove,
    onMouseUp: panUp,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
  } = usePanZoom(svgRef, pageW, pageH, onTransformChange);

  const {
    rubberBand,
    onMouseDown: rbDown,
    onMouseMove: rbMove,
    onMouseUp: rbUp,
  } = useRubberBandSelection(svgRef, transformRef, isPanning, onDeselect, onRubberBandSelect);

  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => { panDown(e); rbDown(e); };
  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => { panMove(e); rbMove(e); };
  const onMouseUp = (e: React.MouseEvent<SVGSVGElement>) => { panUp(e); rbUp(e); };

  useEffect(() => {
    onZoomReady?.({ zoomIn, zoomOut, resetZoom, fitToScreen });
  }, [onZoomReady, zoomIn, zoomOut, resetZoom, fitToScreen]);

  const transformStr = `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`;

  return (
    <svg
      ref={svgRef}
      style={{ width: "100%", height: "100%", display: "block", background: "#d8d9e0" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <defs>
        <filter id="shape-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
        <filter id="page-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#00000033" />
        </filter>
      </defs>
      <g transform={transformStr}>
        {/* Page background */}
        <rect
          width={pageW}
          height={pageH}
          fill="#f8f8f2"
          stroke="#c8c9d0"
          strokeWidth={1}
          filter="url(#page-shadow)"
        />

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
