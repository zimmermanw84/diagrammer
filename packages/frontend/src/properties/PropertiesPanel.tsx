import { useDiagram } from "../state/index.js";
import { StyleEditor } from "./StyleEditor.js";
import { ConnectorStyleEditor } from "./ConnectorStyleEditor.js";
import { CustomProperties } from "./CustomProperties.js";
import { StylePresets } from "./StylePresets.js";
import { THEME } from "../theme.js";

export function PropertiesPanel() {
  const { state, dispatch } = useDiagram();
  const activePage = (
    state.document.pages.find((p) => p.id === state.activePageId) ?? state.document.pages[0]
  )!;
  const { selection } = state;

  if (!selection) {
    return <p style={emptyStyle}>Select a shape to edit its properties</p>;
  }

  const shape = activePage.shapes.find((s) => s.id === selection);
  if (shape) {
    const propCount = Object.keys(shape.properties).length;
    return (
      <div style={panelStyle}>
        <Section title="Style Presets">
          <StylePresets
            styleSheet={state.document.styleSheet}
            onApply={(patch) => dispatch({ type: "UPDATE_STYLE", payload: { id: shape.id, style: patch } })}
          />
        </Section>
        <Section title="Style">
          <StyleEditor
            style={shape.style}
            onChange={(patch) => dispatch({ type: "UPDATE_STYLE", payload: { id: shape.id, style: patch } })}
          />
        </Section>
        <Section title="Properties">
          <CustomProperties
            properties={shape.properties}
            onChange={(key, value) => dispatch({ type: "SET_PROPERTY", payload: { id: shape.id, key, value } })}
            onDelete={(key) => dispatch({ type: "DELETE_PROPERTY", payload: { id: shape.id, key } })}
            onAdd={() => dispatch({ type: "SET_PROPERTY", payload: { id: shape.id, key: `property_${propCount + 1}`, value: "" } })}
          />
        </Section>
      </div>
    );
  }

  const connector = activePage.connectors.find((c) => c.id === selection);
  if (connector) {
    return (
      <div style={panelStyle}>
        <Section title="Connector Style">
          <ConnectorStyleEditor
            style={connector.style}
            onChange={(patch) => dispatch({ type: "UPDATE_CONNECTOR_STYLE", payload: { id: connector.id, style: patch } })}
          />
        </Section>
      </div>
    );
  }

  return null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: "bold", color: THEME.blue, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

const panelStyle: React.CSSProperties = { padding: "4px 0", overflowY: "auto", height: "100%" };
const emptyStyle: React.CSSProperties = { color: THEME.overlay2, fontSize: 12, padding: "8px 0", margin: 0 };
