# Diagrammer

A client-side diagram editor with Visio export, built with TypeScript and React.

## Packages

| Package | Description |
|---|---|
| `@diagrammer/shared` | Zod schema, TypeScript types, and factories for the diagram data model |
| `@diagrammer/frontend` | React/Vite SVG-based diagram editor _(coming soon)_ |
| `@diagrammer/backend` | Express API that exports diagrams as `.vsdx` files via ts-visio _(coming soon)_ |

## Getting Started

**Prerequisites:** Node 20, npm 10

```bash
npm install
```

**Run all packages in dev mode:**

```bash
npm run dev
```

**Run all tests:**

```bash
npm test
```

**Build all packages:**

```bash
npm run build
```

## Architecture

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the full architecture, data model, API contract, and phased roadmap.

See [TASKS.md](./TASKS.md) for the task breakdown with dependency and parallelization notes.
