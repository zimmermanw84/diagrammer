# Clean-Up Plan

This document tracks bugs, type issues, magic constants, code duplication, and test gaps found during a post-MVP audit. Items are grouped by category and ordered by priority within each group.

---

## Bugs

### ~~B1 · Crash on corrupted `activePageId`~~ ✅
**Files:** `packages/frontend/src/App.tsx:21`, `packages/frontend/src/properties/PropertiesPanel.tsx:8`
**Issue:** Both files use a non-null assertion (`!`) on `pages.find(...)` for `activePageId`. If state is ever corrupted — e.g. a page is deleted while it is active — the app crashes at runtime with no recovery path.
**Fix:** Replace the assertion with a safe fallback: `?? state.document.pages[0]`.

---

### ~~B2 · Event listeners not cleaned up on unmount during drag~~ ✅
**File:** `packages/frontend/src/canvas/SelectionOverlay.tsx`
**Issue:** `window.addEventListener` calls inside `onHandleMouseDown` are only cleaned up on `mouseup`. If the component unmounts mid-drag (e.g. the selected shape is deleted via keyboard shortcut while a resize is in progress), the listeners are never removed, leaking memory and potentially firing callbacks on a stale component.
**Fix:** Move listener registration into a `useEffect` that returns a cleanup function, mirroring the pattern in `ConnectorDrawing.tsx`.

---

### ~~B3 · Unsafe enum casts from `<select>` values~~ ✅
**Files:** `packages/frontend/src/properties/StyleEditor.tsx:22,45`, `packages/frontend/src/properties/ConnectorStyleEditor.tsx:27,34,39`
**Issue:** HTML `<select>` values are plain strings. `e.target.value as ArrowHeadType` (and similar) trusts the cast without runtime validation. If a select option ever gets out of sync with the schema enum, invalid values silently enter state and will corrupt exported `.vsdx` files.
**Fix:** Validate with the corresponding Zod enum before dispatching, or use a type guard. For example: `ArrowHeadTypeSchema.parse(e.target.value)` inside a try/catch, ignoring invalid selections.

---

### B4 · `API_BASE` duplicated across two files
**Files:** `packages/frontend/src/toolbar/ExportButton.tsx:4`, `packages/frontend/src/toolbar/useHealthCheck.ts:3`
**Issue:** The same environment variable lookup (`import.meta.env["VITE_API_URL"] ?? "http://localhost:3001"`) is copy-pasted. If the default changes, both must be updated in sync.
**Fix:** Extract to `packages/frontend/src/config.ts` and import from there. (Also listed under Duplication.)

---

### ~~B5 · Orphaned connectors silently dropped~~ ✅
**File:** `packages/frontend/src/canvas/connectors/ConnectorLayer.tsx`
**Issue:** If a connector references a shape ID that no longer exists, it is silently skipped during render. There is no cleanup of dangling connector references when a shape is deleted.
**Fix:** In the `DELETE_SHAPE` reducer case, also filter out any connectors whose `fromShapeId` or `toShapeId` matches the deleted shape ID. This is the correct fix; the silent drop in the render layer can remain as a safety net but should no longer be reachable.

---

## Type Issues

### T1 · Unsafe `as` casts on `<select>` values
**Files:** `packages/frontend/src/properties/StyleEditor.tsx`, `packages/frontend/src/properties/ConnectorStyleEditor.tsx`
**Issue:** See B3. Same root cause — the type assertion is the type issue.
**Fix:** Validate at runtime (see B3 fix). Remove `as` casts once validation is in place.

---

### T2 · `e.target` cast without element check
**File:** `packages/frontend/src/canvas/useKeyboardShortcuts.ts:18`
**Issue:** `(e.target as HTMLElement).tagName` assumes `e.target` is an `HTMLElement`. It could be a `Document`, `Window`, or `SVGElement`, which would give unexpected results.
**Fix:** Use `e.target instanceof HTMLElement` as a guard before accessing `.tagName`.

---

### T3 · Implicit `{}` type on JSON error parse
**File:** `packages/frontend/src/toolbar/ExportButton.tsx:26`
**Issue:** `await res.json().catch(() => ({})) as { error?: string }` — the catch returns `{}` which is typed as `{ error?: string }` without validation. If the server returns a completely different error shape, `data.error` silently returns `undefined` and the fallback message is used.
**Fix:** Narrow the type with a type guard: `const msg = typeof data.error === "string" ? data.error : ...`.

---

### T4 · Missing connector label editing in `SET_LABEL` test coverage
**File:** `packages/frontend/src/state/reducer.test.ts`
**Issue:** The `SET_LABEL` reducer case handles both shapes and connectors, but the connector branch is not tested.
**Fix:** Add a test case that dispatches `SET_LABEL` for a connector ID and asserts the connector's label is updated. (Also listed under Test Gaps.)

---

## Magic Constants

### ~~M1 · Duplicated `API_BASE` constant~~ ✅
**Files:** `packages/frontend/src/toolbar/ExportButton.tsx:4`, `packages/frontend/src/toolbar/useHealthCheck.ts:3`
**Fix:** Extract to `packages/frontend/src/config.ts`:
```ts
export const API_BASE = import.meta.env["VITE_API_URL"] ?? "http://localhost:3001";
```

---

### ~~M2 · Duplicated SVG dash-array mapping~~ ✅
**Files:** `packages/frontend/src/canvas/shapes/shapeStyle.ts`, `packages/frontend/src/canvas/connectors/ConnectorElement.tsx`
**Issue:** An identical `DASH_ARRAYS` object (`solid: "none"`, `dashed: "8 4"`, `dotted: "2 4"`) is defined independently in two files.
**Fix:** Define once in `packages/frontend/src/canvas/canvasConstants.ts` and import in both files.

---

### M3 · Theme colours scattered inline
**Files:** `App.tsx`, `ShapePalette.tsx`, `ExportButton.tsx`, `OfflineBanner.tsx`, `PropertiesPanel.tsx`, `StyleEditor.tsx`, `ConnectorStyleEditor.tsx`, `CustomProperties.tsx`
**Issue:** Catppuccin palette values (`#1e1e2e`, `#313244`, `#45475a`, `#89b4fa`, `#f38ba8`, etc.) are repeated as inline strings throughout the component styles. A theme change requires a global search-and-replace.
**Fix:** Define a `THEME` constant object in `packages/frontend/src/config.ts` (or a dedicated `theme.ts`) and reference it in all style objects.

---

### M4 · Default shape drop size defined only in `App.tsx`
**File:** `packages/frontend/src/App.tsx:76-77`
**Issue:** The `width: 1, height: 1` defaults for a dropped shape are inline in the `onAddShape` callback. `ShapePalette.tsx` also has its own `DEFAULT_SIZE = 1` constant.
**Fix:** Consolidate into a single `DEFAULT_SHAPE_SIZE = 1` constant in `canvasConstants.ts` or `config.ts`.

---

## Code Duplication

### ~~D1 · Window event listener cleanup pattern repeated in five places~~ ✅
**Files:**
- `packages/frontend/src/canvas/Canvas.tsx`
- `packages/frontend/src/canvas/SelectionOverlay.tsx`
- `packages/frontend/src/canvas/shapes/ShapeElement.tsx`
- `packages/frontend/src/canvas/ConnectorDrawing.tsx`
- `packages/frontend/src/toolbar/ShapePalette.tsx`

**Issue:** Each file independently adds and removes a pair of `window` event listeners inside a `useEffect`, using the same pattern. Any mistake in the cleanup (see B2) is replicated across all sites.
**Fix:** Extract a `useWindowEvent(event, handler, enabled?)` hook:
```ts
function useWindowEvent<K extends keyof WindowEventMap>(
  event: K,
  handler: (e: WindowEventMap[K]) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  }, [event, handler, enabled]);
}
```

---

### ~~D2 · Test factory functions duplicated across test files~~ ✅
**Files:**
- `packages/frontend/src/state/reducer.test.ts` — `makeShapePayload`, `makeConnectorPayload`
- `packages/frontend/src/canvas/shapes/ShapeElement.test.tsx` — `makeShape`
- `packages/frontend/src/canvas/connectors/ConnectorElement.test.tsx` — `makeShape`, `makeConnector`
- `packages/frontend/src/canvas/connectors/ConnectorLayer.test.tsx` — `makeShape`

**Fix:** Create `packages/frontend/src/test-utils/fixtures.ts` exporting shared `makeShape`, `makeConnector`, `makeConnectorPayload`, and `makeShapePayload` factories.

---

### D3 · Properties panel input styles repeated
**Files:** `packages/frontend/src/properties/StyleEditor.tsx`, `ConnectorStyleEditor.tsx`, `CustomProperties.tsx`
**Issue:** Near-identical `inputStyle` and `labelStyle` inline style objects are defined in each properties file independently.
**Fix:** Extract to `packages/frontend/src/properties/panelStyles.ts` and import in all three.

---

## Test Gaps

### G1 · `DELETE_SHAPE` does not clean up connectors (untested behaviour)
**File:** `packages/frontend/src/state/reducer.test.ts`
**Issue:** The `DELETE_SHAPE` action currently leaves dangling connectors in state (see B5). There is no test asserting that deleting a shape also removes connected connectors.
**Fix:** Add the cleanup logic to the reducer (B5 fix), then add a test that verifies connectors referencing the deleted shape are removed.

---

### G2 · `SET_LABEL` connector branch not tested
**File:** `packages/frontend/src/state/reducer.test.ts`
**Issue:** `SET_LABEL` updates both shapes and connectors, but only the shape path is covered by tests.
**Fix:** Add a test dispatching `SET_LABEL` with a connector ID.

---

### G3 · `localStorage` write failure not tested
**File:** `packages/frontend/src/state/persistence.test.ts`
**Issue:** The silent `catch` in `usePersistence` is never exercised. A full `localStorage` or a private browsing context that throws on `setItem` would silently lose all saves.
**Fix:** Add a test that mocks `localStorage.setItem` to throw and asserts that the hook does not propagate the error.

---

### G4 · `loadSavedDocument` with partially valid data not tested
**File:** `packages/frontend/src/state/persistence.test.ts`
**Issue:** Only fully-valid and fully-invalid documents are tested. A document that is valid JSON but has one field with a wrong type (e.g. `meta.createdAt: 123`) is not covered.
**Fix:** Add a test with a partially-malformed fixture and assert `null` is returned.

---

### G5 · `ExportButton` with no network connection not tested
**File:** `packages/frontend/src/toolbar/ExportButton.test.tsx`
**Issue:** `fetch` rejecting with a `TypeError: Failed to fetch` (network-level failure, not an HTTP error) is not tested. The error toast should still show.
**Fix:** Add a test where `fetch` rejects with `new TypeError("Failed to fetch")` and assert the toast appears.

---

### G6 · `useHealthCheck` with `AbortSignal.timeout` unsupported not tested
**File:** `packages/frontend/src/toolbar/useHealthCheck.test.ts`
**Issue:** `AbortSignal.timeout` is relatively new. Environments that don't support it will throw synchronously, crashing the effect. Not covered in tests.
**Fix:** Add a test that stubs `AbortSignal.timeout` as `undefined` and confirms `isOnline` falls back gracefully.

---

### G7 · `ShapePalette` drop with negative resulting coordinates not tested
**File:** `packages/frontend/src/toolbar/ShapePalette.test.tsx`
**Issue:** Dropping near the top-left corner of the canvas can produce negative `x`/`y` values (shape partially off-page). The current tests only cover drops in the centre of the canvas.
**Fix:** Add a test asserting `onAddShape` is called with negative coordinates when the drop is near the canvas origin, confirming no clamping is silently applied (or adding clamping if desired).

---

### G8 · No smoke test for `OfflineBanner`
**File:** `packages/frontend/src/toolbar/OfflineBanner.tsx`
**Issue:** `OfflineBanner` has no test file at all. It is a simple component but its text content is referenced by the health check integration.
**Fix:** Add a minimal test confirming it renders the expected message text.

---

### G9 · Connector `RESET` action not tested in reducer
**File:** `packages/frontend/src/state/reducer.test.ts`
**Issue:** The new `RESET` action is not covered by any reducer test.
**Fix:** Add a test that adds shapes to state, dispatches `RESET`, and asserts state returns to the initial empty document.

---

### G10 · Backend `DiagramMapper` with multi-page document not tested
**File:** `packages/backend/src/services/DiagramMapper.test.ts`
**Issue:** All three existing tests use single-page documents. The multi-page code path in `DiagramMapper` (the `pageIndex > 0` branch) is untested.
**Fix:** Add a test fixture with two pages and assert the buffer is produced without error.

---

## Priority Order

| Priority | Item | Effort |
|---|---|---|
| ~~🔴 High~~ | ~~B5 — Delete shape cleans up connectors~~ | ~~Small~~ ✅ |
| ~~🔴 High~~ | ~~B1 — Crash on corrupted `activePageId`~~ | ~~Small~~ ✅ |
| ~~🔴 High~~ | ~~B3 / T1 — Enum cast validation in property editors~~ | ~~Small~~ ✅ |
| ~~🟠 Medium~~ | ~~B2 — Event listener leak on unmount during drag~~ | ~~Small~~ ✅ |
| ~~🟠 Medium~~ | ~~D1 — `useWindowEvent` hook~~ | ~~Medium~~ ✅ |
| ~~🟠 Medium~~ | ~~D2 — Shared test fixtures~~ | ~~Small~~ ✅ |
| ~~🟠 Medium~~ | ~~M1 / B4 — Centralise `API_BASE`~~ | ~~Small~~ ✅ |
| ~~🟠 Medium~~ | ~~M2 — Centralise SVG dash arrays~~ | ~~Small~~ ✅ |
| 🟡 Low | M3 — Theme colour constants | Medium |
| 🟡 Low | D3 — Properties panel shared styles | Small |
| 🟡 Low | T2 — `e.target` instanceof guard | Trivial |
| 🟡 Low | T3 — Narrow JSON error type | Trivial |
| 🟡 Low | G1–G10 — Test gaps (address alongside each fix) | Small each |
