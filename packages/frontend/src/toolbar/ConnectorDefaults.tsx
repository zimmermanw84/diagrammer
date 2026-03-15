import type { ConnectorStyle, ArrowHeadType } from "@diagrammer/shared";
import { THEME } from "../theme.js";
import { ARROW_OPTIONS, DASH_OPTIONS } from "../connectorOptions.js";

interface ConnectorDefaultsProps {
  style: ConnectorStyle;
  onChange: (patch: Partial<ConnectorStyle>) => void;
}

export function ConnectorDefaults({ style, onChange }: ConnectorDefaultsProps) {
  return (
    <div style={styles.section}>
      <div style={styles.heading}>Connector</div>

      <div style={styles.row}>
        <span style={styles.label}>Line</span>
        <div style={styles.toggleGroup}>
          {DASH_OPTIONS.map(({ value, label, tooltip }) => (
            <button
              key={value}
              style={{
                ...styles.toggleBtn,
                ...(style.strokeDash === value ? styles.toggleBtnActive : {}),
              }}
              onClick={() => onChange({ strokeDash: value })}
              title={tooltip}
              aria-pressed={style.strokeDash === value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Start</span>
        <select
          value={style.arrowStart}
          onChange={(e) => onChange({ arrowStart: e.target.value as ArrowHeadType })}
          style={styles.select}
          aria-label="Arrow start"
        >
          {ARROW_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>End</span>
        <select
          value={style.arrowEnd}
          onChange={(e) => onChange({ arrowEnd: e.target.value as ArrowHeadType })}
          style={styles.select}
          aria-label="Arrow end"
        >
          {ARROW_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    paddingTop: "8px",
    borderTop: `1px solid ${THEME.surface0}`,
  },
  heading: {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: THEME.overlay2,
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  label: {
    fontSize: "10px",
    color: THEME.subtext0,
    width: "30px",
    flexShrink: 0,
  },
  toggleGroup: {
    display: "flex",
    gap: "2px",
    flex: 1,
  },
  toggleBtn: {
    flex: 1,
    padding: "3px 2px",
    background: THEME.mantle,
    border: `1px solid ${THEME.surface0}`,
    borderRadius: "3px",
    color: THEME.subtext0,
    fontSize: "11px",
    cursor: "pointer",
    letterSpacing: "0.02em",
  },
  toggleBtnActive: {
    background: THEME.surface1,
    color: THEME.text,
    borderColor: THEME.blue,
  },
  select: {
    flex: 1,
    background: THEME.surface0,
    border: `1px solid ${THEME.surface1}`,
    color: THEME.text,
    borderRadius: "3px",
    padding: "2px 4px",
    fontSize: "10px",
  },
};
