interface ConnectionPoint {
  x: number;
  y: number;
}

interface ConnectionHandlesProps {
  width: number;
  height: number;
  visible: boolean;
  onStartConnect: (point: ConnectionPoint) => void;
}

const HANDLE_RADIUS = 6;

export function ConnectionHandles({ width: w, height: h, visible, onStartConnect }: ConnectionHandlesProps) {
  if (!visible) return null;

  const points: ConnectionPoint[] = [
    { x: w / 2, y: 0 },       // N
    { x: w,     y: h / 2 },   // E
    { x: w / 2, y: h },       // S
    { x: 0,     y: h / 2 },   // W
  ];

  return (
    <>
      {points.map((pt, i) => (
        <circle
          key={i}
          cx={pt.x}
          cy={pt.y}
          r={HANDLE_RADIUS}
          fill="white"
          stroke="#4f8ef7"
          strokeWidth={2}
          style={{ cursor: "crosshair" }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartConnect(pt);
          }}
        />
      ))}
    </>
  );
}

export type { ConnectionPoint };
