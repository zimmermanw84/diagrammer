import type { ShapeType } from "@diagrammer/shared";

interface GeometryProps {
  type: ShapeType;
  width: number;
  height: number;
  style: React.SVGAttributes<SVGElement>;
  src?: string;
}

/**
 * Renders the raw SVG geometry for a shape type (no label, no interaction).
 * All dimensions are in pixels.
 */
export function ShapeGeometry({ type, width: w, height: h, style, src }: GeometryProps) {
  switch (type) {
    case "rectangle":
      return <rect x={0} y={0} width={w} height={h} {...style} />;

    case "rounded_rectangle":
      return <rect x={0} y={0} width={w} height={h} rx={8} ry={8} {...style} />;

    case "ellipse":
      return <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} {...style} />;

    case "diamond": {
      const pts = `${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`;
      return <polygon points={pts} {...style} />;
    }

    case "triangle": {
      const pts = `${w / 2},0 ${w},${h} 0,${h}`;
      return <polygon points={pts} {...style} />;
    }

    case "parallelogram": {
      const offset = w * 0.2;
      const pts = `${offset},0 ${w},0 ${w - offset},${h} 0,${h}`;
      return <polygon points={pts} {...style} />;
    }

    case "image":
      return src ? (
        <>
          <image href={src} x={0} y={0} width={w} height={h} preserveAspectRatio="xMidYMid meet" />
          <rect x={0} y={0} width={w} height={h} fill="none" stroke={style.stroke} strokeWidth={style.strokeWidth} />
        </>
      ) : (
        <rect x={0} y={0} width={w} height={h} {...style} />
      );
  }
}
