import type { ShapeStyle, StyleSheet } from "@diagrammer/shared";
import { panelInputStyle, panelLabelStyle } from "./panelStyles.js";

interface StylePresetsProps {
  styleSheet: StyleSheet;
  onApply: (patch: Partial<ShapeStyle>) => void;
}

export function StylePresets({ styleSheet, onApply }: StylePresetsProps) {
  const entries = Object.entries(styleSheet.namedStyles);
  if (entries.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
      <span style={panelLabelStyle}>Preset</span>
      <select
        style={panelInputStyle}
        value=""
        onChange={(e) => {
          const patch = styleSheet.namedStyles[e.target.value];
          if (patch) onApply(patch);
        }}
      >
        <option value="" disabled>— apply preset —</option>
        {entries.map(([name]) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </div>
  );
}
