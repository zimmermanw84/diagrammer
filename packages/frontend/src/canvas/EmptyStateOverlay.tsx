import { THEME } from "../theme.js";

interface EmptyStateOverlayProps {
  pageW: number;
  pageH: number;
}

export function EmptyStateOverlay({ pageW, pageH }: EmptyStateOverlayProps) {
  const cx = pageW / 2;
  const cy = pageH / 2;

  return (
    <g style={{ pointerEvents: "none" }}>
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fontSize={14}
        fill={THEME.overlay2}
      >
        Drag a shape onto the canvas to get started
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fontSize={12}
        fill={THEME.subtext0}
      >
        Or double-click to add a shape
      </text>
    </g>
  );
}
