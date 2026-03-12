interface CustomPropertiesProps {
  properties: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onDelete: (key: string) => void;
  onAdd: () => void;
}

export function CustomProperties({ properties, onChange, onDelete, onAdd }: CustomPropertiesProps) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#a6adc8", marginBottom: 6 }}>Custom properties</div>
      {Object.entries(properties).map(([key, value]) => (
        <div key={key} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          <input
            value={key}
            readOnly
            style={{ ...inputStyle, width: "40%", color: "#a6adc8" }}
          />
          <input
            value={value}
            onChange={(e) => onChange(key, e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
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

const inputStyle: React.CSSProperties = { background: "#313244", border: "1px solid #45475a", color: "#cdd6f4", borderRadius: 3, padding: "2px 4px", fontSize: 12 };
const btnStyle: React.CSSProperties = { background: "#45475a", border: "none", color: "#cdd6f4", borderRadius: 3, cursor: "pointer", fontSize: 12, padding: "2px 6px" };
