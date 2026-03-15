# UX/UI Improvement Plan — Diagrammer Frontend

**Date:** 2026-03-14
**Updated:** 2026-03-15

### Status

| Item | Description | Status | PR |
|------|-------------|--------|----|
| 1 | Empty state overlay | ⬜ Pending | — |
| 2 | Zoom controls widget | ⬜ Pending | — |
| 3 | Canvas page boundary contrast | ⬜ Pending | — |
| 4 | Toolbar layout (divider, danger button, reorder) | ✅ Done | #44 |
| 5 | Properties panel header + background | ✅ Done | #44 |
| 6 | Connector defaults (arrowStart + tooltips) | ✅ Done | #43 |
| 7 | Shape palette full-name tooltips | ✅ Done | #42 |
| 8 | Undo/Redo keyboard shortcut hints | ✅ Done | #44 |
| 9 | Page tab bar visual separation | ✅ Done | #42 |
**Base path:** `packages/frontend/src/`

---

## Codebase Context

The app is a three-column layout rendered in `App.tsx` using CSS-in-JS (`React.CSSProperties`). The color system is Catppuccin Mocha, defined in `theme.ts`. There is no CSS file, no component library, and no tooltip primitive — all styling is ad-hoc inline. State is managed via a custom `useReducer`+context pattern in `state/`. The canvas is an SVG element managed by `Canvas.tsx`, with pan/zoom in `usePanZoom.ts`.

Key observations:
- The toolbar uses `justifyContent: "space-between"` — `ShapePalette` is at top, `ConnectorDefaults` floats in middle, `toolbarActions` is pinned to bottom. The "gap" is structural, not accidental padding.
- `ConnectorStyle` already has `arrowStart: ArrowHeadType` in the shared schema — the field exists in state but is never exposed in the UI.
- No tooltip component exists; all current tooltips are native HTML `title` attributes.
- The page boundary: `fill="#f8f8f2"` on `background: "#e8e9ee"` — only a 6-unit lightness difference, no stroke.
- `usePanZoom` tracks `transform.scale` but exposes no fit-to-screen function.

---

## Item 1 — Empty State: Canvas guidance when empty

**Complexity:** S

**Problem:** When the active page has zero shapes and zero connectors, the canvas shows only a blank grid with no contextual prompt.

**Approach:** Render a centered SVG element inside `Canvas.tsx`'s content group, injected from `App.tsx` as a child alongside `ShapeLayer` and `ConnectorLayer`.

**Implementation:**

1. In `App.tsx`, derive `isEmpty`:
   ```ts
   const isEmpty = activePage.shapes.length === 0 && activePage.connectors.length === 0;
   ```

2. Pass a new child into `<Canvas>` that renders only when `isEmpty`:
   ```tsx
   {isEmpty && (
     <EmptyStateOverlay pageW={toPixels(activePage.width)} pageH={toPixels(activePage.height)} />
   )}
   ```

3. Create `canvas/EmptyStateOverlay.tsx` — renders inside the SVG transform group (moves with pan/zoom):
   - A centered `<text>` element at `pageW/2, pageH/2`: "Drag a shape onto the canvas to get started"
   - A secondary smaller text: "Or double-click to add a shape"
   - `fill={THEME.overlay2}`, `textAnchor="middle"`, `fontSize={14}`, `pointerEvents="none"`

**Files changed:**
- `canvas/EmptyStateOverlay.tsx` — new file
- `App.tsx` — add `isEmpty` derivation and child element

---

## Item 2 — Zoom Controls: +/−/100% widget and fit-to-screen

**Complexity:** M

**Problem:** `usePanZoom` handles wheel zoom and space-drag pan with no visible UI. Users cannot reset zoom or see the current zoom level.

**Approach:** Add a `ZoomControls` component overlaying the canvas (absolute positioned). Extend `usePanZoom` to expose an imperative zoom API.

**Implementation:**

1. Extend `usePanZoom.ts` to return four new callbacks:
   - `zoomIn()`: multiply scale by 1.25, pivot on viewport center
   - `zoomOut()`: multiply scale by 0.8, pivot on viewport center
   - `resetZoom()`: set scale to 1, re-center page
   - `fitToScreen()`: `scale = min(svgWidth/pageW, svgHeight/pageH) * 0.9`, centered

   Pivot math for button-driven zoom:
   ```ts
   const cx = svgRect.width / 2;
   const cy = svgRect.height / 2;
   const nextScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
   const ratio = nextScale / prev.scale;
   return { scale: nextScale, x: cx - ratio*(cx - prev.x), y: cy - ratio*(cy - prev.y) };
   ```

2. Create `canvas/ZoomControls.tsx` — receives `{ scale, onZoomIn, onZoomOut, onReset, onFit }`:
   - Position: `bottom: 48px, right: 12px` (above the `PageTabBar` height of 32px)
   - Four buttons: `−`, `[100%]`, `+`, fit icon (`⊡`)
   - `100%` button shows `Math.round(scale * 100) + "%"` and calls `onReset` on click
   - Style: `background: THEME.surface0`, `border: 1px solid THEME.surface1`, `borderRadius: 6px`

3. In `App.tsx`, add `onZoomReady` prop to `Canvas` (type: `(api: ZoomAPI) => void`). `Canvas.tsx` calls it in a `useEffect`. `App.tsx` stores in `useState<ZoomAPI | null>` and passes to `<ZoomControls>`.

4. Render `<ZoomControls>` inside `<div style={styles.canvasArea}>` in `App.tsx`, `position: absolute`.

**Files changed:**
- `canvas/usePanZoom.ts` — add `zoomIn`, `zoomOut`, `resetZoom`, `fitToScreen`
- `canvas/Canvas.tsx` — add `onZoomReady` prop, call in `useEffect`
- `canvas/ZoomControls.tsx` — new component
- `App.tsx` — wire `onZoomReady`, render `<ZoomControls>`

**Note:** Items 2 and 3 both touch `Canvas.tsx` — implement in the same PR.

---

## Item 3 — Canvas Page Boundary: Improve visual contrast

**Complexity:** S

**Problem:** The page rect (`fill="#f8f8f2"`) on the SVG background (`#e8e9ee`) has barely distinguishable contrast. No stroke on the page rect.

**Three targeted changes in `Canvas.tsx`:**

1. Add a page drop-shadow filter to `<defs>`:
   ```xml
   <filter id="page-shadow" x="-5%" y="-5%" width="110%" height="110%">
     <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#00000033" />
   </filter>
   ```
   Apply to page rect: `filter="url(#page-shadow)"`.

2. Add a subtle stroke: `stroke="#c8c9d0"` `strokeWidth={1}`.

3. Darken the outer SVG background from `#e8e9ee` to `#d8d9e0` to increase contrast ratio.

**Files changed:**
- `canvas/Canvas.tsx` — page-shadow filter in `<defs>`, stroke on page rect, updated SVG background color

---

## Item 4 — Toolbar Layout: Divider, destructive styling, export grouping

**Complexity:** S

**Problem:** `justifyContent: "space-between"` creates an unexplained visual gap. "New Diagram" is destructive but looks identical to neutral controls. Filename input is separated from its Export button by ImportButton.

**Sub-item 4a: Structural divider**

Add between `<ConnectorDefaults>` and `<div style={styles.toolbarActions}>` in `App.tsx`:
```tsx
<div style={styles.toolbarDivider} />
```
```ts
toolbarDivider: { height: "1px", background: THEME.surface0, margin: "4px 0" }
```

**Sub-item 4b: "New Diagram" danger styling**

Update `newButton` style in `App.tsx`:
- `color: THEME.red`
- `border: "1px solid rgba(243, 139, 168, 0.4)"` (ghost-style, not alarming)
- Keep background transparent

**Sub-item 4c: Reorder toolbar actions**

Current: Undo/Redo → Import → Export → New Diagram

New: Undo/Redo → Export (includes filename input) → Import → divider → New Diagram

This groups filename input with its Export button and isolates the destructive action.

**Files changed:**
- `App.tsx` — add `toolbarDivider` style, update `newButton` style, reorder `toolbarActions` children

---

## Item 5 — Right Panel: Header and background treatment

**Complexity:** S

**Problem:** The right panel uses the same `THEME.base` background as the left toolbar with no header. It reads as dead space before anything is selected.

**Implementation:**

1. Add a panel header in `App.tsx`:
   ```tsx
   <div style={styles.properties}>
     <div style={styles.propertiesHeader}>Properties</div>
     <PropertiesPanel />
   </div>
   ```
   ```ts
   propertiesHeader: {
     fontSize: "11px",
     fontWeight: 600,
     textTransform: "uppercase",
     letterSpacing: "0.08em",
     color: THEME.overlay2,
     paddingBottom: "12px",
     marginBottom: "8px",
     borderBottom: `1px solid ${THEME.surface0}`,
   }
   ```

2. Change panel background from `THEME.base` (`#1e1e2e`) to `THEME.mantle` (`#181825`).

**Files changed:**
- `App.tsx` — add `propertiesHeader` style and element, change `styles.properties.background`

---

## Item 6 — Connector Section: Add arrowStart selector and line style tooltips

**Complexity:** S

**Problem:** `ConnectorDefaults.tsx` only exposes `arrowEnd`. `arrowStart: ArrowHeadType` already exists in the schema and state but has never been shown. Dash toggle buttons use raw value strings as titles.

**Sub-item 6a: Add arrowStart selector**

In `ConnectorDefaults.tsx`, add a row above the existing Arrow row:
```tsx
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
```
Rename the existing "Arrow" row label to "End" for symmetry.

**Sub-item 6b: Line style button tooltips**

Add a `tooltip` field to `DASH_OPTIONS` in `connectorOptions.ts`:
```ts
{ value: "solid",  label: "—",     tooltip: "Solid line"  },
{ value: "dashed", label: "╌",     tooltip: "Dashed line" },
{ value: "dotted", label: "·····", tooltip: "Dotted line" },
```
Use `title={tooltip}` on each dash button.

**Files changed:**
- `toolbar/ConnectorDefaults.tsx` — add `arrowStart` row, rename label, use tooltip
- `connectorOptions.ts` — add `tooltip` field to `DASH_OPTIONS`

---

## Item 7 — Shape Palette: Hover tooltips with full names

**Complexity:** S

**Problem:** `LIBRARIES` uses truncated labels like `"Rounded"` and `"Parallel"`. The `title` attribute already fires but shows the already-truncated string.

**Implementation:**

1. Extend `ShapeTemplate` interface in `ShapePalette.tsx`:
   ```ts
   export interface ShapeTemplate {
     type: ShapeType;
     label: string;      // short display label for the grid tile
     tooltip?: string;   // full name; falls back to label if absent
   }
   ```

2. Update affected `LIBRARIES` entries:
   ```ts
   { type: "rounded_rectangle", label: "Rounded",  tooltip: "Rounded Rectangle" },
   { type: "parallelogram",     label: "Parallel", tooltip: "Parallelogram"      },
   ```

3. Update tile rendering: `title={tooltip ?? label}`.

**Files changed:**
- `toolbar/ShapePalette.tsx` — extend interface, update two data entries, update tile `title`

---

## Item 8 — Keyboard Shortcut Hints: Undo/Redo tooltip text

**Complexity:** XS

**Problem:** The Undo/Redo `title` attributes use a prose format `(Cmd/Ctrl+Z)`. macOS users expect the `⌘` symbol. Redo may actually be bound to `⌘⇧Z` rather than `⌘Y` — the handler in `useKeyboardShortcuts.ts` should be audited first.

**Implementation:**

1. Audit `canvas/useKeyboardShortcuts.ts` for the actual Redo binding.
2. Update `App.tsx` title strings:
   ```
   "Undo  ⌘Z / Ctrl+Z"
   "Redo  ⌘⇧Z / Ctrl+Y"   ← adjust based on audit
   ```

**Files changed:**
- `App.tsx` — update `title` attributes on Undo and Redo buttons

---

## Item 9 — Page Tab Bar: Visual separation from canvas

**Complexity:** S

**Problem:** `PageTabBar` has a hairline `1px solid THEME.surface0` top border that blends into the canvas at certain zoom levels, making the tab bar feel unanchored.

**Implementation:**

1. In `PageTabBar.tsx`, update `bar` style:
   ```ts
   borderTop: `2px solid ${THEME.surface1}`,
   boxShadow: "0 -2px 8px rgba(0,0,0,0.25)",
   ```

2. Update active tab to dominate the stronger bar border:
   ```ts
   tabActive: {
     background: THEME.base,
     color: THEME.text,
     borderTop: `3px solid ${THEME.blue}`,
     marginTop: "-1px",
   }
   ```

**Files changed:**
- `canvas/PageTabBar.tsx` — update `bar` style and `tabActive` style

---

## Execution Order

| Phase | Items | Rationale |
|-------|-------|-----------|
| 1 — no-risk | 7, 8, 9 | Pure style/data changes, no new components, no shared hooks |
| 2 — low-risk | 3, 4, 5, 6 | Targeted changes, one or two files each |
| 3 — medium-risk | 1, 2 | New components; Item 2 modifies `usePanZoom` (has tests) |

**Batch together:**
- Items 2 + 3 → same PR (both touch `Canvas.tsx`)
- Items 4 + 5 + 8 → same PR (all touch `App.tsx`)

---

## New Files

| File | Purpose |
|------|---------|
| `canvas/EmptyStateOverlay.tsx` | SVG empty-state prompt rendered as a canvas child (Item 1) |
| `canvas/ZoomControls.tsx` | Absolute-positioned zoom widget overlaying the canvas (Item 2) |

---

## Files Modified Summary

| File | Items | Nature of change |
|------|-------|-----------------|
| `App.tsx` | 1, 2, 4, 5, 8 | Style additions, new children, element reordering |
| `canvas/Canvas.tsx` | 2, 3 | `onZoomReady` prop; page-shadow filter and stroke |
| `canvas/usePanZoom.ts` | 2 | Expose `zoomIn`, `zoomOut`, `resetZoom`, `fitToScreen` |
| `canvas/PageTabBar.tsx` | 9 | Bar border weight, box-shadow, active tab adjustment |
| `canvas/EmptyStateOverlay.tsx` | 1 | New file |
| `canvas/ZoomControls.tsx` | 2 | New file |
| `toolbar/ConnectorDefaults.tsx` | 6 | Add `arrowStart` row, rename "Arrow" to "End", use tooltip |
| `toolbar/ShapePalette.tsx` | 7 | Extend `ShapeTemplate`, update data, update tile title |
| `connectorOptions.ts` | 6 | Add `tooltip` field to `DASH_OPTIONS` |
