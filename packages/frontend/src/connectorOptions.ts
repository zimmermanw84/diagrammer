import type { ArrowHeadType, StrokeDash } from "@diagrammer/shared";

export const ARROW_OPTIONS: { value: ArrowHeadType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "open", label: "Open" },
  { value: "filled", label: "Filled" },
  { value: "crowsfoot", label: "Crowsfoot" },
  { value: "one", label: "One" },
];

export const DASH_OPTIONS: { value: StrokeDash; label: string }[] = [
  { value: "solid", label: "—" },
  { value: "dashed", label: "╌" },
  { value: "dotted", label: "·····" },
];
