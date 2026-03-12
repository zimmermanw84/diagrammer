import { useRef, useState } from "react";
import { DiagramProvider, useDiagram } from "./state/index.js";
import { Canvas } from "./canvas/Canvas.js";
import { ShapeLayer } from "./canvas/shapes/ShapeLayer.js";
import { ConnectorLayer } from "./canvas/connectors/ConnectorLayer.js";
import { ConnectorDrawing, resolveConnectionPoint } from "./canvas/ConnectorDrawing.js";
import { SelectionOverlay } from "./canvas/SelectionOverlay.js";
import { useKeyboardShortcuts } from "./canvas/useKeyboardShortcuts.js";
import { DEFAULT_CONNECTOR_STYLE } from "@diagrammer/shared";
import type { InProgress } from "./canvas/ConnectorDrawing.js";
import type { ConnectionPoint } from "./canvas/shapes/ConnectionHandles.js";

function DiagramEditor() {
  const { state, dispatch } = useDiagram();
  const activePage = state.document.pages.find((p) => p.id === state.activePageId)!;
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [inProgress, setInProgress] = useState<InProgress | null>(null);
  const selectedShape = activePage.shapes.find((s) => s.id === state.selection) ?? null;

  useKeyboardShortcuts({
    selection: state.selection,
    shapes: activePage.shapes,
    connectors: activePage.connectors,
    dispatch,
  });

  const handleStartConnect = (shapeId: string, point: ConnectionPoint) => {
    const shape = activePage.shapes.find((s) => s.id === shapeId);
    if (!shape) return;
    const abs = resolveConnectionPoint(shape, point);
    setInProgress({ fromShapeId: shapeId, fromPoint: abs, toPoint: abs });
  };

  const handleConnect = (fromShapeId: string, toShapeId: string) => {
    dispatch({
      type: "ADD_CONNECTOR",
      payload: {
        fromShapeId,
        toShapeId,
        label: "",
        style: { ...DEFAULT_CONNECTOR_STYLE },
        routing: "straight",
      },
    });
  };

  return (
    <div style={styles.shell}>
      <div style={styles.toolbar}>
        <strong>Toolbar</strong>
        <p style={styles.hint}>Shape palette — T16</p>
      </div>

      <div style={styles.canvas}>
        <Canvas
          page={activePage}
          svgRef={svgRef}
          onTransformChange={setTransform}
          onDeselect={() => dispatch({ type: "SELECT", payload: { id: null } })}
        >
          <ConnectorLayer
            connectors={activePage.connectors}
            shapes={activePage.shapes}
            selectedId={state.selection}
            onSelect={(id) => dispatch({ type: "SELECT", payload: { id } })}
          />
          <ShapeLayer
            shapes={activePage.shapes}
            selectedId={state.selection}
            onSelect={(id) => dispatch({ type: "SELECT", payload: { id } })}
            onMove={(id, dx, dy) => dispatch({ type: "MOVE_SHAPE", payload: { id, dx, dy } })}
            onLabelChange={(id, label) => dispatch({ type: "SET_LABEL", payload: { id, label } })}
            onStartConnect={handleStartConnect}
          />
          <ConnectorDrawing
            shapes={activePage.shapes}
            svgRef={svgRef}
            transform={transform}
            onConnect={handleConnect}
            inProgress={inProgress}
            setInProgress={setInProgress}
          />
          {selectedShape && (
            <SelectionOverlay
              shape={selectedShape}
              onResize={(id, width, height) =>
                dispatch({ type: "RESIZE_SHAPE", payload: { id, width, height } })
              }
            />
          )}
        </Canvas>
      </div>

      <div style={styles.properties}>
        <strong>Properties</strong>
        <p style={styles.hint}>Shape properties — T10</p>
      </div>
    </div>
  );
}

export function App() {
  return (
    <DiagramProvider>
      <DiagramEditor />
    </DiagramProvider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: "grid",
    gridTemplateColumns: "200px 1fr 240px",
    gridTemplateRows: "100vh",
    height: "100vh",
    width: "100vw",
  },
  toolbar: {
    background: "#1e1e2e",
    color: "#cdd6f4",
    padding: "16px",
    borderRight: "1px solid #313244",
  },
  canvas: {
    overflow: "hidden",
    position: "relative",
  },
  properties: {
    background: "#1e1e2e",
    color: "#cdd6f4",
    padding: "16px",
    borderLeft: "1px solid #313244",
  },
  hint: {
    color: "#6c6f85",
    fontSize: "12px",
    marginTop: "8px",
  },
};
