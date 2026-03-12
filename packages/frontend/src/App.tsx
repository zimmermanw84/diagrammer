import { DiagramProvider, useDiagram } from "./state/index.js";
import { Canvas } from "./canvas/Canvas.js";
import { ShapeLayer } from "./canvas/shapes/ShapeLayer.js";

function DiagramEditor() {
  const { state, dispatch } = useDiagram();
  const activePage = state.document.pages.find((p) => p.id === state.activePageId)!;

  return (
    <div style={styles.shell}>
      <div style={styles.toolbar}>
        <strong>Toolbar</strong>
        <p style={styles.hint}>Shape palette — T16</p>
      </div>

      <div style={styles.canvas}>
        <Canvas
          page={activePage}
          onDeselect={() => dispatch({ type: "SET_ACTIVE_PAGE", payload: { pageId: state.activePageId } })}
        >
          <ShapeLayer
            shapes={activePage.shapes}
            selectedId={state.selection}
            onSelect={(id) => dispatch({ type: "SELECT", payload: { id } })}
            onMove={(id, dx, dy) => dispatch({ type: "MOVE_SHAPE", payload: { id, dx, dy } })}
            onLabelChange={(id, label) => dispatch({ type: "SET_LABEL", payload: { id, label } })}
          />
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
