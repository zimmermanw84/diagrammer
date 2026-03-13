# Diagrammer — Task Breakdown

Tasks are grouped by phase and labeled with dependencies. Tasks sharing the same dependency set can be worked in parallel.

**Status legend:** `[ ]` todo · `[x]` done · `[-]` blocked

---

## Parallel Track Overview

```
T01 Monorepo Setup
 └── T02 Shared Schema  ──────────────────────────────────────┐
      ├── T03 Frontend Scaffold ────────────────────────────┐  │
      │    ├── T05 Reducer + State                          │  │
      │    │    ├── T07 ShapeElement Components             │  │
      │    │    │    ├── T08 ConnectorElement               │  │
      │    │    │    └── T09 SelectionOverlay + Resize      │  │
      │    │    ├── T10 PropertiesPanel                     │  │
      │    │    └── T13 Local Persistence                   │  │
      │    └── T06 Canvas SVG Shell + Grid                  │  │
      │         └── (T07 also depends on T06)               │  │
      └── T04 Toolbar / Shape Palette                       │  │
                                                            │  │
      T04 Backend Scaffold ──────────────────────────────┐  │  │
           └── T11 DiagramMapper (ts-visio) ─────────────┘  │  │
                └── T12 Export Route + Health Endpoint       │  │
                     └── T14 Export Button + Download UI ────┘  │
                          └── T15 Health Polling + Warning ──────┘
```

---

## Phase 0 — Monorepo Foundation

These must be completed before anything else. They are sequential.

### T01 · Monorepo Setup
**Depends on:** nothing
**Parallelizable with:** nothing (foundational)

- [x] Init root `package.json` with `"workspaces": ["packages/*"]`
- [x] Add `tsconfig.base.json` with strict settings, path aliases
- [x] Add root `eslint.config.js` with `typescript-eslint` and React rules
- [x] Add root `.gitignore`, `.nvmrc`
- [x] Create the `packages/shared`, `packages/frontend`, `packages/backend` directories

---

### T02 · Shared Schema (`@diagrammer/shared`)
**Depends on:** T01
**Parallelizable with:** nothing (T03 and T04 both depend on this)

- [x] Init `packages/shared/package.json` (name: `@diagrammer/shared`)
- [x] Install `zod` in shared package
- [x] Define all Zod schemas and inferred TypeScript types:
  - `DocumentMeta`, `DiagramDocument`
  - `DiagramPage`
  - `ShapeType` enum, `ShapeStyle`, `DiagramShape`
  - `ArrowHeadType` enum, `ConnectorStyle`, `RoutingAlgorithm`, `DiagramConnector`
  - `StyleSheet`
- [x] Export `DiagramDocumentSchema` (root validator)
- [x] Export `createEmptyDocument()` factory (single page, no shapes)
- [x] Confirm package builds and types are importable

---

## Phase 1A — Parallel: Frontend Scaffold + Backend Scaffold

Once T02 is done, these two tracks are fully independent.

---

### T03 · Frontend Scaffold (Vite + React)
**Depends on:** T02
**Parallelizable with:** T04 (Backend Scaffold)

- [x] Init `packages/frontend` with `vite` + `@vitejs/plugin-react`
- [x] Install `react`, `react-dom`, `typescript`
- [x] Add `@diagrammer/shared` as a workspace dependency
- [x] Set up `tsconfig.json` extending base
- [x] Create bare-bones `App.tsx` with a placeholder layout (toolbar left, canvas center, properties right)
- [x] Verify `npm run dev` works at `localhost:5173`

---

### T04 · Backend Scaffold (Express)
**Depends on:** T02
**Parallelizable with:** T03 (Frontend Scaffold)

- [x] Init `packages/backend/package.json`
- [x] Install `express`, `cors`, `zod`, `ts-visio` (pin to exact version)
- [x] Install `typescript`, `tsx` (or `ts-node`) for dev execution
- [x] Add `@diagrammer/shared` as a workspace dependency
- [x] Create `src/index.ts` — Express app with JSON body parser, CORS (`localhost:5173`)
- [x] Mount a stub router at `/api/v1`
- [x] Verify server starts at `localhost:3001`

---

## Phase 1B — Parallel: Frontend Components

All of these depend on T03. T05 and T06 can start simultaneously; the rest depend on one or both of them.

---

### T05 · Reducer + State
**Depends on:** T03
**Parallelizable with:** T06

- [x] Create `src/state/reducer.ts` with `DiagramDocument` as state shape
- [x] Implement all Phase 1 actions:
  `ADD_SHAPE`, `MOVE_SHAPE`, `RESIZE_SHAPE`, `DELETE_SHAPE`, `SET_LABEL`,
  `UPDATE_STYLE`, `SET_PROPERTY`, `DELETE_PROPERTY`,
  `ADD_CONNECTOR`, `DELETE_CONNECTOR`,
  `ADD_PAGE`, `SET_ACTIVE_PAGE`
- [x] Create `DiagramProvider` context that wraps `useReducer` and exposes `state` + `dispatch`
- [x] Wrap `App.tsx` in `DiagramProvider`
- [x] Add `selection: string | null` to UI state (separate from `DiagramDocument`)

---

### T06 · Canvas SVG Shell + Grid
**Depends on:** T03
**Parallelizable with:** T05

- [x] Create `Canvas` component with a full-viewport `<svg>` element
- [x] Implement PPI/zoom constant (96px per inch at 100%)
- [x] Add `CanvasBackground` — dotted or line grid rendered as SVG `<defs>` + `<use>` pattern
- [x] Add zoom state (wheel event → scale transform on a `<g>` wrapper)
- [x] Add pan state (middle-click/space+drag → translate transform)
- [x] Expose a `toInches(px)` / `toPixels(inches)` utility

---

### T07 · ShapeElement Components
**Depends on:** T05, T06
**Parallelizable with:** T10

- [x] Create `ShapeLayer` that maps `page.shapes` → `ShapeElement` components
- [x] Implement `ShapeElement` for each `ShapeType`:
  - `rectangle` → `<rect>`
  - `ellipse` → `<ellipse>`
  - `diamond` → `<polygon>` (4 points)
  - `rounded_rectangle` → `<rect rx>`
  - `triangle` → `<polygon>` (3 points)
  - `parallelogram` → `<polygon>` (4 points with offset)
- [x] Apply `ShapeStyle` (fill, stroke, stroke-width) to each element
- [x] Render shape label as centered `<text>` (or `<foreignObject>` for wrapping)
- [x] Click on shape → dispatch selection, stop propagation
- [x] Drag on selected shape → dispatch `MOVE_SHAPE`
- [x] Double-click → enter inline label edit mode (`<foreignObject>` + `<input>`, blur commits)

---

### T08 · ConnectorElement + Connection Handles
**Depends on:** T07
**Parallelizable with:** T09, T10

- [x] Create `ConnectorLayer` that maps `page.connectors` → `ConnectorElement` components
- [x] Implement `ConnectorElement` as an SVG `<path>` between two shape centers
  - Straight routing: direct line
  - Right-angle routing: axis-aligned elbow path
- [x] Apply `ConnectorStyle` (stroke color, width)
- [x] Render arrowheads using SVG `<marker>` + `<defs>` (one marker per `ArrowHeadType`)
- [x] Render connector label at path midpoint
- [x] On shape hover, show connection point handles (small `<circle>` at N/E/S/W)
- [x] Drag from connection handle → in-progress connector line follows mouse
- [x] Drop on another shape → dispatch `ADD_CONNECTOR`

---

### T09 · SelectionOverlay + Resize Handles
**Depends on:** T07
**Parallelizable with:** T08, T10

- [x] Render a bounding-box `<rect>` around the selected shape (dashed stroke, no fill)
- [x] Render 8 resize handle `<rect>` elements at corners and edge midpoints
- [x] Drag a resize handle → dispatch `RESIZE_SHAPE` (maintain aspect ratio if shift held)
- [x] Delete key on selected shape/connector → dispatch `DELETE_SHAPE` / `DELETE_CONNECTOR`

---

### T10 · Properties Panel
**Depends on:** T05
**Parallelizable with:** T07, T08, T09

- [x] Render panel on the right side, visible when a shape is selected
- [x] Style section: color pickers for `fillColor`, `strokeColor`, `fontColor`; inputs for `strokeWidth`, `fontSize`; toggles for `bold`, `italic`; select for `textAlign`
  - Each change dispatches `UPDATE_STYLE`
- [x] Custom properties section: editable key-value list from `shape.properties`
  - Add row → dispatches `SET_PROPERTY`
  - Remove row → dispatches `DELETE_PROPERTY`
- [x] Show connector properties (stroke color, width, arrow types) when connector is selected

---

### T11 · DiagramMapper (ts-visio Translation)
**Depends on:** T04
**Parallelizable with:** T03, T05, T06, T07, T08, T09, T10

- [x] Create `src/services/DiagramMapper.ts`
- [x] Implement `DiagramMapper.toVsdx(doc: DiagramDocument): Promise<Buffer>`
  - Create `VisioDocument`
  - Set document metadata
  - For each page: add page, iterate shapes and connectors
  - Map `ShapeType` → ts-visio shape type
  - Map `ShapeStyle` fields → ts-visio style properties
  - Map `properties` → custom shape data cells
  - Map connectors via shape ID lookup → `fromShape.connectTo()`
  - Map `ArrowHeadType` → ts-visio `ArrowHeads` enum
- [x] Write unit test with a minimal fixture document — assert buffer is non-empty

---

### T12 · Export Route + Health Endpoint
**Depends on:** T11
**Parallelizable with:** T03–T10

- [x] Create `src/routes/health.ts` — returns `{ status: "ok" }`
- [x] Create `src/routes/export.ts`:
  - `POST /export/vsdx`
  - Validate body with `DiagramDocumentSchema.parse()` → 422 on failure
  - Call `DiagramMapper.toVsdx()` → 500 on error
  - Stream buffer as `application/vnd.ms-visio.drawing` with `Content-Disposition`
- [x] Create `src/middleware/errorHandler.ts` — global Express error handler
- [x] Mount both routes in `src/index.ts`
- [x] Write integration test with `supertest` — POST a valid fixture, assert 200 + binary content-type

---

## Phase 1C — Integration: Wire Frontend Export + Persistence

These require both frontend (T05+) and backend (T12) to be done.

---

### T13 · Local Persistence
**Depends on:** T05
**Parallelizable with:** T14, T15 (no backend needed)

- [x] Subscribe to reducer dispatches; debounce 300ms, serialize `DiagramDocument` to `localStorage`
- [x] On app load, read from `localStorage` and restore state (fall back to `createEmptyDocument()`)
- [x] Add a "New Diagram" action that clears state (with a confirmation prompt)

---

### T14 · Export Button + Download UI
**Depends on:** T05, T12
**Parallelizable with:** T13, T15

- [x] Add "Export to Visio" button to Toolbar
- [x] On click: `POST /api/v1/export/vsdx` with current `DiagramDocument`
- [x] Loading state on button during request
- [x] On success: trigger browser download via `URL.createObjectURL(blob)`
- [x] On failure: display error toast with message from error envelope

---

### T15 · Health Polling + Backend Warning Banner
**Depends on:** T04, T03
**Parallelizable with:** T13, T14

- [x] Poll `GET /api/v1/health` every 5 seconds from the frontend
- [x] If unreachable: show a warning banner ("Backend offline — export unavailable") and disable Export button
- [x] If recovered: dismiss banner automatically

---

### T16 · Toolbar + Shape Palette
**Depends on:** T05, T06
**Parallelizable with:** T07, T08, T09, T10**

- [x] Render a vertical toolbar on the left with one tile per `ShapeType`
- [x] Each tile is a miniature SVG preview of the shape
- [x] Drag a tile onto the canvas → on drop, convert pixel drop coords to inches, dispatch `ADD_SHAPE` with default size (1" × 1") and style

---

## Phase 3 — Enhancements (post-MVP)

These are independent of each other and can be picked up in any order after Phase 1 and 2 are complete.

---

### T17 · Undo / Redo
**Depends on:** T05 (modify reducer)

- [ ] Wrap reducer with `past[]` / `future[]` stacks (cap past at 50)
- [ ] Add `UNDO` and `REDO` actions
- [ ] Wire `Cmd/Ctrl+Z` and `Cmd/Ctrl+Y` via global keydown listener
- [ ] Add Undo/Redo buttons to Toolbar (disabled when stack is empty)

---

### T18 · Multi-Page UI
**Depends on:** T05

- [ ] Add page tab bar at the bottom of the canvas
- [ ] Active page stored in UI state (not in `DiagramDocument`)
- [ ] "+" tab creates a new page (dispatches `ADD_PAGE`)
- [ ] Right-click on tab → rename / delete options

---

### T19 · Multi-Select + Alignment Tools
**Depends on:** T09

- [ ] Change `selection` from `string | null` to `string[]`
- [ ] Shift+click adds/removes from selection; drag on empty canvas → rubber-band selection rect
- [ ] Show alignment toolbar when 2+ shapes selected
- [ ] Implement: align left/center/right, align top/middle/bottom, distribute H/V
- [ ] All alignment ops dispatch a single `MOVE_SHAPE_BATCH` action

---

### T20 · Shape Libraries / Stencils
**Depends on:** T16

- [ ] Convert Toolbar into a collapsible Shape Library panel
- [ ] Define library JSON format: `{ name: string, shapes: ShapeTemplate[] }`
- [ ] Add built-in libraries: Basic Shapes, Flowchart
- [ ] Render library sections as collapsible groups with miniature SVG tile previews

---

### T21 · Named Styles + Stroke/Shadow
**Depends on:** T10

- [ ] Add `strokeDash: solid | dashed | dotted` to `ShapeStyle`; render as SVG `stroke-dasharray`
- [ ] Add `shadow: boolean` to `ShapeStyle`; render as SVG `<filter>` drop-shadow
- [ ] Expose `styleSheet.namedStyles` in Properties Panel as a "Style Presets" dropdown
- [ ] Map new style fields in `DiagramMapper`

---

### T22 · Image Embedding
**Depends on:** T07, T11

- [ ] Handle image file drop on canvas: read as base64 data URL, dispatch `ADD_SHAPE` with `type: 'image'`
- [ ] Render `type: 'image'` shapes as SVG `<image>` elements
- [ ] In `DiagramMapper`, detect image shapes and route to ts-visio image embedding API

---

## Summary Table

| Task | Description | Depends on | Can parallel with |
|---|---|---|---|
| T01 | Monorepo setup | — | — |
| T02 | Shared Zod schema | T01 | — |
| T03 | Frontend scaffold (Vite) | T02 | T04 |
| T04 | Backend scaffold (Express) | T02 | T03 |
| T05 | Reducer + state | T03 | T06 |
| T06 | Canvas SVG shell + grid | T03 | T05 |
| T07 | ShapeElement components | T05, T06 | T10 |
| T08 | ConnectorElement + handles | T07 | T09, T10 |
| T09 | SelectionOverlay + resize | T07 | T08, T10 |
| T10 | Properties panel | T05 | T07, T08, T09 |
| T11 | DiagramMapper (ts-visio) | T04 | T03–T10 |
| T12 | Export route + health endpoint | T11 | T03–T10 |
| T13 | Local persistence | T05 | T14, T15 |
| T14 | Export button + download UI | T05, T12 | T13, T15 |
| T15 | Health polling + warning banner | T03, T04 | T13, T14 |
| T16 | Toolbar + shape palette | T05, T06 | T07–T10 |
| T17 | Undo / redo | T05 | T18–T22 |
| T18 | Multi-page UI | T05 | T17, T19–T22 |
| T19 | Multi-select + alignment | T09 | T17, T18, T20–T22 |
| T20 | Shape libraries / stencils | T16 | T17–T19, T21–T22 |
| T21 | Named styles + stroke/shadow | T10 | T17–T20, T22 |
| T22 | Image embedding | T07, T11 | T17–T21 |
