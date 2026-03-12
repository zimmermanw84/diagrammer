import { PPI } from "./units";

interface CanvasBackgroundProps {
  width: number;
  height: number;
}

/**
 * SVG background grid rendered using <defs> + <pattern>.
 * Major grid lines every inch; minor dots every 0.25 inch.
 */
export function CanvasBackground({ width, height }: CanvasBackgroundProps) {
  const minor = PPI / 4; // 24px — dot spacing
  const major = PPI;     // 96px — line spacing

  return (
    <>
      <defs>
        {/* Drop shadow filter for shapes */}
        <filter id="shape-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx={2} dy={2} stdDeviation={3} floodOpacity={0.25} />
        </filter>
        {/* Minor dot pattern */}
        <pattern
          id="grid-minor"
          width={minor}
          height={minor}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={minor} cy={minor} r={1} fill="#c8c9d0" />
        </pattern>

        {/* Major line pattern (1 inch grid) */}
        <pattern
          id="grid-major"
          width={major}
          height={major}
          patternUnits="userSpaceOnUse"
        >
          <rect width={major} height={major} fill="url(#grid-minor)" />
          <line x1={0} y1={0} x2={major} y2={0} stroke="#d5d6dc" strokeWidth={0.5} />
          <line x1={0} y1={0} x2={0} y2={major} stroke="#d5d6dc" strokeWidth={0.5} />
        </pattern>
      </defs>

      <rect width={width} height={height} fill="url(#grid-major)" />
    </>
  );
}
