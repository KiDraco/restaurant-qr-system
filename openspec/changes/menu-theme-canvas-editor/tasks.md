## 1. Backend: Database Migration & Theme Model

- [ ] 1.1 Add `canvas_json`, `page_format`, `background_config` columns to `themes` table in `backend/src/config/database.js` migration block
- [ ] 1.2 Update `Theme` model (`backend/src/models/Theme.js`) to include new fields in `create`, `update`, `findById`, `findAll`, `findActive`, `getConfig`
- [ ] 1.3 Implement `getConfig` merge logic: canvas styles (colors, fonts, background) take precedence over legacy `config`
- [ ] 1.4 Add backward-compatible fallback in `getConfig` for themes with `canvas_json` = NULL
- [ ] 1.5 Run backend tests to verify model changes don't break existing functionality

## 2. Backend: Theme Controller & API

- [ ] 2.1 Update `themeController.js` to handle new fields in `listAll`, `getActive`, `create`, `update`
- [ ] 2.2 Ensure `create` accepts optional `canvas_json`, `page_format`, `background_config` with defaults
- [ ] 2.3 Ensure `update` allows partial updates of canvas fields
- [ ] 2.4 Verify API responses include new fields for all endpoints
- [ ] 2.4 Add input validation for canvas JSON structure in create/update
- [ ] 2.5 Run backend tests (45 tests) to verify API changes

## 3. Frontend: Dependencies & Setup

- [ ] 3.1 Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` via npm
- [ ] 3.2 Add feature flag `FEATURE_CANVAS_THEMES` to `.env` (default true for dev)
- [ ] 3.3 Create feature flag utility (`frontend/src/utils/featureFlags.js`)

## 4. Frontend: Canvas Core Components

- [ ] 4.1 Create `CanvasEditor` page component at `frontend/src/pages/admin/CanvasEditor.jsx` (route `/admin/themes/:id/edit`)
- [ ] 4.2 Create `Canvas` component (`frontend/src/components/admin/canvas/Canvas.jsx`) — fixed-size container (794×1123px), renders background, grid, elements
- [ ] 4.3 Create `useCanvas` hook (`frontend/src/hooks/useCanvas.js`) — manages elements state, selection, drag/resize handlers, history (stub)
- [ ] 4.4 Create `CanvasElement` polymorphic component (`frontend/src/components/admin/canvas/CanvasElement.jsx`) — renders element based on `type` prop
- [ ] 4.5 Create element type components: `ImageElement`, `TextElement`, `CategoryElement`, `ProductElement`, `SeparatorElement`, `DecorativeElement`, `LogoElement` under `frontend/src/components/admin/canvas/elements/`

## 5. Frontend: Drag & Drop with @dnd-kit

- [ ] 5.1 Wrap `Canvas` with `DndContext` from `@dnd-kit/core`
- [ ] 5.2 Implement `KeyboardSensor` + `PointerSensor` for drag
- [ ] 5.3 Add `useDraggable` to `CanvasElement` for move
- [ ] 5.4 Implement resize handles with custom sensor (not sortable — custom resize logic)
- [ ] 5.5 Add collision detection to constrain elements within canvas bounds
- [ ] 5.6 Implement snap-to-grid (8px grid, 4px threshold) in drag/resize handlers
- [ ] 5.7 Add layer ordering: context menu (Bring to Front, Send to Back, etc.) + layers panel drag-to-reorder

## 6. Frontend: Element Palette & Toolbar

- [ ] 6.1 Create `ElementPalette` sidebar (`frontend/src/components/admin/canvas/ElementPalette.jsx`) with 7 element type buttons
- [ ] 6.2 Implement "Add element" action: inserts at default position (centered, staggered)
- [ ] 6.2 Add toolbar: grid toggle, undo/redo (stub), zoom controls
- [ ] 6.3 Add "Nuevo Theme" button in `ThemeList` that POSTs to `/api/theme` and navigates to `/admin/themes/:id/edit`

## 7. Frontend: Property Panel

- [ ] 7.1 Create `ElementPropertiesPanel` right sidebar (`frontend/src/components/admin/canvas/ElementPropertiesPanel.jsx`)
- [ ] 7.2 Show canvas-level settings (page format, background, grid) when no selection
- [ ] 7.3 Show type-specific controls for selected element: text inputs, number inputs, color pickers, select dropdowns, toggles, file input for images
- [ ] 7.4 Implement real-time updates: onChange/onBlur updates element in `useCanvas` state
- [ ] 7.5 Add validation: inline errors for invalid values (negative numbers, bad hex, opacity range)
- [ ] 7.6 Create `ImageCropperModal` for crop/scale editing on Image elements

## 8. Frontend: Theme Persistence & Integration

- [ ] 8.1 Update `services/api.js` theme methods to handle `canvas_json`, `page_format`, `background_config`
- [ ] 8.2 Update `hooks/useTheme.js` to extract styles from `canvas_json` (or fallback to `config`) and inject CSS variables
- [ ] 8.3 Update `ThemeList` to show canvas thumbnail preview (200px) when `canvas_json` exists; fallback to color swatches
- [ ] 8.4 Update `ThemeList` "Duplicar" action to copy `canvas_json` and all canvas fields
- [ ] 8.5 Add "Exportar" / "Importar" actions in `ThemeList` for theme JSON files
- [ ] 8.6 Update `ThemesManager` routing: "Nuevo Theme" → create → redirect to CanvasEditor; "Editar" → CanvasEditor

## 9. Frontend: Routing & Navigation

- [ ] 9.1 Add route `/admin/themes/new` → creates theme via API → redirects to `/admin/themes/:id/edit`
- [ ] 9.2 Add route `/admin/themes/:id/edit` → renders `CanvasEditor`
- [ ] 9.3 Protect routes with existing admin auth (`verifyToken`, `requireRole`)
- [ ] 9.3 Update `App.jsx` routes to include new admin routes

## 10. Frontend: Styling & Polish

- [ ] 10.1 Style Canvas: page shadow, grid lines (CSS), selection box, resize handles (Tailwind)
- [ ] 10.2 Style ElementPalette: icons (Lucide), hover states, tooltips
- [ ] 10.3 Style PropertyPanel: grouped sections, labeled inputs, color picker (native `<input type="color">` + custom opacity)
- [ ] 10.4 Style layers panel: draggable list items, layer visibility toggles, lock toggles
- [ ] 10.4 Add responsive adjustments: CanvasEditor desktop-only; sidebar collapsible
- [ ] 10.5 Add loading states, error boundaries, empty states

## 11. Testing & Verification

- [ ] 11.1 Run backend tests: `cd backend && npm test` (all 45 tests pass)
- [ ] 11.2 Run frontend build: `cd frontend && npm run build` (compiles without errors)
- [ ] 11.3 Manual test: "Nuevo Theme" creates theme → opens CanvasEditor → add elements → save → reopen → verify persistence
- [ ] 11.4 Manual test: legacy theme (no canvas_json) opens in editor with empty canvas, colors from config
- [ ] 11.5 Manual test: active theme applies canvas colors/fonts to public menu (`ClientMenu.jsx`)
- [ ] 11.6 Manual test: ThemeList shows canvas thumbnails and color swatch fallback
- [ ] 11.7 Manual test: Export/Import theme JSON works
- [ ] 11.8 Manual test: Drag, resize, snap, layer ordering, delete, duplicate all work
- [ ] 11.9 Test keyboard accessibility: Tab navigation, arrow keys move selection, Delete removes, Ctrl+D duplicates
- [ ] 11.10 Cross-browser test: Chrome, Firefox, Safari (drag, color picker, file input)

## 12. Migration & Deployment

- [ ] 12.1 Verify database migration runs idempotently on existing Turso DB (run `initializeDatabase`)
- [ ] 12.2 Test feature flag: `FEATURE_CANVAS_THEMES=false` hides CanvasEditor, falls back to old ThemeEditor
- [ ] 12.3 Build production: `cd frontend && npm run build` → verify bundle size acceptable
- [ ] 12.4 Deploy to Netlify: push to master, verify auto-deploy, check function logs
- [ ] 12.5 Smoke test production: create theme, edit canvas, save, view public menu with theme

## 13. Documentation & Cleanup

- [ ] 13.1 Update README with Canvas Editor usage guide
- [ ] 13.2 Add JSDoc comments to new hooks/components
- [ ] 13.3 Remove feature flag after verification period (or keep for safety)
- [ ] 13.4 Archive this change: `openspec archive menu-theme-canvas-editor`