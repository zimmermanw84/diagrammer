import { THEME } from "../theme.js";
import type { ZoomAPI } from "./Canvas.js";

interface ZoomControlsProps extends ZoomAPI {
  scale: number;
}

export function ZoomControls({ scale, zoomIn, zoomOut, resetZoom, fitToScreen }: ZoomControlsProps) {
  return (
    <div style={styles.container}>
      <button style={styles.btn} onClick={zoomOut} title="Zoom out">−</button>
      <button style={styles.scaleBtn} onClick={resetZoom} title="Reset zoom to 100%">
        {Math.round(scale * 100)}%
      </button>
      <button style={styles.btn} onClick={zoomIn} title="Zoom in">+</button>
      <button style={styles.btn} onClick={fitToScreen} title="Fit page to screen">⊡</button>
    </div>
  );
}

const btnBase: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: THEME.subtext0,
  fontSize: "14px",
  cursor: "pointer",
  padding: "4px 8px",
  lineHeight: 1,
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    bottom: "12px",
    right: "12px",
    display: "flex",
    alignItems: "center",
    background: THEME.surface0,
    border: `1px solid ${THEME.surface1}`,
    borderRadius: "6px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    zIndex: 10,
  },
  btn: btnBase,
  scaleBtn: {
    ...btnBase,
    fontSize: "12px",
    minWidth: "44px",
    textAlign: "center",
    borderLeft: `1px solid ${THEME.surface1}`,
    borderRight: `1px solid ${THEME.surface1}`,
  },
};
