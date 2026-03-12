# Diagrammer — Client-Side Diagram Tool with Visio Export

**Date:** 2026-03-11
**Stack:** TypeScript · React · Node.js · ts-visio
**Philosophy:** Start simple, build incrementally. Each phase is independently shippable.

---

## Table of Contents

1. [Repository Structure](#1-repository-structure)
2. [Shared Data Model](#2-shared-data-model)
3. [API Contract](#3-api-contract)
4. [Phase 1 — Minimal Viable Editor](#4-phase-1--minimal-viable-editor)
5. [Phase 2 — Export Pipeline](#5-phase-2--export-pipeline)
6. [Phase 3 — Enhancements](#6-phase-3--enhancements)
7. [Dependency Graph](#7-dependency-graph)
8. [Open Questions & Decisions Log](#8-open-questions--decisions-log)

---

## 1. Repository Structure

### Decision: Monorepo

Use a single monorepo managed with **npm workspaces**. Rationale:

- The shared data model (`@diagrammer/shared`) is consumed by both the frontend and backend with no duplication.
- A single `tsconfig` base, single lint config, and single CI pipeline.
- No need for a separate publish step for internal packages.
- Avoids version-drift between the frontend's understanding of a diagram and the backend's.

Reject separate repos: the API contract and shared types would require a publish cycle or git submodules, adding friction at this early stage.

```
diagrammer/
├── package.json                  # workspace root
├── tsconfig.base.json
├── packages/
│   ├── shared/                   # @diagrammer/shared
│   │   ├── package.json
│   │   └── src/
│   │       └── schema.ts         # canonical DiagramDocument type + Zod schema
│   ├── frontend/                 # React app (Vite)
│   │   ├── package.json
│   │   └── src/
│   └── backend/                  # Node.js Express service
│       ├── package.json
│       └── src/
└── .github/
    └── workflows/ci.yml
```

**Tooling choices:**

| Concern | Choice | Reason |
|---|---|---|
| Frontend bundler | Vite | Fast HMR, first-class TS support |
| Backend framework | Express 5 | Minimal surface, familiar, easy to swap |
| Schema validation | Zod | Runtime validation + static type inference from one definition |
| Testing | Vitest | Works in both packages, same config as ts-visio itself |
| Linting | ESLint + typescript-eslint | Shared config at root |

---

## 2. Shared Data Model

The canonical representation of a diagram lives in `@diagrammer/shared`. This JSON structure is the single source of truth: it is what the frontend stores in React state, what it sends to the backend, and what the backend maps onto ts-visio calls.

### 2.1 Core Types

```
DiagramDocument
├── id: string (uuid)
├── meta: DocumentMeta
├── pages: DiagramPage[]
└── styleSheet: StyleSheet

DocumentMeta
├── title: string
├── author: string
├── description: string
└── createdAt: ISO8601 string

DiagramPage
├── id: string
├── name: string
├── width: number          (inches, matches Visio coordinate space)
├── height: number
├── shapes: DiagramShape[]
└── connectors: DiagramConnector[]

DiagramShape
├── id: string
├── type: ShapeType        (enum — see below)
├── x: number              (inches from bottom-left)
├── y: number
├── width: number
├── height: number
├── label: string
├── style: ShapeStyle
├── properties: Record<string, string>   (custom shape data, key-value)
└── parentId?: string      (for grouped/nested shapes)

ShapeType (enum)
  rectangle | ellipse | diamond | rounded_rectangle |
  triangle | parallelogram | image

DiagramConnector
├── id: string
├── fromShapeId: string
├── toShapeId: string
├── label: string
├── style: ConnectorStyle
└── routing: RoutingAlgorithm   (straight | curved | right_angle)

ShapeStyle
├── fillColor: string      (hex)
├── strokeColor: string
├── strokeWidth: number
├── fontFamily: string
├── fontSize: number
├── fontColor: string
├── bold: boolean
├── italic: boolean
└── textAlign: left | center | right

ConnectorStyle
├── strokeColor: string
├── strokeWidth: number
├── arrowStart: ArrowHeadType
└── arrowEnd: ArrowHeadType

ArrowHeadType (enum)
  none | open | filled | crowsfoot | one

StyleSheet
└── namedStyles: Record<string, Partial<ShapeStyle>>
```

### 2.2 Design Decisions

**Coordinate system:** Use inches (floating point) to match Visio's native coordinate space. The frontend canvas renders at a configurable pixels-per-inch (PPI) zoom factor — typically 96px/inch at 100% zoom. This means the frontend never stores pixel coordinates; it always stores physical coordinates and converts at render time.

**Connectors are top-level, not embedded in shapes.** This mirrors how Visio models connections (`VisioConnect`) and avoids the complexity of updating both endpoints when a shape moves.

**`properties` on shapes** is a free-form key-value map. This directly maps to Visio's custom shape data (ShapeData cells). In Phase 1 this is editable as plain text. In Phase 3 it can be given typed schema.

**No pixel coordinates at the API boundary.** The backend never sees or cares about viewport, zoom, or screen coordinates.

### 2.3 Zod Schema

The Zod schema in `packages/shared/src/schema.ts` defines all types above and exports:

- `DiagramDocumentSchema` — the root validator
- Inferred TypeScript types for each entity
- A `createEmptyDocument()` factory that returns a valid default `DiagramDocument`

Both packages import `@diagrammer/shared` and use these types and the validator. The backend runs `DiagramDocumentSchema.parse(req.body)` before any ts-visio call, returning a structured 422 if the payload is invalid.

---

## 3. API Contract

The backend exposes a small, focused REST API. No GraphQL, no WebSockets — not needed at this stage.

### Base URL

`http://localhost:3001/api/v1`

### Endpoints

#### `POST /export/vsdx`

Export a diagram as a `.vsdx` file.

**Request**

```
Content-Type: application/json

Body: DiagramDocument (the full shared schema)
```

**Response (success)**

```
Status: 200 OK
Content-Type: application/vnd.ms-visio.drawing
Content-Disposition: attachment; filename="{meta.title}.vsdx"

Body: binary .vsdx file
```

**Response (validation failure)**

```
Status: 422 Unprocessable Entity
Content-Type: application/json

Body: { error: string, issues: ZodIssue[] }
```

**Response (export failure)**

```
Status: 500 Internal Server Error
Content-Type: application/json

Body: { error: string, detail: string }
```

#### `GET /health`

Returns `200 OK` with `{ status: "ok" }`. Used by the frontend to detect if the backend is running and show a UI warning if not.

### CORS Policy

In development, the backend allows `http://localhost:5173` (Vite dev server). In production, configure via environment variable `ALLOWED_ORIGIN`.

### Error Envelope

All error responses follow a consistent shape:

```
{
  error: string,          // human-readable summary
  issues?: ZodIssue[],    // present on 422 only
  detail?: string         // present on 500 only (stack trace in dev)
}
```

---

## 4. Phase 1 — Minimal Viable Editor

**Goal:** A working canvas where a user can place shapes, connect them, and edit labels. No export yet. Ship this first.

### 4.1 Frontend Architecture

The frontend is a single-page React application with no routing in Phase 1.

**State Management:** Use React's built-in `useReducer` at the top level with a single `DiagramDocument` as the state shape. This keeps the state serializable and directly aligned with the shared schema. Do not reach for a state management library until Phase 3.

**Rendering:** Use an SVG canvas element for the diagram surface. SVG is chosen over HTML5 Canvas (`<canvas>`) because:

- Shapes remain DOM elements — drag-and-drop, selection, and property inspection work with standard event listeners without custom hit-testing.
- SVG scales cleanly with CSS transforms for zoom.
- Connectors as SVG `<path>` or `<line>` elements can reference shape positions.

Avoid introducing a diagram library (e.g., React Flow, Konva) in Phase 1. Building the minimal primitives directly avoids abstraction lock-in and ensures the data model remains in control.

### 4.2 Component Breakdown

```
App
├── DiagramProvider           (useReducer, provides DiagramDocument context)
├── Toolbar                   (shape palette — drag source)
├── PropertiesPanel           (shows/edits selected shape or connector props)
├── Canvas
│   ├── CanvasBackground      (grid lines, SVG defs)
│   ├── ShapeLayer            (renders all DiagramShapes)
│   │   └── ShapeElement      (single shape — rect/ellipse/diamond/etc.)
│   ├── ConnectorLayer        (renders all DiagramConnectors)
│   │   └── ConnectorElement  (SVG path between two shapes)
│   └── SelectionOverlay      (bounding box, resize handles)
└── StatusBar                 (zoom, coordinates, backend health indicator)
```

### 4.3 Interaction Model

**Placing a shape:** Drag a shape tile from the Toolbar onto the Canvas. The drop converts pixel coordinates to inch coordinates using the current PPI/zoom. Dispatches `ADD_SHAPE` action.

**Selecting:** Click a shape to select it. Click empty canvas to deselect. The selected shape's id is stored in a `selection: string | null` field on the reducer's UI state (kept separate from the `DiagramDocument` — UI state does not round-trip to the backend).

**Moving:** Mousedown on a selected shape starts a drag. Mousemove computes delta in inches. Mouseup commits. Dispatches `MOVE_SHAPE`.

**Connecting:** Hovering near a shape reveals connection point handles (small circles at cardinal positions). Dragging from a connection point to another shape creates a connector. Dispatches `ADD_CONNECTOR`.

**Labels:** Double-click a shape or connector enters inline text editing mode using a positioned `<foreignObject>` containing an `<input>`. Blur commits. Dispatches `SET_LABEL`.

**Properties Panel:** When a shape is selected, the panel renders its `style` fields as color pickers and inputs, and its `properties` map as an editable key-value list. All changes dispatch typed actions.

### 4.4 Reducer Actions (Phase 1)

```
ADD_SHAPE        { shape: Omit<DiagramShape, 'id'> }
MOVE_SHAPE       { id, dx, dy }
RESIZE_SHAPE     { id, width, height }
DELETE_SHAPE     { id }
SET_LABEL        { id, label }
UPDATE_STYLE     { id, style: Partial<ShapeStyle> }
SET_PROPERTY     { id, key, value }
DELETE_PROPERTY  { id, key }
ADD_CONNECTOR    { connector: Omit<DiagramConnector, 'id'> }
DELETE_CONNECTOR { id }
ADD_PAGE         { page: Omit<DiagramPage, 'id' | 'shapes' | 'connectors'> }
SET_ACTIVE_PAGE  { pageId }
```

### 4.5 Local Persistence

At the end of Phase 1, serialize the `DiagramDocument` to `localStorage` on every reducer dispatch. Restore on app load. This provides basic session persistence without a backend save endpoint. Use a debounce of 300ms to avoid excessive writes.

---

## 5. Phase 2 — Export Pipeline

**Goal:** The user can click "Export to Visio" and receive a `.vsdx` file.

### 5.1 Frontend Changes

Add an "Export" button to the Toolbar. On click:

1. Read the current `DiagramDocument` from the reducer.
2. Call `POST /api/v1/export/vsdx` with the document as JSON body.
3. Show a loading state on the button.
4. On success (200), receive the binary response and trigger a browser download using `URL.createObjectURL` on a `Blob`.
5. On failure (422 or 500), show an error toast with the message from the error envelope.

The `StatusBar` health indicator (from Phase 1) now actively polls `GET /health` every 5 seconds and shows a warning banner if the backend is unreachable, disabling the Export button.

### 5.2 Backend Implementation

The backend has a single Express router mounted at `/api/v1`.

**Export Handler — responsibilities:**

1. Parse and validate the request body with `DiagramDocumentSchema.parse()`.
2. Call the `DiagramMapper` service, which translates the `DiagramDocument` into ts-visio API calls.
3. Pipe the resulting buffer as the HTTP response.

**DiagramMapper — the translation layer**

This is the most important backend module. It is a pure function:

```
DiagramMapper.toVsdx(doc: DiagramDocument): Promise<Buffer>
```

Internal steps:

1. `VisioDocument.create()` — instantiate a new Visio document.
2. Set document metadata: title, author, description from `doc.meta`.
3. For each `DiagramPage` in `doc.pages`:
   - Add a page to the Visio document.
   - For each `DiagramShape` on the page, call `page.addShape()` mapping all fields:
     - `x`, `y`, `width`, `height` pass through directly (both systems use inches).
     - `label` maps to `text`.
     - `style.fillColor`, `style.strokeColor`, `style.fontSize`, `style.bold`, `style.italic`, `style.fontColor` map 1:1.
     - `type` maps to a Visio shape type enum.
     - `properties` maps to custom shape data cells.
     - Track a `Map<diagramShapeId, visioShape>` for the connector pass.
   - For each `DiagramConnector` on the page, resolve both endpoint shapes from the map, then call `fromShape.connectTo(toShape, arrowStart, arrowEnd)`.
     - Map `connector.style.arrowStart` and `arrowEnd` to `ArrowHeads` enum values from ts-visio.
4. Call `doc.save()` and return the resulting buffer.
5. Errors from ts-visio propagate as 500.

**Shape type mapping table:**

| DiagramShape.type | ts-visio equivalent |
|---|---|
| rectangle | default rect shape |
| ellipse | ellipse shape |
| diamond | diamond shape |
| rounded_rectangle | rounded rect shape |
| triangle | triangle shape |
| parallelogram | parallelogram shape |

**Why a mapper, not inline code in the route handler:** The mapper is independently testable. In Phase 3, the mapper gains more complexity (layers, masters, groups). Keeping it separate protects the route handler from growing.

### 5.3 Backend Project Structure

```
packages/backend/src/
├── index.ts               (Express app setup, CORS, middleware)
├── routes/
│   ├── health.ts
│   └── export.ts          (route handler)
├── services/
│   └── DiagramMapper.ts   (the ts-visio translation layer)
└── middleware/
    └── errorHandler.ts    (global Express error handler)
```

### 5.4 Testing the Export Pipeline

- Unit test `DiagramMapper` with a minimal `DiagramDocument` fixture, asserting it produces a non-empty buffer without throwing.
- Integration test the `POST /export/vsdx` endpoint using `supertest`, asserting the response content-type and that the body is non-empty binary data.
- Do not attempt to open and parse the resulting `.vsdx` in tests — that would couple tests to ts-visio's output format. Trust the library.

---

## 6. Phase 3 — Enhancements

**Goal:** Make the editor genuinely useful for real work.

Each sub-feature below is independent and can be sequenced based on user feedback.

### 6.1 Undo / Redo

Replace the bare `useReducer` with a wrapped version that maintains `past: DiagramDocument[]` and `future: DiagramDocument[]` stacks alongside the present state. On every mutating action, push the previous state to `past` and clear `future`. Dispatch `UNDO` and `REDO` actions to travel the stacks. Cap `past` at 50 entries.

Wire `Ctrl+Z` / `Ctrl+Y` (and `Cmd` equivalents on macOS) globally using a `useEffect` keydown listener.

This approach works because the `DiagramDocument` is a serializable value — deep-cloning it on each action is acceptable given its typical size.

### 6.2 Shape Libraries / Stencils

Add a collapsible **Shape Library** panel to the left of the canvas. In Phase 1, the Toolbar has a flat list of basic shapes. In Phase 3, shapes are organized into named libraries (e.g., "Basic Shapes", "Network", "Database", "Flowchart").

Each library is a static JSON file in `packages/frontend/src/libraries/`. Adding a new library requires only adding a new JSON file and importing it — no backend involvement.

Each shape tile in the library panel is a miniature SVG preview rendered using the same `ShapeElement` component as the canvas, at a fixed 40×40px size.

### 6.3 Alignment Tools

Add an alignment toolbar (visible when two or more shapes are selected). Support:

- Align left / center / right edges
- Align top / middle / bottom edges
- Distribute horizontally / vertically

Multi-select is implemented by changing `selection` from `string | null` to `string[]`. All alignment operations dispatch a single `MOVE_SHAPE_BATCH` action with an array of `{ id, dx, dy }` entries, so undo treats the entire alignment as one operation.

### 6.4 Styling Improvements

- **Named styles:** Expose the `DiagramDocument.styleSheet.namedStyles` map in the UI as a "Style Presets" dropdown in the Properties Panel. Applying a named style dispatches `APPLY_NAMED_STYLE`, which merges the preset's `Partial<ShapeStyle>` into the shape's current style.
- **Stroke dash patterns:** Add `strokeDash: solid | dashed | dotted` to `ShapeStyle`. Map to SVG `stroke-dasharray` on the frontend and to Visio line pattern on the backend.
- **Shadow:** Add `shadow: boolean` to `ShapeStyle`. Simple drop-shadow via SVG filter on the frontend; mapped to Visio shadow style on the backend.

### 6.5 Multi-Page Support

Phase 1 supports pages in the data model but the UI only shows one page. Phase 3 adds:

- A **page tab bar** at the bottom of the canvas.
- Clicking a tab sets the active page (local UI state only — does not change the document, just which page is rendered).
- A "+" button adds a new page (dispatches `ADD_PAGE`).
- Right-click on a tab exposes rename and delete options.

### 6.6 Image Embedding

Allow dragging an image file from the OS onto the canvas. On drop:

- Read the file as a base64 data URL.
- Store `{ type: 'image', src: string (data URL) }` on the shape.
- Render as an SVG `<image>` element on the frontend.
- On the backend, ts-visio's image embedding API receives the base64-decoded buffer.

Keep image data in the `DiagramDocument` JSON. For very large diagrams with many images, a future iteration could upload images separately and reference them by URL — but this is out of scope for Phase 3.

---

## 7. Dependency Graph

```
Phase 1 prerequisites: none
Phase 2 prerequisites: Phase 1 complete, ts-visio installed and verified
Phase 3 prerequisites: Phase 2 complete

Within Phase 3, order of implementation by value/complexity:
  High value, low complexity: Undo/Redo, Multi-Page UI, Alignment
  High value, high complexity: Shape Libraries, Image Embedding
  Lower urgency: Named Styles, Stroke/Shadow styling
```

---

## 8. Open Questions & Decisions Log

| Question | Decision | Rationale |
|---|---|---|
| Monorepo vs. separate repos | Monorepo (npm workspaces) | Shared types, single CI, no publish overhead |
| Canvas rendering: SVG vs. Canvas API vs. library | SVG, no library in Phase 1 | DOM events, no hit-testing, avoids lock-in |
| State management: Redux vs. Zustand vs. useReducer | useReducer in Phase 1; re-evaluate at Phase 3 | YAGNI; reducer is already needed for undo/redo stacks |
| Backend framework | Express 5 | Minimal, well-known; ts-visio is Node-only so browser-side export is not possible |
| Coordinate system | Inches (float) in data model, px only in render | Visio native units; avoids DPI bugs at export time |
| File save (session persistence) | localStorage in Phase 1 | No backend save endpoint needed; defer database to future |
| ts-visio version pinning | Pin to exact version | Library is experimental; avoid surprise breakage from patch updates |
| Connector endpoint model | Connectors reference shape IDs, not coordinates | Shape moves don't require connector updates; backend resolves at export time |
| Multi-select data structure | `string[]` in UI state | Not part of `DiagramDocument`; doesn't pollute the shared schema |
| Backend deployment | Local only (localhost:3001) in all phases | Export requires Node.js and ts-visio; no browser-side fallback |

---

## Critical Files for Implementation

- `packages/shared/src/schema.ts` — Core logic: the Zod schema and TypeScript types that every other file in both packages imports. Getting this right first prevents rework downstream.
- `packages/frontend/src/state/reducer.ts` — All diagram mutations flow through this reducer. Its action types define the full surface area of the editor's capabilities.
- `packages/frontend/src/components/Canvas/index.tsx` — The SVG canvas and interaction model (drag, select, connect). The most complex frontend component and the first to build in Phase 1.
- `packages/backend/src/services/DiagramMapper.ts` — The translation layer between the shared schema and ts-visio API calls. All backend logic lives here; the route handler is thin.
- `packages/backend/src/routes/export.ts` — The API boundary: request validation, mapper invocation, binary streaming response. Defines the exact contract the frontend consumes.
