import { createEmptyDocument } from "@diagrammer/shared";
import { DiagramProvider } from "./state/index.js";

const doc = createEmptyDocument("My Diagram");

export function App() {
  return (
    <DiagramProvider>
    <div style={styles.shell}>
      <div style={styles.toolbar}>
        <strong>Toolbar</strong>
        <p style={styles.hint}>Shape palette — T16</p>
      </div>

      <div style={styles.canvas}>
        <span style={styles.canvasLabel}>
          Canvas — T06
          <br />
          <small>{doc.meta.title} · {doc.pages[0]?.width}" × {doc.pages[0]?.height}"</small>
        </span>
      </div>

      <div style={styles.properties}>
        <strong>Properties</strong>
        <p style={styles.hint}>Shape properties — T10</p>
      </div>
    </div>
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
    background: "#f8f8f2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6c6f85",
  },
  canvasLabel: {
    textAlign: "center",
    lineHeight: 2,
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
