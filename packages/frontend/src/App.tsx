import { useRef, useState } from "react";
import { DiagramProvider, useDiagram } from "./state/index.js";
import { Canvas } from "./canvas/Canvas.js";
import { ShapeLayer } from "./canvas/shapes/ShapeLayer.js";
import { ConnectorLayer } from "./canvas/connectors/ConnectorLayer.js";
import { ConnectorDrawing, resolveConnectionPoint } from "./canvas/ConnectorDrawing.js";
import { SelectionOverlay } from "./canvas/SelectionOverlay.js";
import { useKeyboardShortcuts } from "./canvas/useKeyboardShortcuts.js";
import { PropertiesPanel } from "./properties/PropertiesPanel.js";
import { DEFAULT_CONNECTOR_STYLE, DEFAULT_SHAPE_STYLE } from "@diagrammer/shared";
import type { ShapeType } from "@diagrammer/shared";
import { ShapePalette } from "./toolbar/ShapePalette.js";
import { PageTabBar } from "./canvas/PageTabBar.js";
import { ExportButton } from "./toolbar/ExportButton.js";
import { OfflineBanner } from "./toolbar/OfflineBanner.js";
import { useHealthCheck } from "./toolbar/useHealthCheck.js";
import { DEFAULT_SHAPE_SIZE } from "./canvas/canvasConstants.js";
import { THEME } from "./theme.js";
import type { InProgress } from "./canvas/ConnectorDrawing.js";
import type { ConnectionPoint } from "./canvas/shapes/ConnectionHandles.js";

function DiagramEditor() {
  const { state, dispatch, canUndo, canRedo } = useDiagram();
  const activePage = (
    state.document.pages.find((p) => p.id === state.activePageId) ?? state.document.pages[0]
  )!;
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [inProgress, setInProgress] = useState<InProgress | null>(null);
  const selectedShape = activePage.shapes.find((s) => s.id === state.selection) ?? null;
  const { isOnline } = useHealthCheck();

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
    <>
      {!isOnline && <OfflineBanner />}
      <div style={styles.shell}>
        <div style={styles.toolbar}>
          <ShapePalette
            svgRef={svgRef}
            transform={transform}
            onAddShape={(type: ShapeType, x: number, y: number) =>
              dispatch({
                type: "ADD_SHAPE",
                payload: {
                  type,
                  x,
                  y,
                  width: DEFAULT_SHAPE_SIZE,
                  height: DEFAULT_SHAPE_SIZE,
                  label: "",
                  style: { ...DEFAULT_SHAPE_STYLE },
                  properties: {},
                },
              })
            }
          />
          <div style={styles.toolbarActions}>
            <div style={styles.undoRedoRow}>
              <button
                style={{ ...styles.undoRedoButton, ...(canUndo ? {} : styles.undoRedoDisabled) }}
                onClick={() => dispatch({ type: "UNDO" })}
                disabled={!canUndo}
                title="Undo (Cmd/Ctrl+Z)"
              >
                Undo
              </button>
              <button
                style={{ ...styles.undoRedoButton, ...(canRedo ? {} : styles.undoRedoDisabled) }}
                onClick={() => dispatch({ type: "REDO" })}
                disabled={!canRedo}
                title="Redo (Cmd/Ctrl+Y)"
              >
                Redo
              </button>
            </div>
            <ExportButton doc={state.document} disabled={!isOnline} />
            <button
              style={styles.newButton}
              onClick={() => {
                if (window.confirm("Start a new diagram? Unsaved changes will be lost.")) {
                  dispatch({ type: "RESET" });
                }
              }}
            >
              New Diagram
            </button>
          </div>
        </div>

        <div style={styles.canvas}>
          <div style={styles.canvasArea}>
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
          <PageTabBar
            pages={state.document.pages}
            activePageId={state.activePageId}
            onSelect={(pageId) => dispatch({ type: "SET_ACTIVE_PAGE", payload: { pageId } })}
            onAdd={() =>
              dispatch({
                type: "ADD_PAGE",
                payload: { name: `Page ${state.document.pages.length + 1}`, width: 11, height: 8.5 },
              })
            }
            onRename={(pageId, name) => dispatch({ type: "RENAME_PAGE", payload: { pageId, name } })}
            onDelete={(pageId) => dispatch({ type: "DELETE_PAGE", payload: { pageId } })}
          />
        </div>

        <div style={styles.properties}>
          <PropertiesPanel />
        </div>
      </div>
    </>
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
    background: THEME.base,
    color: THEME.text,
    padding: "16px",
    borderRight: `1px solid ${THEME.surface0}`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  toolbarActions: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  undoRedoRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "4px",
  },
  undoRedoButton: {
    padding: "6px 4px",
    borderRadius: "6px",
    border: `1px solid ${THEME.surface1}`,
    background: "transparent",
    color: THEME.text,
    fontSize: "12px",
    cursor: "pointer",
  },
  undoRedoDisabled: {
    color: THEME.surface1,
    cursor: "not-allowed",
  },
  newButton: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: `1px solid ${THEME.surface1}`,
    background: "transparent",
    color: THEME.overlay2,
    fontSize: "12px",
    cursor: "pointer",
  },
  canvas: {
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  canvasArea: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  properties: {
    background: THEME.base,
    color: THEME.text,
    padding: "16px",
    borderLeft: `1px solid ${THEME.surface0}`,
    overflowY: "auto",
  },
};
