import { useRef, useState } from "react";
import { DiagramProvider, useDiagram } from "./state/index.js";
import { Canvas } from "./canvas/Canvas.js";
import { ShapeLayer } from "./canvas/shapes/ShapeLayer.js";
import { ConnectorLayer } from "./canvas/connectors/ConnectorLayer.js";
import { ConnectorDrawing, resolveConnectionPoint } from "./canvas/ConnectorDrawing.js";
import { SelectionOverlay } from "./canvas/SelectionOverlay.js";
import { AlignmentToolbar } from "./canvas/AlignmentToolbar.js";
import { useKeyboardShortcuts } from "./canvas/useKeyboardShortcuts.js";
import { PropertiesPanel } from "./properties/PropertiesPanel.js";
import { DEFAULT_SHAPE_STYLE } from "@diagrammer/shared";
import type { ShapeType } from "@diagrammer/shared";
import { toInches, clientToSvgCoords } from "./canvas/units.js";
import { ShapePalette } from "./toolbar/ShapePalette.js";
import { PageTabBar } from "./canvas/PageTabBar.js";
import { ConnectorDefaults } from "./toolbar/ConnectorDefaults.js";
import { ExportButton } from "./toolbar/ExportButton.js";
import { OfflineBanner } from "./toolbar/OfflineBanner.js";
import { useHealthCheck } from "./toolbar/useHealthCheck.js";
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT } from "./canvas/canvasConstants.js";
import { THEME } from "./theme.js";
import type { InProgress } from "./canvas/ConnectorDrawing.js";
import type { ConnectionPoint } from "./canvas/shapes/ConnectionHandles.js";

function DiagramEditor() {
  const { state, dispatch, canUndo, canRedo, saveError } = useDiagram();
  const activePage = (
    state.document.pages.find((p) => p.id === state.activePageId) ?? state.document.pages[0]
  )!;
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [inProgress, setInProgress] = useState<InProgress | null>(null);

  // Derive selected shapes (for SelectionOverlay + AlignmentToolbar)
  const selectedShapes = activePage.shapes.filter((s) => state.selection.includes(s.id));
  // Single selected connector (for ConnectorDefaults toolbar)
  const selectedConnector = activePage.connectors.find(
    (c) => state.selection.length === 1 && c.id === state.selection[0]
  );

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
        style: { ...state.defaultConnectorStyle },
        routing: "straight",
      },
    });
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
    if (!file || !svgRef.current) return;

    const { x: svgX, y: svgY } = clientToSvgCoords(e.clientX, e.clientY, svgRef.current.getBoundingClientRect(), transform);
    const imageW = DEFAULT_SHAPE_WIDTH * 2;
    const imageH = DEFAULT_SHAPE_HEIGHT * 2;
    const x = toInches(svgX) - imageW / 2;
    const y = toInches(svgY) - imageH / 2;

    const reader = new FileReader();
    reader.onload = () => {
      dispatch({
        type: "ADD_SHAPE",
        payload: {
          type: "image",
          x,
          y,
          width: imageW,
          height: imageH,
          label: "",
          style: { ...DEFAULT_SHAPE_STYLE, fillColor: "transparent", strokeColor: "#ccc" },
          properties: {},
          src: reader.result as string,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRubberBandSelect = (rect: { x: number; y: number; w: number; h: number }) => {
    const hits = activePage.shapes
      .filter(
        (s) =>
          s.x < rect.x + rect.w &&
          s.x + s.width > rect.x &&
          s.y < rect.y + rect.h &&
          s.y + s.height > rect.y
      )
      .map((s) => s.id);
    if (hits.length === 0) {
      dispatch({ type: "SELECT", payload: { id: null } });
    } else {
      // Select all hits by dispatching multiple multi-selects
      dispatch({ type: "SELECT", payload: { id: null } }); // clear first
      for (const id of hits) {
        dispatch({ type: "SELECT", payload: { id, multi: true } });
      }
    }
  };

  return (
    <>
      {!isOnline && <OfflineBanner />}
      {saveError && (
        <div style={styles.saveErrorBanner}>
          ⚠ Could not save — browser storage is full. Export your diagram to avoid losing work.
        </div>
      )}
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
                  width: DEFAULT_SHAPE_WIDTH,
                  height: DEFAULT_SHAPE_HEIGHT,
                  label: "",
                  style: { ...DEFAULT_SHAPE_STYLE },
                  properties: {},
                },
              })
            }
          />
          <ConnectorDefaults
            style={selectedConnector?.style ?? state.defaultConnectorStyle}
            onChange={(patch) => {
              if (selectedConnector) {
                dispatch({ type: "UPDATE_CONNECTOR_STYLE", payload: { id: selectedConnector.id, style: patch } });
              } else {
                dispatch({ type: "SET_DEFAULT_CONNECTOR_STYLE", payload: patch });
              }
            }}
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
          <div style={styles.canvasArea} onDrop={handleImageDrop} onDragOver={(e) => e.preventDefault()}>
            {selectedShapes.length >= 2 && (
              <AlignmentToolbar
                shapes={selectedShapes}
                onAlign={(moves) => dispatch({ type: "MOVE_SHAPE_BATCH", payload: { moves } })}
              />
            )}
            <Canvas
              page={activePage}
              svgRef={svgRef}
              onTransformChange={setTransform}
              onDeselect={() => dispatch({ type: "SELECT", payload: { id: null } })}
              onRubberBandSelect={handleRubberBandSelect}
            >
              <ConnectorLayer
                connectors={activePage.connectors}
                shapes={activePage.shapes}
                selectedIds={state.selection}
                onSelect={(id) => dispatch({ type: "SELECT", payload: { id } })}
              />
              <ShapeLayer
                shapes={activePage.shapes}
                selectedIds={state.selection}
                onSelect={(id, multi) => dispatch({ type: "SELECT", payload: { id, multi } })}
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
              {selectedShapes.map((shape) => (
                <SelectionOverlay
                  key={shape.id}
                  shape={shape}
                  onResize={(id, width, height) =>
                    dispatch({ type: "RESIZE_SHAPE", payload: { id, width, height } })
                  }
                />
              ))}
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
  saveErrorBanner: {
    position: "fixed" as const,
    bottom: "40px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#f38ba8",
    color: "#1e1e2e",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 500,
    zIndex: 2000,
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  },
};
