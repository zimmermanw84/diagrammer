import type { ConnectorStyle, ArrowHeadType } from "@diagrammer/shared";

interface ConnectorStyleEditorProps {
  style: ConnectorStyle;
  onChange: (patch: Partial<ConnectorStyle>) => void;
}

const ARROW_OPTIONS: { value: ArrowHeadType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "open", label: "Open" },
  { value: "filled", label: "Filled" },
  { value: "crowsfoot", label: "Crowsfoot" },
  { value: "one", label: "One" },
];

export function ConnectorStyleEditor({ style, onChange }: ConnectorStyleEditorProps) {
  return (
    <div>
      <Row label="Stroke">
        <input type="color" value={style.strokeColor} onChange={(e) => onChange({ strokeColor: e.target.value })} />
      </Row>
      <Row label="Width">
        <input type="number" min={0.5} max={20} step={0.5} value={style.strokeWidth}
          onChange={(e) => onChange({ strokeWidth: Number(e.target.value) })} style={inputStyle} />
      </Row>
      <Row label="Dash">
        <select value={style.strokeDash} onChange={(e) => onChange({ strokeDash: e.target.value as ConnectorStyle["strokeDash"] })} style={inputStyle}>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </Row>
      <Row label="Arrow start">
        <select value={style.arrowStart} onChange={(e) => onChange({ arrowStart: e.target.value as ArrowHeadType })} style={inputStyle}>
          {ARROW_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Row>
      <Row label="Arrow end">
        <select value={style.arrowEnd} onChange={(e) => onChange({ arrowEnd: e.target.value as ArrowHeadType })} style={inputStyle}>
          {ARROW_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
      <span style={{ width: 90, fontSize: 11, color: "#a6adc8", flexShrink: 0 }}>{label}</span>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", background: "#313244", border: "1px solid #45475a", color: "#cdd6f4", borderRadius: 3, padding: "2px 4px" };
