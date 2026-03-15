import type { ArrowHeadType, StrokeDash } from "@diagrammer/shared";

export const ARROW_OPTIONS: { value: ArrowHeadType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "open", label: "Open" },
  { value: "filled", label: "Filled" },
  { value: "crowsfoot", label: "Crowsfoot" },
  { value: "one", label: "One" },
];

export const DASH_OPTIONS: { value: StrokeDash; label: string; tooltip: string }[] = [
  { value: "solid",  label: "—",     tooltip: "Solid line"  },
  { value: "dashed", label: "╌",     tooltip: "Dashed line" },
  { value: "dotted", label: "·····", tooltip: "Dotted line" },
];
