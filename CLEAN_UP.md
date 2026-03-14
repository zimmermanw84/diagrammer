# Diagrammer — Code Cleanup & Bug Tracker

---

## Bugs

| ID | File | Issue | Status |
|----|------|-------|--------|
| B1 | `packages/frontend/src/state/reducer.ts` | **DELETE_PAGE off-by-one** — finds index in unfiltered array, uses it on filtered array; can crash or select wrong page | [x] |
| B2 | `packages/frontend/src/canvas/ConnectorDrawing.tsx` | `transformRef` initialized in `useEffect`, not `useRef()` — stale transform during first mount | [n/a] — false positive; `transformRef.current = transform` runs synchronously on every render, already correct |
| B3 | `packages/frontend/src/state/persistence.ts` | Silent `localStorage` failure when quota exceeded — user loses work with no warning | [x] |
| B4 | `packages/frontend/src/canvas/connectors/ConnectorElement.tsx` | Connector label color hardcoded to `#333` — ignores theme, invisible on dark canvas | [x] |
| B5 | `packages/frontend/src/toolbar/useHealthCheck.ts` | Initial `check()` has no AbortController — sets state after unmount | [x] |
| B6 | `packages/frontend/src/canvas/PageTabBar.tsx` | Right-click context menu position is not clamped to viewport — menu renders off-screen when tab is near bottom/edge of window | [x] |
| B7 | `packages/frontend/src/canvas/canvasConstants.ts` | `DEFAULT_SHAPE_SIZE` is a single value used for both width and height — default rectangles render as squares instead of rectangles | [x] |

---

## DRY Violations

| ID | Files | Issue | Status |
|----|-------|-------|--------|
| D1 | `ConnectorDrawing.tsx`, `SelectionOverlay.tsx`, `ShapePalette.tsx` | `(clientX - rect.left - t.x) / t.scale` duplicated in 3+ places — extract to `clientToSvgCoords()` util in `canvas/units.ts` | [x] |
| D2 | `toolbar/ConnectorDefaults.tsx`, `properties/ConnectorStyleEditor.tsx` | `ARROW_OPTIONS` defined twice with same values | [x] |
| D3 | `canvas/AlignmentToolbar.tsx` | `distributeH` and `distributeV` are identical logic on different axes — extract generic `distributeAlongAxis()` | [x] |
| D4 | `toolbar/ExportButton.tsx` vs `backend/src/routes/export.ts` | Filename sanitization regex differs between frontend and backend — risk of filename mismatch | [x] |

---

## Extraction Opportunities

| ID | Files | Issue | Status |
|----|-------|-------|--------|
| E1 | `canvas/connectors/ConnectorElement.tsx` | `rayPolygonEdge`, `shapeEdgePoint`, and `buildPath` all mixed into one 224-line file — extract to `canvas/geometry.ts` and `canvas/routing.ts` | [x] |
| E2 | `canvas/shapes/ShapeElement.tsx`, `canvas/ConnectorDrawing.tsx` | Inline global `mousemove`/`mouseup` listener pattern repeated — extract to `useGlobalMouseDrag()` hook | [x] |
| E3 | `canvas/Canvas.tsx` | Pan/zoom + rubber-band selection in one 245-line component — extract `usePanZoom()` and `useRubberBandSelection()` hooks | [x] |

---

## Type Issues

| ID | File | Issue | Status |
|----|------|-------|--------|
| T1 | `canvas/shapes/ShapeElement.tsx:108` | `@ts-expect-error` for `xmlns` on `<input>` inside `foreignObject` — find a proper typing solution | [ ] |
| T2 | `backend/src/services/DiagramMapper.ts` | `as string` cast on arrow head enum values — unsafe if ts-visio API changes | [ ] |
| T3 | `backend/src/services/DiagramMapper.ts` | `as Parameters<typeof visioPage.addShape>[0]["geometry"]` cast — silent breakage risk | [ ] |
