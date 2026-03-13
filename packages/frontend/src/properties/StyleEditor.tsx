import type { ShapeStyle } from "@diagrammer/shared";
import { StrokeDashSchema, TextAlignSchema } from "@diagrammer/shared";

interface StyleEditorProps {
  style: ShapeStyle;
  onChange: (patch: Partial<ShapeStyle>) => void;
}

export function StyleEditor({ style, onChange }: StyleEditorProps) {
  return (
    <div>
      <Row label="Fill">
        <input type="color" value={style.fillColor} onChange={(e) => onChange({ fillColor: e.target.value })} />
      </Row>
      <Row label="Stroke">
        <input type="color" value={style.strokeColor} onChange={(e) => onChange({ strokeColor: e.target.value })} />
      </Row>
      <Row label="Stroke width">
        <input type="number" min={0.5} max={20} step={0.5} value={style.strokeWidth}
          onChange={(e) => onChange({ strokeWidth: Number(e.target.value) })} style={inputStyle} />
      </Row>
      <Row label="Stroke dash">
        <select value={style.strokeDash} onChange={(e) => {
          const parsed = StrokeDashSchema.safeParse(e.target.value);
          if (parsed.success) onChange({ strokeDash: parsed.data });
        }} style={inputStyle}>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </Row>
      <Row label="Font family">
        <input type="text" value={style.fontFamily} onChange={(e) => onChange({ fontFamily: e.target.value })} style={inputStyle} />
      </Row>
      <Row label="Font size">
        <input type="number" min={6} max={72} value={style.fontSize}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) })} style={inputStyle} />
      </Row>
      <Row label="Font color">
        <input type="color" value={style.fontColor} onChange={(e) => onChange({ fontColor: e.target.value })} />
      </Row>
      <Row label="Bold">
        <input type="checkbox" checked={style.bold} onChange={(e) => onChange({ bold: e.target.checked })} />
      </Row>
      <Row label="Italic">
        <input type="checkbox" checked={style.italic} onChange={(e) => onChange({ italic: e.target.checked })} />
      </Row>
      <Row label="Text align">
        <select value={style.textAlign} onChange={(e) => {
          const parsed = TextAlignSchema.safeParse(e.target.value);
          if (parsed.success) onChange({ textAlign: parsed.data });
        }} style={inputStyle}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </Row>
      <Row label="Shadow">
        <input type="checkbox" checked={style.shadow} onChange={(e) => onChange({ shadow: e.target.checked })} />
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
