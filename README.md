# Diagrammer

A client-side diagram editor with Visio export, built with TypeScript and React.

## Packages

| Package | Description |
|---|---|
| `@diagrammer/shared` | Zod schema, TypeScript types, and factories for the diagram data model |
| `@diagrammer/frontend` | React/Vite SVG-based diagram editor |
| `@diagrammer/backend` | Express API that exports diagrams as `.vsdx` files via ts-visio |

## Features

- **Shape palette** — two libraries (Basic Shapes and Flowchart) with drag-to-canvas; shapes include rectangle, ellipse, diamond, rounded rectangle, triangle, parallelogram, and flowchart symbols (process, decision, terminator, data, start/end)
- **Canvas** — infinite SVG canvas with zoom (scroll wheel) and pan (space+drag or middle-click+drag)
- **Selection** — click to select; resize with 8 handles; delete with the Delete key
- **Connectors** — drag from a shape's N/E/S/W handle to another shape; straight, right-angle, and curved routing
- **Label editing** — double-click any shape or connector to edit inline
- **Properties panel** — edit fill, stroke, font, and custom key-value properties for the selected element
- **Local persistence** — diagram auto-saves to `localStorage` (debounced 300 ms); restored on page reload
- **New Diagram** — clears the canvas after a confirmation prompt
- **Export to Visio** — one-click export of the full diagram as a `.vsdx` file via the backend
- **Offline banner** — frontend polls the backend health endpoint every 5 s and shows a warning banner + disables export if unreachable

## Prerequisites

- **Node 20** (pinned via `.nvmrc` — run `nvm use` if you use nvm)
- **npm 10**

## Getting Started

```bash
npm install
```

## Development

Start all packages in parallel with labeled, color-coded output:

```bash
npm run dev
```

| Stream | Process | URL |
|---|---|---|
| `shared` | `tsc --watch` — recompiles schema on changes | — |
| `frontend` | Vite dev server | http://localhost:5173 |
| `backend` | `tsx watch` — restarts on changes | http://localhost:3001 |

Or run a single package:

```bash
npm run dev -w @diagrammer/frontend
npm run dev -w @diagrammer/backend
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001` | Backend base URL used by the frontend for export and health polling |
| `PORT` | `3001` | Port the backend listens on |
| `ALLOWED_ORIGIN` | `http://localhost:5173` | CORS allowed origin for the backend |

## Testing

Run all tests across every package:

```bash
npm test
```

Or target a single package:

```bash
npm test -w @diagrammer/shared
npm test -w @diagrammer/frontend
npm test -w @diagrammer/backend
```

Tests use **Vitest** throughout. The frontend uses `happy-dom`; the backend uses `supertest` for HTTP integration tests.

## Building

```bash
npm run build
```

> The shared package must be built before the frontend or backend, as both import from `@diagrammer/shared/dist`. The CI workflow handles this ordering automatically.

## API

The backend exposes a minimal REST API at `http://localhost:3001/api/v1`:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Health check — returns `{ status: "ok" }` |
| `POST` | `/api/v1/export/vsdx` | Export a `DiagramDocument` as a `.vsdx` file |

The `POST /export/vsdx` body must be a valid `DiagramDocument` (defined in `@diagrammer/shared`). Returns a binary `.vsdx` file on success, or a JSON error envelope on failure.

### Export pipeline

```
DiagramDocument (JSON)
  └─► DiagramMapper.toVsdx()   packages/backend/src/services/DiagramMapper.ts
        └─► ts-visio             builds the OPC/OOXML .vsdx package in memory
              └─► Buffer          returned as application/vnd.ms-visio.drawing
```

**Shape types** — all six schema types are supported: `rectangle`, `ellipse`, `diamond`, `rounded_rectangle`, `triangle`, `parallelogram`.

**Connectors** — straight, right-angle (orthogonal), and curved routing; independent start and end arrow head types: `none`, `open`, `filled` (solid triangle), `crowsfoot`, `one`; line style: solid, dashed, or dotted.

**Coordinate system** — the schema stores shapes with `(x, y)` as the **top-left corner in inches** using an SVG-style top-down Y axis. `DiagramMapper` converts to Visio's center-pin / Y-up coordinate system internally.

## Project Structure

```
diagrammer/
├── packages/
│   ├── shared/              # @diagrammer/shared — Zod schema + TypeScript types
│   │   └── src/
│   │       └── schema.ts
│   ├── frontend/            # @diagrammer/frontend — React/Vite editor
│   │   └── src/
│   │       ├── App.tsx
│   │       ├── state/       # useReducer + DiagramProvider context + localStorage persistence
│   │       ├── canvas/      # SVG canvas, zoom/pan, shape/connector layers, selection overlay
│   │       │   ├── shapes/
│   │       │   └── connectors/
│   │       ├── toolbar/     # Shape palette, export button, health check hook, offline banner
│   │       └── properties/  # Properties panel (style editor, connector editor, custom props)
│   └── backend/             # @diagrammer/backend — Express export API
│       └── src/
│           ├── index.ts
│           ├── routes/
│           ├── middleware/
│           └── services/    # DiagramMapper — converts DiagramDocument → .vsdx
├── package.json             # Workspace root — shared scripts and devDependencies
├── tsconfig.base.json       # Shared TypeScript config (strict mode)
└── eslint.config.js         # Shared ESLint config (typescript-eslint + react-hooks)
```

## Architecture

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the full architecture, data model, API contract, and phased roadmap.

See [TASKS.md](./TASKS.md) for the task breakdown with dependency and parallelization notes.
