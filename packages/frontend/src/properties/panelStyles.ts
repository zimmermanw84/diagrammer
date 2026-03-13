import { THEME } from "../theme.js";

export const panelInputStyle: React.CSSProperties = {
  width: "100%",
  background: THEME.surface0,
  border: `1px solid ${THEME.surface1}`,
  color: THEME.text,
  borderRadius: 3,
  padding: "2px 4px",
};

export const panelLabelStyle: React.CSSProperties = {
  width: 90,
  fontSize: 11,
  color: THEME.subtext0,
  flexShrink: 0,
};
