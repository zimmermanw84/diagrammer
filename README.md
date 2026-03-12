# Diagrammer

A client-side diagram editor with Visio export, built with TypeScript and React.

## Packages

| Package | Description |
|---|---|
| `@diagrammer/shared` | Zod schema, TypeScript types, and factories for the diagram data model |
| `@diagrammer/frontend` | React/Vite SVG-based diagram editor |
| `@diagrammer/backend` | Express API that exports diagrams as `.vsdx` files via ts-visio |

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

## Project Structure

```
diagrammer/
├── packages/
│   ├── shared/          # @diagrammer/shared — Zod schema + TypeScript types
│   │   └── src/
│   │       └── schema.ts
│   ├── frontend/        # @diagrammer/frontend — React/Vite editor
│   │   └── src/
│   │       └── App.tsx
│   └── backend/         # @diagrammer/backend — Express export API
│       └── src/
│           ├── index.ts
│           ├── routes/
│           └── middleware/
├── package.json         # Workspace root — shared scripts and devDependencies
├── tsconfig.base.json   # Shared TypeScript config (strict mode)
└── eslint.config.js     # Shared ESLint config (typescript-eslint + react-hooks)
```

## Architecture

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the full architecture, data model, API contract, and phased roadmap.

See [TASKS.md](./TASKS.md) for the task breakdown with dependency and parallelization notes.
