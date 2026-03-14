import type { ConnectorStyle } from "@diagrammer/shared";
import { StrokeDashSchema, ArrowHeadTypeSchema } from "@diagrammer/shared";
import { panelInputStyle, panelLabelStyle } from "./panelStyles.js";
import { ARROW_OPTIONS } from "../connectorOptions.js";

interface ConnectorStyleEditorProps {
  style: ConnectorStyle;
  onChange: (patch: Partial<ConnectorStyle>) => void;
}

export function ConnectorStyleEditor({ style, onChange }: ConnectorStyleEditorProps) {
  return (
    <div>
      <Row label="Stroke">
        <input type="color" value={style.strokeColor} onChange={(e) => onChange({ strokeColor: e.target.value })} />
      </Row>
      <Row label="Width">
        <input type="number" min={0.5} max={20} step={0.5} value={style.strokeWidth}
          onChange={(e) => onChange({ strokeWidth: Number(e.target.value) })} style={panelInputStyle} />
      </Row>
      <Row label="Dash">
        <select value={style.strokeDash} onChange={(e) => {
          const parsed = StrokeDashSchema.safeParse(e.target.value);
          if (parsed.success) onChange({ strokeDash: parsed.data });
        }} style={panelInputStyle}>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </Row>
      <Row label="Arrow start">
        <select value={style.arrowStart} onChange={(e) => {
          const parsed = ArrowHeadTypeSchema.safeParse(e.target.value);
          if (parsed.success) onChange({ arrowStart: parsed.data });
        }} style={panelInputStyle}>
          {ARROW_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Row>
      <Row label="Arrow end">
        <select value={style.arrowEnd} onChange={(e) => {
          const parsed = ArrowHeadTypeSchema.safeParse(e.target.value);
          if (parsed.success) onChange({ arrowEnd: parsed.data });
        }} style={panelInputStyle}>
          {ARROW_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
      <span style={panelLabelStyle}>{label}</span>
      {children}
    </div>
  );
}
