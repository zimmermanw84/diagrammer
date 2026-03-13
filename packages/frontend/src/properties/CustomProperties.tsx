import { panelInputStyle } from "./panelStyles.js";
import { THEME } from "../theme.js";

interface CustomPropertiesProps {
  properties: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onDelete: (key: string) => void;
  onAdd: () => void;
}

export function CustomProperties({ properties, onChange, onDelete, onAdd }: CustomPropertiesProps) {
  return (
    <div>
      <div style={{ fontSize: 11, color: THEME.subtext0, marginBottom: 6 }}>Custom properties</div>
      {Object.entries(properties).map(([key, value]) => (
        <div key={key} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          <input
            value={key}
            readOnly
            style={{ ...panelInputStyle, width: "40%", color: THEME.subtext0 }}
          />
          <input
            value={value}
            onChange={(e) => onChange(key, e.target.value)}
            style={{ ...panelInputStyle, flex: 1 }}
          />
          <button onClick={() => onDelete(key)} style={btnStyle} aria-label="Delete property">×</button>
        </div>
      ))}
      <button onClick={onAdd} style={{ ...btnStyle, width: "100%", marginTop: 4, padding: "4px 0" }}>
        + Add property
      </button>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: THEME.surface1,
  border: "none",
  color: THEME.text,
  borderRadius: 3,
  cursor: "pointer",
  fontSize: 12,
  padding: "2px 6px",
};
